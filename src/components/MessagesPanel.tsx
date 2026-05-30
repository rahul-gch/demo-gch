import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarPlus, Send, X, Check, X as XIcon, CalendarClock, MessageSquare,
} from "lucide-react";
import {
  PARTICIPANT_LABEL, PARTICIPANT_TONE,
  messagesBetween, meetingsBetween, threadsFor,
  sendMessage, markThreadRead, createMeeting, respondMeeting,
  subscribeComms, type Participant, type MeetingRequest,
} from "@/lib/messaging";

function initials(p: Participant) {
  return PARTICIPANT_LABEL[p].slice(0, 2).toUpperCase();
}

function fmt(ts: number) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtDateTime(ts: number) {
  return new Date(ts).toLocaleString([], {
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MessagesPanel({
  me,
  initialOther,
  onClose,
}: {
  me: Participant;
  initialOther?: Participant;
  onClose: () => void;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeComms(() => setTick((t) => t + 1)), []);

  const threads = useMemo(() => threadsFor(me), [me, tick]);
  const candidates = useMemo(
    () => (["rahul", "george", "maria", "admin"] as Participant[]).filter((p) => p !== me),
    [me],
  );

  const [active, setActive] = useState<Participant>(
    initialOther && initialOther !== me ? initialOther : (threads[0]?.other ?? candidates[0]),
  );

  useEffect(() => {
    if (initialOther && initialOther !== me) setActive(initialOther);
  }, [initialOther, me]);

  useEffect(() => {
    markThreadRead(me, active);
  }, [me, active, tick]);

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm">
      <div className="flex h-full w-full max-w-5xl flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Messages</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid flex-1 min-h-0 grid-cols-[260px_1fr]">
          {/* Threads */}
          <aside className="border-r border-border overflow-y-auto">
            {candidates.map((p) => {
              const t = threads.find((x) => x.other === p);
              const isActive = p === active;
              return (
                <button
                  key={p}
                  onClick={() => setActive(p)}
                  className={`flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors ${
                    isActive ? "bg-muted" : "hover:bg-muted/50"
                  }`}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white ${PARTICIPANT_TONE[p]}`}>
                    {initials(p)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-xs font-semibold text-foreground">
                        {PARTICIPANT_LABEL[p]}
                      </div>
                      <div className="shrink-0 text-[10px] text-muted-foreground">{fmt(t?.lastTs ?? 0)}</div>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <div className="truncate text-[11px] text-muted-foreground">{t?.lastText ?? "No messages yet"}</div>
                      {t && t.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          {t.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {/* Conversation */}
          <Conversation me={me} other={active} key={`${me}-${active}-${tick}`} />
        </div>
      </div>
    </div>
  );
}

function Conversation({ me, other }: { me: Participant; other: Participant }) {
  const msgs = useMemo(() => messagesBetween(me, other), [me, other]);
  const meetings = useMemo(() => meetingsBetween(me, other), [me, other]);

  // interleave by ts
  const timeline = useMemo(() => {
    return [
      ...msgs.map((m) => ({ kind: "msg" as const, ts: m.ts, data: m })),
      ...meetings.map((m) => ({ kind: "meet" as const, ts: m.ts, data: m })),
    ].sort((a, b) => a.ts - b.ts);
  }, [msgs, meetings]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [timeline.length]);

  const [text, setText] = useState("");
  const [showMeeting, setShowMeeting] = useState(false);

  function handleSend() {
    const t = text.trim();
    if (!t) return;
    sendMessage(me, other, t);
    setText("");
  }

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-5 py-3">
        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white ${PARTICIPANT_TONE[other]}`}>
          {initials(other)}
        </span>
        <div>
          <div className="text-sm font-semibold text-foreground">{PARTICIPANT_LABEL[other]}</div>
          <div className="text-[11px] text-muted-foreground">Direct message</div>
        </div>
        <div className="ml-auto">
          <button
            onClick={() => setShowMeeting((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <CalendarPlus className="h-3.5 w-3.5" />
            Request meeting
          </button>
        </div>
      </div>

      {showMeeting && (
        <MeetingForm
          me={me} other={other}
          onCancel={() => setShowMeeting(false)}
          onSubmitted={() => setShowMeeting(false)}
        />
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
        {timeline.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Start the conversation with {PARTICIPANT_LABEL[other].split(" ")[0]}.
          </div>
        )}
        <div className="space-y-3">
          {timeline.map((item) => {
            if (item.kind === "msg") {
              const mine = item.data.from === me;
              return (
                <div key={item.data.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-foreground text-background" : "bg-muted text-foreground"
                  }`}>
                    <div className="whitespace-pre-wrap">{item.data.text}</div>
                    <div className={`mt-1 text-[10px] ${mine ? "text-background/70" : "text-muted-foreground"}`}>
                      {fmt(item.data.ts)}
                    </div>
                  </div>
                </div>
              );
            }
            return <MeetingCard key={item.data.id} me={me} meeting={item.data} />;
          })}
        </div>
      </div>

      <div className="border-t border-border bg-background px-4 py-3">
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
            }}
            placeholder={`Message ${PARTICIPANT_LABEL[other].split(" ")[0]}…`}
            rows={1}
            className="min-h-[40px] max-h-32 flex-1 resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
          />
          <button
            onClick={handleSend}
            className="inline-flex h-10 items-center gap-1.5 rounded-md bg-foreground px-3 text-xs font-medium text-background hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" />
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

function MeetingForm({
  me, other, onCancel, onSubmitted,
}: { me: Participant; other: Participant; onCancel: () => void; onSubmitted: () => void }) {
  const defaultDt = new Date(Date.now() + 24 * 3600_000);
  defaultDt.setMinutes(0, 0, 0);
  const [title, setTitle] = useState("");
  const [when, setWhen] = useState(toLocalInput(defaultDt.getTime()));
  const [duration, setDuration] = useState(30);
  const [agenda, setAgenda] = useState("");

  function submit() {
    if (!title.trim() || !when) return;
    createMeeting(me, other, {
      title: title.trim(),
      proposedAt: new Date(when).getTime(),
      durationMin: duration,
      agenda: agenda.trim(),
    });
    onSubmitted();
  }

  return (
    <div className="border-b border-border bg-muted/40 px-5 py-4">
      <div className="mb-2 text-xs font-semibold text-foreground">New meeting request</div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Q3 capacity review)"
          className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
          />
          <select
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm"
          >
            {[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} min</option>)}
          </select>
        </div>
        <textarea
          value={agenda}
          onChange={(e) => setAgenda(e.target.value)}
          placeholder="Agenda / notes"
          rows={2}
          className="md:col-span-2 rounded-md border border-border bg-background px-2.5 py-1.5 text-sm"
        />
      </div>
      <div className="mt-2 flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          Cancel
        </button>
        <button onClick={submit} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90">
          <CalendarPlus className="h-3.5 w-3.5" />
          Send request
        </button>
      </div>
    </div>
  );
}

function MeetingCard({ me, meeting }: { me: Participant; meeting: MeetingRequest }) {
  const mine = meeting.from === me;
  const canRespond = meeting.to === me && meeting.status === "pending";
  const [reschedule, setReschedule] = useState(false);
  const [newWhen, setNewWhen] = useState(toLocalInput(meeting.proposedAt));
  const [note, setNote] = useState("");

  const statusBadge: Record<MeetingRequest["status"], string> = {
    pending:     "bg-amber-100 text-amber-800 border-amber-200",
    accepted:    "bg-emerald-100 text-emerald-800 border-emerald-200",
    declined:    "bg-rose-100 text-rose-800 border-rose-200",
    rescheduled: "bg-sky-100 text-sky-800 border-sky-200",
  };

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <div className="text-sm font-semibold text-foreground">{meeting.title}</div>
            <div className="text-[11px] text-muted-foreground">
              {mine ? "You requested" : "Requested by " + PARTICIPANT_LABEL[meeting.from].split(" ")[0]}
              {" · "}{fmt(meeting.ts)}
            </div>
          </div>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize ${statusBadge[meeting.status]}`}>
          {meeting.status}
        </span>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-foreground">
        <div>
          <div className="text-muted-foreground">Proposed</div>
          <div>{fmtDateTime(meeting.proposedAt)} · {meeting.durationMin} min</div>
        </div>
        {meeting.rescheduledAt && (
          <div>
            <div className="text-muted-foreground">New time</div>
            <div>{fmtDateTime(meeting.rescheduledAt)}</div>
          </div>
        )}
      </div>

      {meeting.agenda && (
        <div className="mt-2 rounded-md bg-muted px-2.5 py-1.5 text-xs text-foreground">
          {meeting.agenda}
        </div>
      )}

      {meeting.responseNote && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Note: </span>{meeting.responseNote}
        </div>
      )}

      {canRespond && (
        <div className="mt-3 space-y-2">
          {reschedule ? (
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="datetime-local"
                value={newWhen}
                onChange={(e) => setNewWhen(e.target.value)}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs"
              />
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note"
                className="flex-1 rounded-md border border-border bg-background px-2 py-1 text-xs"
              />
              <button
                onClick={() => respondMeeting(meeting.id, "rescheduled", {
                  rescheduledAt: new Date(newWhen).getTime(),
                  note: note.trim() || undefined,
                })}
                className="rounded-md bg-foreground px-2.5 py-1 text-[11px] font-medium text-background"
              >
                Propose new time
              </button>
              <button onClick={() => setReschedule(false)} className="text-[11px] text-muted-foreground hover:text-foreground">
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => respondMeeting(meeting.id, "accepted")}
                className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-emerald-700"
              >
                <Check className="h-3 w-3" /> Accept
              </button>
              <button
                onClick={() => respondMeeting(meeting.id, "declined", { note: note.trim() || undefined })}
                className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-rose-700"
              >
                <XIcon className="h-3 w-3" /> Decline
              </button>
              <button
                onClick={() => setReschedule(true)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
              >
                <CalendarClock className="h-3 w-3" /> Reschedule
              </button>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Optional note for accept/decline"
                className="flex-1 min-w-[160px] rounded-md border border-border bg-background px-2 py-1 text-[11px]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
