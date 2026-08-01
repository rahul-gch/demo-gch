import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMockActivity } from "@/seed/showcase";
import { Upload, Eye, TrendingUp, MessageSquare, Pencil } from "lucide-react";

const ICONS = {
  upload: Upload,
  review: Eye,
  score: TrendingUp,
  message: MessageSquare,
  edit: Pencil,
} as const;

export function ActivityFeed({ entity }: { entity: Entity }) {
  const items = getMockActivity(entity);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && (
          <p className="py-4 text-sm text-muted-foreground">No activity recorded yet.</p>
        )}
        <ul className="space-y-4">
          {items.map((a) => {
            const Icon = ICONS[a.kind];
            return (
              <li key={a.id} className="flex items-start gap-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-slate-700">{a.text}</div>
                  <div className="text-xs text-muted-foreground">{a.at}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
