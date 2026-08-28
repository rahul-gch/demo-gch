import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { FeedComment, FeedKind, FeedMedia, FeedPost } from "@/lib/feed-types";

const KINDS = [
  "update",
  "regulation",
  "investment",
  "partnership",
  "event",
  "ai-news",
  "photo",
  "video",
  "document",
] as const;

const mediaSchema = z.object({
  type: z.enum(["photo", "video", "document"]),
  label: z.string(),
  url: z.string().optional(),
  mime: z.string().optional(),
  sizeBytes: z.number().optional(),
});

/** Recent feed posts, optionally scoped to one organization. */
export const listFeedPosts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid().nullable().optional(),
        limit: z.number().max(200).optional(),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }): Promise<FeedPost[]> => {
    const { supabase, userId } = context;

    let q = supabase
      .from("feed_posts")
      .select(
        "id, org_id, author_name, author_role, kind, title, body, media, event_at, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.orgId) q = q.eq("org_id", data.orgId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    if (!rows || rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const orgIds = Array.from(new Set(rows.map((r) => r.org_id)));

    const [{ data: likes }, { data: comments }, { data: orgs }] = await Promise.all([
      supabase.from("feed_likes").select("post_id, user_id").in("post_id", ids),
      supabase
        .from("feed_comments")
        .select("id, post_id, author_name, author_role, body, created_at")
        .in("post_id", ids)
        .order("created_at", { ascending: true }),
      supabase.from("orgs").select("id, name, legacy_id").in("id", orgIds),
    ]);

    const orgById = new Map((orgs ?? []).map((o) => [o.id, o]));
    const likeCount = new Map<string, number>();
    const likedByMe = new Set<string>();
    for (const l of likes ?? []) {
      likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
      if (l.user_id === userId) likedByMe.add(l.post_id);
    }
    const commentsByPost = new Map<string, FeedComment[]>();
    for (const c of comments ?? []) {
      const list = commentsByPost.get(c.post_id) ?? [];
      list.push({
        id: c.id,
        author: c.author_name,
        role: c.author_role ?? "",
        body: c.body,
        at: c.created_at,
      });
      commentsByPost.set(c.post_id, list);
    }

    return rows.map((r) => {
      const org = orgById.get(r.org_id);
      return {
        id: r.id,
        orgId: org?.legacy_id ?? r.org_id,
        orgUuid: r.org_id,
        authorName: r.author_name,
        authorRole: r.author_role ?? "",
        authorOrg: org?.name ?? "Organization",
        kind: (KINDS as readonly string[]).includes(r.kind) ? (r.kind as FeedKind) : "update",
        title: r.title ?? undefined,
        body: r.body,
        at: r.created_at,
        media: (r.media as FeedMedia[] | null) ?? undefined,
        likes: likeCount.get(r.id) ?? 0,
        likedByMe: likedByMe.has(r.id),
        comments: commentsByPost.get(r.id) ?? [],
        eventAt: r.event_at ?? undefined,
      } satisfies FeedPost;
    });
  });

async function displayNameFor(
  supabase: { from: (t: string) => any },
  userId: string,
  orgId: string,
  fallback: string,
): Promise<{ name: string; role: string }> {
  const { data } = await supabase
    .from("org_members")
    .select("display_name, title, role")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  return {
    name: data?.display_name || fallback,
    role: data?.title || data?.role || "Member",
  };
}

export const createFeedPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orgId: z.string().uuid(),
        kind: z.enum(KINDS),
        title: z.string().max(200).optional(),
        body: z.string().max(10_000).default(""),
        media: z.array(mediaSchema).max(6).optional(),
        eventAt: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId, claims } = context;
    const fallback =
      (claims as { email?: string; user_metadata?: { full_name?: string } })?.user_metadata
        ?.full_name ||
      (claims as { email?: string })?.email?.split("@")[0] ||
      "Member";
    const who = await displayNameFor(supabase as never, userId, data.orgId, fallback);

    const { data: row, error } = await supabase
      .from("feed_posts")
      .insert({
        org_id: data.orgId,
        author_user_id: userId,
        author_name: who.name,
        author_role: who.role,
        kind: data.kind,
        title: data.title ?? null,
        body: data.body,
        media: data.media ?? [],
        event_at: data.eventAt ?? null,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const toggleFeedLike = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ liked: boolean }> => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("feed_likes")
      .select("id")
      .eq("post_id", data.postId)
      .eq("user_id", userId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase.from("feed_likes").delete().eq("id", existing.id);
      if (error) throw new Error(error.message);
      return { liked: false };
    }
    const { error } = await supabase
      .from("feed_likes")
      .insert({ post_id: data.postId, user_id: userId });
    if (error) throw new Error(error.message);
    return { liked: true };
  });

export const addFeedComment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ postId: z.string().uuid(), body: z.string().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data, context }): Promise<{ id: string }> => {
    const { supabase, userId, claims } = context;
    const fallback =
      (claims as { email?: string; user_metadata?: { full_name?: string } })?.user_metadata
        ?.full_name ||
      (claims as { email?: string })?.email?.split("@")[0] ||
      "Member";

    const { data: post } = await supabase
      .from("feed_posts")
      .select("org_id")
      .eq("id", data.postId)
      .maybeSingle();
    const who = post
      ? await displayNameFor(supabase as never, userId, post.org_id, fallback)
      : { name: fallback, role: "Member" };

    const { data: row, error } = await supabase
      .from("feed_comments")
      .insert({
        post_id: data.postId,
        author_user_id: userId,
        author_name: who.name,
        author_role: who.role,
        body: data.body,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: row.id };
  });

export const deleteFeedPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ postId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase.from("feed_posts").delete().eq("id", data.postId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
