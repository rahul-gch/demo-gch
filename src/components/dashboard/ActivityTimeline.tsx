import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildTimeline } from "@/lib/dashboard-derive";
import { Upload, Eye, TrendingUp, MessageSquare, Pencil, Handshake, FolderKanban } from "lucide-react";

const ICONS = {
  upload: Upload,
  review: Eye,
  score: TrendingUp,
  message: MessageSquare,
  edit: Pencil,
  match: Handshake,
  project: FolderKanban,
} as const;

export function ActivityTimeline({ entity }: { entity: Entity }) {
  const events = buildTimeline(entity);
  const groups = ["Today", "Yesterday", "This week"] as const;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Activity timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {events.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet. Actions on your profile, documents and partners will appear here.
          </p>
        )}
        {groups.map((g) => {
          const items = events.filter((e) => e.when === g);
          if (!items.length) return null;
          return (
            <div key={g}>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {g}
              </div>
              <ul className="space-y-2 border-l border-slate-200 pl-4">
                {items.map((e, i) => {
                  const Icon = ICONS[e.kind];
                  return (
                    <li key={i} className="relative">
                      <div className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full border border-slate-300 bg-white">
                        <Icon className="h-2 w-2 text-slate-500" />
                      </div>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm text-slate-700">{e.title}</span>
                        <span className="text-[11px] text-muted-foreground">{e.time}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
