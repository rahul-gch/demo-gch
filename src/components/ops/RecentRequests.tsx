import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { recentRequests, type RequestRow } from "@/lib/ops-derive";
import { Inbox } from "lucide-react";

const tone: Record<RequestRow["status"], string> = {
  New: "border-sky-200 bg-sky-50 text-sky-700",
  "In review": "border-amber-200 bg-amber-50 text-amber-700",
  Waiting: "border-slate-200 bg-slate-50 text-slate-600",
};

export function RecentRequests() {
  const rows = recentRequests();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Inbox className="h-4 w-4 text-slate-600" /> Recent requests
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-medium">{r.type}</div>
                <div className="text-xs text-muted-foreground">{r.org}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={tone[r.status]}>
                  {r.status}
                </Badge>
                <span className="w-8 text-right text-xs tabular-nums text-muted-foreground">
                  {r.ageHours}h
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
