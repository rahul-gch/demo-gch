// Local mock messaging + meeting store backed by localStorage so demo state
// persists across navigation but never touches the backend.
import type { Entity } from "./types";
import { ALL_ENTITIES } from "./all-entities";
import { getMockMessages } from "./showcase";

export interface ThreadMessage {
  id: string;
  from: "me" | "them";
  authorName: string;
  authorRole: string;
  body: string;
  at: string; // ISO
  read?: boolean;
}

export interface MeetingRequest {
  id: string;
  orgId: string;
  orgName: string;
  proposedFor: string; // ISO date
  durationMin: number;
  agenda: string;
  status: "Pending" | "Confirmed" | "Declined" | "Past";
  createdAt: string;
}

const MSG_KEY = "gch.threads.v1";
const MEET_KEY = "gch.meetings.v1";

type ThreadMap = Record<string, ThreadMessage[]>;

const isBrowser = () => typeof window !== "undefined";

function load<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

// --------------- seeded threads ---------------
function seedThread(entity: Entity): ThreadMessage[] {
  const base = getMockMessages(entity).slice(0, 3);
  return base.map((m, i) => ({
    id: `${entity.id}-seed-${i}`,
    from: m.from === "admin" ? "me" : "them",
    authorName: m.from === "admin" ? "You" : m.authorName,
    authorRole: m.from === "admin" ? "Network Admin" : m.authorRole,
    body: m.body,
    at: new Date(Date.now() - (3 - i) * 86400000).toISOString(),
    read: i < 2,
  }));
}

export function getThreadIds(): string[] {
  const stored = load<ThreadMap>(MSG_KEY, {});
  const seeded = ALL_ENTITIES.slice(0, 6).map((e) => e.id);
  const all = new Set([...seeded, ...Object.keys(stored)]);
  return Array.from(all);
}

export function getThread(orgId: string): ThreadMessage[] {
  const stored = load<ThreadMap>(MSG_KEY, {});
  if (stored[orgId]) return stored[orgId];
  const entity = ALL_ENTITIES.find((e) => e.id === orgId);
  if (!entity) return [];
  return seedThread(entity);
}

export function appendMessage(orgId: string, msg: Omit<ThreadMessage, "id" | "at">) {
  const stored = load<ThreadMap>(MSG_KEY, {});
  const current = stored[orgId] ?? (ALL_ENTITIES.find((e) => e.id === orgId) ? seedThread(ALL_ENTITIES.find((e) => e.id === orgId)!) : []);
  const next: ThreadMessage = {
    ...msg,
    id: `${orgId}-${Date.now()}`,
    at: new Date().toISOString(),
  };
  stored[orgId] = [...current, next];
  save(MSG_KEY, stored);
  notify();
  return next;
}

export function unreadCount(): number {
  const stored = load<ThreadMap>(MSG_KEY, {});
  let n = 0;
  for (const id of getThreadIds()) {
    const t = stored[id] ?? getThread(id);
    n += t.filter((m) => m.from === "them" && !m.read).length;
  }
  return n;
}

export function markThreadRead(orgId: string) {
  const stored = load<ThreadMap>(MSG_KEY, {});
  const t = stored[orgId] ?? getThread(orgId);
  stored[orgId] = t.map((m) => ({ ...m, read: true }));
  save(MSG_KEY, stored);
  notify();
}

// --------------- meetings ---------------
export function getMeetings(): MeetingRequest[] {
  return load<MeetingRequest[]>(MEET_KEY, []);
}

export function addMeeting(req: Omit<MeetingRequest, "id" | "createdAt" | "status"> & { status?: MeetingRequest["status"] }) {
  const list = getMeetings();
  const next: MeetingRequest = {
    ...req,
    id: `mt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: req.status ?? "Pending",
  };
  list.unshift(next);
  save(MEET_KEY, list);
  notify();
  return next;
}

export function updateMeetingStatus(id: string, status: MeetingRequest["status"]) {
  const list = getMeetings().map((m) => (m.id === id ? { ...m, status } : m));
  save(MEET_KEY, list);
  notify();
}

// --------------- pub/sub ---------------
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}
export function subscribeComms(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
