import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { systemStatus, type SystemStatusRow } from "@/lib/ops-derive";
import { Activity } from "lucide-react";

const dot: Record<SystemStatusRow["status"], string> = {
  healthy: "bg-emerald-500",
  warning: "bg-amber-500",
  down: "bg-red-500",
};

export function SystemStatus() {
  const rows = systemStatus();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Activity className="h-4 w-4 text-slate-600" /> System status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.service} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${dot[r.status]}`} />
                <span className="text-slate-700">{r.service}</span>
              </span>
              <span className="text-xs text-muted-foreground">{r.detail}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
