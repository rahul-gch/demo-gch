import { useEffect, useState } from "react";
import type { Entity } from "@/seed/types";
import { seedFeedForOrg, type FeedPost, type FeedComment } from "@/seed/feed";

const KEY = "gch.feed.v1";

type Store = Record<string, FeedPost[]>;

const isBrowser = () => typeof window !== "undefined";

// Module-level cache: stable references per orgId so React can bail out of
// rerenders. This is the source of truth in memory; localStorage is a mirror.
let cache: Store | null = null;

function loadFromStorage(): Store {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function getStore(): Store {
  if (cache) return cache;
  cache = loadFromStorage();
  return cache;
}

function persist() {
  if (!isBrowser() || !cache) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    /* ignore quota */
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function ensureLoaded(entity: Entity): FeedPost[] {
  const store = getStore();
  if (!store[entity.id]) {
    store[entity.id] = seedFeedForOrg(entity);
    persist();
  }
  return store[entity.id];
}

export function getFeed(entity: Entity): FeedPost[] {
  return ensureLoaded(entity);
}

function replace(entity: Entity, next: FeedPost[]) {
  const store = getStore();
  store[entity.id] = next;
  persist();
  notify();
}

export function addPost(
  entity: Entity,
  post: Pick<FeedPost, "kind" | "title" | "body" | "media" | "eventAt"> &
    Partial<Pick<FeedPost, "authorName" | "authorRole" | "authorOrg">>,
) {
  const list = ensureLoaded(entity);
  const next: FeedPost = {
    id: `${entity.id}-user-${Date.now()}`,
    orgId: entity.id,
    authorName: post.authorName ?? "You",
    authorRole: post.authorRole ?? `${entity.actorType} · Owner`,
    authorOrg: post.authorOrg ?? entity.name,
    kind: post.kind,
    title: post.title,
    body: post.body,
    at: new Date().toISOString(),
    media: post.media,
    likes: 0,
    likedByMe: false,
    comments: [],
    rsvpCount: post.kind === "event" ? 1 : undefined,
    rsvpByMe: post.kind === "event" ? true : undefined,
    eventAt: post.eventAt,
  };
  replace(entity, [next, ...list]);
  return next;
}

function updatePost(entity: Entity, id: string, updater: (p: FeedPost) => FeedPost) {
  const list = ensureLoaded(entity);
  replace(entity, list.map((p) => (p.id === id ? updater(p) : p)));
}

export function toggleLike(entity: Entity, id: string) {
  updatePost(entity, id, (p) => ({
    ...p,
    likedByMe: !p.likedByMe,
    likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1,
  }));
}

export function toggleRsvp(entity: Entity, id: string) {
  updatePost(entity, id, (p) => ({
    ...p,
    rsvpByMe: !p.rsvpByMe,
    rsvpCount: (p.rsvpCount ?? 0) + (p.rsvpByMe ? -1 : 1),
  }));
}

export function addComment(entity: Entity, id: string, body: string) {
  const c: FeedComment = {
    id: `c-${Date.now()}`,
    author: "You",
    role: `${entity.actorType} · Owner`,
    body,
    at: new Date().toISOString(),
  };
  updatePost(entity, id, (p) => ({ ...p, comments: [...p.comments, c] }));
}

export function useFeed(entity: Entity): FeedPost[] {
  const [posts, setPosts] = useState<FeedPost[]>(() => ensureLoaded(entity));

  useEffect(() => {
    setPosts(ensureLoaded(entity));
    const fn = () => setPosts(ensureLoaded(entity));
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, [entity]);

  return posts;
}
