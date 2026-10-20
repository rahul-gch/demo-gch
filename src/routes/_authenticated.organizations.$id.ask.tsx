import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUp, Bot, Loader2, MapPin, Package, Clock, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { askGch, type AskGchAnswer } from "@/lib/ask-gch.functions";

export const Route = createFileRoute("/_authenticated/organizations/$id/ask")({
  head: () => ({
    meta: [
      { title: "Ask GCH — Supplier search assistant" },
      { name: "description", content: "Ask natural-language questions to find suppliers in the GCH network." },
      { property: "og:title", content: "Ask GCH — Supplier search assistant" },
      { property: "og:description", content: "Find suppliers by material, city, MOQ and certifications." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AskGchPage,
});

type Msg =
  | { role: "user"; text: string }
  | { role: "assistant"; answer?: AskGchAnswer; error?: string; pending?: boolean };

const SUGGESTIONS = [
  "GOTS organic denim mills in Turkey with MOQ under 1000",
  "Recycled polyester fabric suppliers with GRS certification",
  "TENCEL or lyocell knitwear manufacturers in Portugal",
  "Regenerative or organic cotton producers in India",
];

function AskGchPage() {
  const ask = useServerFn(askGch);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const busy = msgs.some((m) => m.role === "assistant" && m.pending);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);
  useEffect(() => {
    if (!busy) taRef.current?.focus();
  }, [busy]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setInput("");
    const history = msgs
      .slice(-10)
      .map((m) =>
        m.role === "user"
          ? { role: "user" as const, text: m.text }
          : { role: "assistant" as const, text: (m.answer?.summary ?? m.error ?? "").slice(0, 2000) },
      )
      .filter((h) => h.text);
    setMsgs((m) => [...m, { role: "user", text: q }, { role: "assistant", pending: true }]);
    try {
      const answer = await ask({ data: { query: q, history } });
      setMsgs((m) => [...m.slice(0, -1), { role: "assistant", answer }]);
    } catch (e) {
      setMsgs((m) => [
        ...m.slice(0, -1),
        { role: "assistant", error: e instanceof Error ? e.message : "Something went wrong" },
      ]);
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold">Ask GCH</h1>
            <p className="text-xs text-muted-foreground">Search the GCH network in plain language</p>
          </div>
        </div>
        {msgs.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setMsgs([])} disabled={busy}>
            <RotateCcw className="mr-1 h-4 w-4" /> New chat
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
          {msgs.length === 0 && (
            <div className="pt-12 text-center">
              <h2 className="text-2xl font-semibold">What are you looking for?</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Find sustainable suppliers by material, city, country, MOQ, lead time or certification — or just ask a question.
              </p>
              <div className="mt-8 grid gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-xl border bg-card p-3 text-left text-sm transition-colors hover:bg-accent"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-sm text-primary-foreground">
                  {m.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex gap-3">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1 space-y-3 text-sm">
                  {m.pending && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Searching the network…
                    </div>
                  )}
                  {m.error && <p className="text-destructive">{m.error}</p>}
                  {m.answer && (
                    <>
                      <p>{m.answer.summary}</p>
                      <div className="grid gap-2">
                        {m.answer.results.map((r) => (
                          <Link
                            key={r.id}
                            to="/directory/$id"
                            params={{ id: r.slug ?? r.id }}
                            className="block rounded-xl border bg-card p-3 transition-colors hover:border-primary"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-medium text-primary underline-offset-2 hover:underline">
                                  {r.name}
                                </div>
                                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                  {r.type && <span>{r.type}</span>}
                                  {(r.city || r.country) && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {[r.city, r.country].filter(Boolean).join(", ")}
                                    </span>
                                  )}
                                  {r.moq && (
                                    <span className="flex items-center gap-1">
                                      <Package className="h-3 w-3" /> MOQ {r.moq}
                                    </span>
                                  )}
                                  {r.leadTimeDays != null && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> {r.leadTimeDays} days
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="shrink-0 text-xs text-muted-foreground">View profile →</span>
                            </div>
                            {(r.materials.length > 0 || r.certifications.length > 0) && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {r.materials.slice(0, 4).map((x) => (
                                  <Badge key={x} variant="secondary" className="text-[10px] font-normal">{x}</Badge>
                                ))}
                                {r.certifications.slice(0, 4).map((x) => (
                                  <Badge key={x} variant="outline" className="text-[10px] font-normal">{x}</Badge>
                                ))}
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="border-t p-4">
        <form
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border bg-card p-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <Textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="e.g. Find denim suppliers in Istanbul with MOQ under 500"
            className="min-h-10 resize-none border-0 shadow-none focus-visible:ring-0"
          />
          <Button type="submit" size="icon" disabled={busy || !input.trim()} className="shrink-0 rounded-full">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
