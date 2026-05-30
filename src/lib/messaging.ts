import type { AuthRole } from "./auth";

export type Participant = AuthRole; // "rahul" | "george" | "maria" | "admin"

export type Message = {
  id: string;
  from: Participant;
  to: Participant;
  text: string;
  ts: number;
  read: boolean;
};

export type MeetingStatus = "pending" | "accepted" | "declined" | "rescheduled";

export type MeetingRequest = {
  id: string;
  from: Participant;
  to: Participant;
  title: string;
  proposedAt: number;     // epoch ms
  durationMin: number;
  agenda: string;
  status: MeetingStatus;
  responseNote?: string;
  rescheduledAt?: number;
  ts: number;
};

type CommsStore = {
  messages: Message[];
  meetings: MeetingRequest[];
};

const KEY = "gch_comms_v1";
const EVT = "gch:comms";

export const PARTICIPANT_LABEL: Record<Participant, string> = {
  rahul: "Rahul (Brand Lead)",
  george: "George (Supplier Ops)",
  maria: "Maria (Evidence Reviewer)",
  admin: "GCH Admin",
};

export const PARTICIPANT_TONE: Record<Participant, string> = {
  rahul: "bg-indigo-500",
  george: "bg-amber-500",
  maria: "bg-emerald-500",
  admin: "bg-rose-500",
};

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function seed(): CommsStore {
  const now = Date.now();
  const h = (n: number) => now - n * 3600_000;
  return {
    messages: [
      { id: uid(), from: "george", to: "rahul",  text: "Hi Rahul — uploaded the latest dye-lot evidence. Let me know if you need anything else.", ts: h(28), read: false },
      { id: uid(), from: "rahul",  to: "george", text: "Thanks George, I'll review with Maria today.", ts: h(27), read: true },
      { id: uid(), from: "maria",  to: "rahul",  text: "Two POs are missing transport docs. Can we sync briefly?", ts: h(6),  read: false },
      { id: uid(), from: "admin",  to: "rahul",  text: "Welcome to the GCH workspace. Reach out anytime.", ts: h(72), read: true },
    ],
    meetings: [
      {
        id: uid(), from: "maria", to: "rahul",
        title: "Evidence gap review", proposedAt: now + 24*3600_000, durationMin: 30,
        agenda: "Walk through 2 missing transport docs and confirm reviewer next steps.",
        status: "pending", ts: h(5),
      },
      {
        id: uid(), from: "rahul", to: "george",
        title: "Q3 capacity & lead times", proposedAt: now + 48*3600_000, durationMin: 45,
        agenda: "Forecast volumes for fall collection; align on lead times.",
        status: "pending", ts: h(20),
      },
    ],
  };
}

export function loadComms(): CommsStore {
  if (typeof window === "undefined") return { messages: [], meetings: [] };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const s = seed();
      localStorage.setItem(KEY, JSON.stringify(s));
      return s;
    }
    return JSON.parse(raw) as CommsStore;
  } catch {
    return { messages: [], meetings: [] };
  }
}

export function saveComms(s: CommsStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new Event(EVT));
}

export function subscribeComms(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVT, handler);
    window.removeEventListener("storage", handler);
  };
}

export function sendMessage(from: Participant, to: Participant, text: string) {
  const s = loadComms();
  s.messages.push({ id: uid(), from, to, text: text.trim(), ts: Date.now(), read: false });
  saveComms(s);
}

export function markThreadRead(me: Participant, other: Participant) {
  const s = loadComms();
  let changed = false;
  for (const m of s.messages) {
    if (m.to === me && m.from === other && !m.read) {
      m.read = true;
      changed = true;
    }
  }
  if (changed) saveComms(s);
}

export function createMeeting(
  from: Participant, to: Participant,
  data: { title: string; proposedAt: number; durationMin: number; agenda: string },
) {
  const s = loadComms();
  s.meetings.push({
    id: uid(), from, to, ...data,
    status: "pending", ts: Date.now(),
  });
  saveComms(s);
}

export function respondMeeting(
  id: string,
  status: Exclude<MeetingStatus, "pending">,
  opts?: { note?: string; rescheduledAt?: number },
) {
  const s = loadComms();
  const m = s.meetings.find((x) => x.id === id);
  if (!m) return;
  m.status = status;
  if (opts?.note) m.responseNote = opts.note;
  if (opts?.rescheduledAt) m.rescheduledAt = opts.rescheduledAt;
  saveComms(s);
}

export function messagesBetween(a: Participant, b: Participant): Message[] {
  const s = loadComms();
  return s.messages
    .filter((m) => (m.from === a && m.to === b) || (m.from === b && m.to === a))
    .sort((x, y) => x.ts - y.ts);
}

export function meetingsBetween(a: Participant, b: Participant): MeetingRequest[] {
  const s = loadComms();
  return s.meetings
    .filter((m) => (m.from === a && m.to === b) || (m.from === b && m.to === a))
    .sort((x, y) => x.ts - y.ts);
}

export function threadsFor(me: Participant): { other: Participant; lastTs: number; unread: number; lastText: string }[] {
  const s = loadComms();
  const others = (["rahul", "george", "maria", "admin"] as Participant[]).filter((p) => p !== me);
  return others.map((other) => {
    const ms = s.messages.filter(
      (m) => (m.from === me && m.to === other) || (m.from === other && m.to === me),
    );
    const last = ms[ms.length - 1];
    const unread = ms.filter((m) => m.to === me && m.from === other && !m.read).length;
    return {
      other,
      lastTs: last?.ts ?? 0,
      unread,
      lastText: last?.text ?? "No messages yet",
    };
  }).sort((a, b) => b.lastTs - a.lastTs);
}

export function unreadCountFor(me: Participant): number {
  const s = loadComms();
  return s.messages.filter((m) => m.to === me && !m.read).length;
}
