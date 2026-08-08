import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import {
  Heart,
  MessageCircle,
  Share2,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  Calendar,
  Handshake,
  Landmark,
  Megaphone,
  ScrollText,
  Rss,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_ENTITIES } from "@/seed/all-entities";
import type { FeedKind, FeedMedia, FeedPost } from "@/lib/feed-types";
import { getFeed, toggleLike } from "@/lib/use-feed";
import { formatRelative } from "@/lib/admin-feed";

const KIND_META: Record<FeedKind, { label: string; icon: typeof Rss; className: string }> = {
  update: { label: "Update", icon: Megaphone, className: "border-sky-200 bg-sky-50 text-sky-700" },
  regulation: { label: "Regulation", icon: ScrollText, className: "border-amber-200 bg-amber-50 text-amber-800" },
  investment: { label: "Investment", icon: Landmark, className: "border-emerald-200 bg-emerald-50 text-emerald-700" },
  partnership: { label: "Partnership", icon: Handshake, className: "border-violet-200 bg-violet-50 text-violet-700" },
  event: { label: "Event", icon: Calendar, className: "border-rose-200 bg-rose-50 text-rose-700" },
  "ai-news": { label: "AI news", icon: Sparkles, className: "border-indigo-200 bg-indigo-50 text-indigo-700" },
  photo: { label: "Photo", icon: ImageIcon, className: "border-slate-200 bg-slate-50 text-slate-700" },
  video: { label: "Video", icon: Video, className: "border-slate-200 bg-slate-50 text-slate-700" },
  document: { label: "Document", icon: FileText, className: "border-slate-200 bg-slate-50 text-slate-700" },
};

type Row = FeedPost & { orgCountry: string; orgType: string };

function aggregate(): Row[] {
  const rows: Row[] = [];
  for (const e of ALL_ENTITIES) {
    for (const p of getFeed(e)) {
      rows.push({ ...p, orgCountry: e.country, orgType: e.entityType });
    }
  }
  rows.sort((a, b) => (a.at < b.at ? 1 : -1));
  return rows;
}

const KIND_FILTERS: { value: "all" | FeedKind; label: string }[] = [
  { value: "all", label: "All" },
  { value: "update", label: "Updates" },
  { value: "regulation", label: "Regulations" },
  { value: "investment", label: "Investments" },
  { value: "partnership", label: "Partnerships" },
  { value: "event", label: "Events" },
  { value: "ai-news", label: "AI news" },
  { value: "photo", label: "Photos" },
  { value: "video", label: "Videos" },
  { value: "document", label: "Documents" },
];

export function CommunityFeed() {
  // Trigger re-render on like/rsvp changes via a version counter.
  const [, setVersion] = useState(0);
  useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const [kind, setKind] = useState<"all" | FeedKind>("all");
  const [org, setOrg] = useState<string>("all");
  const [limit, setLimit] = useState(30);

  const rows = useMemo(() => aggregate(), []);
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) => (kind === "all" || r.kind === kind) && (org === "all" || r.orgId === org),
      ),
    [rows, kind, org],
  );
  const visible = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      <Card className="shadow-sm">
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="flex flex-wrap gap-1">
            {KIND_FILTERS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setKind(f.value)}
                className={`rounded-full border px-2.5 py-1 text-xs transition ${
                  kind === f.value
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto w-full sm:w-64">
            <Select value={org} onValueChange={setOrg}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All organizations" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All organizations</SelectItem>
                {ALL_ENTITIES.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {visible.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No posts match the current filters.
          </CardContent>
        </Card>
      ) : (
        visible.map((p) => <PostRow key={p.id} post={p} onChange={() => setVersion((v) => v + 1)} />)
      )}

      {limit < filtered.length && (
        <div className="pt-2 text-center">
          <Button variant="outline" size="sm" onClick={() => setLimit((n) => n + 30)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

function PostRow({ post, onChange }: { post: Row; onChange: () => void }) {
  const meta = KIND_META[post.kind];
  const Icon = meta.icon;
  const initials = post.authorOrg
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const like = () => {
    const entity = ALL_ENTITIES.find((e) => e.id === post.orgId);
    if (!entity) return;
    toggleLike(entity, post.id);
    onChange();
  };

  const share = () => {
    try {
      navigator.clipboard?.writeText(
        `${window.location.origin}/organizations/${post.orgId}/feed#${post.id}`,
      );
      toast.success("Link copied");
    } catch {
      toast.success("Shared");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">
                <Link
                  to="/directory/$id"
                  params={{ id: post.orgId }}
                  className="hover:underline"
                >
                  {post.authorOrg}
                </Link>
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {post.authorName} · {post.orgType} · {post.orgCountry} · {formatRelative(post.at)}
              </div>
            </div>
          </div>
          <Badge variant="outline" className={`shrink-0 whitespace-nowrap ${meta.className}`}>
            <Icon className="mr-1 h-3 w-3" />
            {meta.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {post.title && <CardTitle className="text-base font-semibold">{post.title}</CardTitle>}
        <p className="whitespace-pre-wrap text-sm text-slate-700">{post.body}</p>

        {post.media && post.media.length > 0 && (
          <div className={post.media.length === 1 ? "space-y-2" : "grid gap-2 sm:grid-cols-2"}>
            {post.media.map((m, i) => (
              <MediaTile key={i} media={m} />
            ))}
          </div>
        )}

        {post.kind === "event" && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-rose-50/50 px-3 py-2 text-xs text-rose-800">
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {post.eventAt ? new Date(post.eventAt).toLocaleString() : "Date TBA"}
            </span>
            <span>{post.rsvpCount ?? 0} attending</span>
          </div>
        )}

        <div className="flex items-center gap-1 border-t pt-2 text-sm">
          <Button variant="ghost" size="sm" onClick={like}>
            <Heart className={`h-4 w-4 ${post.likedByMe ? "fill-rose-500 text-rose-500" : ""}`} />
            {post.likes}
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/organizations/$id/feed" params={{ id: post.orgId }}>
              <MessageCircle className="h-4 w-4" />
              {post.comments.length}
            </Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={share}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="ghost" size="sm" asChild className="ml-auto">
            <Link to="/organizations/$id/feed" params={{ id: post.orgId }}>
              Open thread →
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function MediaTile({ media }: { media: FeedMedia }) {
  if (media.type === "photo" && media.url) {
    return <img src={media.url} alt={media.label} className="max-h-72 w-full rounded-md object-cover" />;
  }
  if (media.type === "video" && media.url) {
    return <video src={media.url} controls preload="metadata" className="max-h-72 w-full rounded-md bg-black" />;
  }
  return (
    <div className="flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 text-sm">
      <FileText className="h-4 w-4 text-slate-500" />
      <span className="truncate">{media.label}</span>
    </div>
  );
}
