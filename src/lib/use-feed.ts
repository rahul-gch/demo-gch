import { useEffect, useSyncExternalStore } from "react";
import type { Entity } from "@/seed/types";
import { seedFeedForOrg, type FeedPost, type FeedComment } from "@/seed/feed";

const KEY = "gch.feed.v1";

type Store = Record<string, FeedPost[]>;

const isBrowser = () => typeof window !== "undefined";

function load(): Store {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}
function save(s: Store) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getFeed(entity: Entity): FeedPost[] {
  const store = load();
  if (!store[entity.id]) return seedFeedForOrg(entity);
  return store[entity.id];
}

function ensure(entity: Entity): FeedPost[] {
  const store = load();
  if (!store[entity.id]) {
    store[entity.id] = seedFeedForOrg(entity);
    save(store);
  }
  return store[entity.id];
}

export function addPost(entity: Entity, post: Omit<FeedPost, "id" | "at" | "likes" | "comments" | "orgId" | "authorName" | "authorRole" | "authorOrg"> & Partial<Pick<FeedPost, "authorName" | "authorRole" | "authorOrg">>) {
  const store = load();
  const list = store[entity.id] ?? seedFeedForOrg(entity);
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
  store[entity.id] = [next, ...list];
  save(store);
  notify();
  return next;
}

function updatePost(entity: Entity, id: string, updater: (p: FeedPost) => FeedPost) {
  const store = load();
  const list = store[entity.id] ?? seedFeedForOrg(entity);
  store[entity.id] = list.map((p) => (p.id === id ? updater(p) : p));
  save(store);
  notify();
}

export function toggleLike(entity: Entity, id: string) {
  ensure(entity);
  updatePost(entity, id, (p) => ({
    ...p,
    likedByMe: !p.likedByMe,
    likes: p.likedByMe ? Math.max(0, p.likes - 1) : p.likes + 1,
  }));
}

export function toggleRsvp(entity: Entity, id: string) {
  ensure(entity);
  updatePost(entity, id, (p) => ({
    ...p,
    rsvpByMe: !p.rsvpByMe,
    rsvpCount: (p.rsvpCount ?? 0) + (p.rsvpByMe ? -1 : 1),
  }));
}

export function addComment(entity: Entity, id: string, body: string) {
  ensure(entity);
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
  useEffect(() => {
    ensure(entity);
  }, [entity]);
  return useSyncExternalStore(
    subscribe,
    () => getFeed(entity),
    () => seedFeedForOrg(entity),
  );
}
