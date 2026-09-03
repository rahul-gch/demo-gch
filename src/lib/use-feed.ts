import { useCallback } from "react";
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Entity } from "@/seed/types";
import type { FeedKind, FeedMedia, FeedPost } from "@/lib/feed-types";
import {
  addFeedComment,
  createFeedPost,
  deleteFeedPost,
  listFeedPosts,
  toggleFeedLike,
} from "@/lib/feed.functions";
import { useAuthenticatedSessionReady, withSession } from "@/lib/use-comms";

const EMPTY: FeedPost[] = [];

function key(orgUuid: string | null) {
  return ["feed", orgUuid ?? "all"] as const;
}

/** Live subscription so posts, likes and comments appear without a refresh. */
function useFeedRealtime(orgUuid: string | null) {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`feed-${orgUuid ?? "all"}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "feed_posts" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "feed_likes" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "feed_comments" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["feed"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [orgUuid, queryClient]);
}

/** Posts for one organization. */
export function useFeed(entity: Entity): { posts: FeedPost[]; isLoading: boolean } {
  const orgUuid = entity.orgUuid ?? null;
  const hasSession = useAuthenticatedSessionReady();
  const fetchPosts = useServerFn(listFeedPosts);
  useFeedRealtime(orgUuid);
  const { data, isLoading } = useQuery({
    queryKey: key(orgUuid),
    queryFn: () => withSession(() => fetchPosts({ data: { orgId: orgUuid } }), EMPTY),
    enabled: !!orgUuid && hasSession,
    staleTime: 15_000,
  });
  return { posts: data ?? EMPTY, isLoading: orgUuid ? isLoading : false };
}

/** Platform-wide community feed. */
export function useCommunityFeed(): { posts: FeedPost[]; isLoading: boolean } {
  const hasSession = useAuthenticatedSessionReady();
  const fetchPosts = useServerFn(listFeedPosts);
  useFeedRealtime(null);
  const { data, isLoading } = useQuery({
    queryKey: key(null),
    queryFn: () => withSession(() => fetchPosts({ data: { orgId: null, limit: 200 } }), EMPTY),
    enabled: hasSession,
    staleTime: 15_000,
  });
  return { posts: data ?? EMPTY, isLoading };
}

export interface NewPost {
  kind: FeedKind;
  title?: string;
  body: string;
  media?: FeedMedia[];
  eventAt?: string;
}

export function useFeedActions(orgUuid?: string | null) {
  const queryClient = useQueryClient();
  const refresh = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["feed"] });
  }, [queryClient]);

  const post = useMutation({
    mutationFn: (input: NewPost) => {
      if (!orgUuid) throw new Error("No organization selected");
      return createFeedPost({ data: { orgId: orgUuid, ...input } });
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message || "Could not publish the post"),
  });

  const like = useMutation({
    mutationFn: (postId: string) => toggleFeedLike({ data: { postId } }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message || "Could not update the like"),
  });

  const comment = useMutation({
    mutationFn: (v: { postId: string; body: string }) => addFeedComment({ data: v }),
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message || "Could not add the comment"),
  });

  const remove = useMutation({
    mutationFn: (postId: string) => deleteFeedPost({ data: { postId } }),
    onSuccess: () => {
      refresh();
      toast.success("Post deleted");
    },
    onError: (e: Error) => toast.error(e.message || "Could not delete the post"),
  });

  return {
    addPost: post.mutateAsync,
    posting: post.isPending,
    toggleLike: like.mutate,
    addComment: comment.mutateAsync,
    deletePost: remove.mutate,
  };
}
