import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMockMessages } from "@/seed/showcase";
import { Send, Lock } from "lucide-react";

function Avatar({ name, tone }: { name: string; tone: "admin" | "entity" }) {
  const initials =
    name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium ${
        tone === "admin" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"
      }`}
    >
      {initials}
    </div>
  );
}

export function MessageChannel({ entity }: { entity: Entity }) {
  const messages = getMockMessages(entity);
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between border-b">
        <div>
          <CardTitle className="text-base font-semibold">Message channel</CardTitle>
          <div className="mt-0.5 text-xs text-muted-foreground">
            GCH Platform ↔ {entity.name}
          </div>
        </div>
        <Badge variant="outline" className="gap-1 font-normal">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Active channel
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5 p-5">
        {messages.map((m) => (
          <div key={m.id} className="flex gap-3">
            <Avatar name={m.authorName} tone={m.from} />
            <div className="flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <div className="text-sm">
                  <span className="font-medium">{m.authorName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.authorRole}</span>
                </div>
                <div className="text-xs text-muted-foreground">{m.at}</div>
              </div>
              <p className="mt-1 text-sm text-slate-700">{m.body}</p>
              {m.read && (
                <div className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Read
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="rounded-lg border bg-slate-50 p-3">
          <Textarea
            disabled
            placeholder="Messaging is read-only in this prototype."
            className="min-h-[60px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" /> Prototype only — no real messages are sent
            </span>
            <Button size="sm" disabled>
              <Send className="mr-1 h-3.5 w-3.5" /> Send
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
