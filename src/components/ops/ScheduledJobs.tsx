import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { scheduledJobs } from "@/lib/ops-derive";
import { Clock } from "lucide-react";

export function ScheduledJobs() {
  const rows = scheduledJobs();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Clock className="h-4 w-4 text-slate-600" /> Scheduled jobs · tonight
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rows.map((j) => (
            <li
              key={j.name}
              className="flex items-center justify-between rounded-md border bg-slate-50/50 px-3 py-2 text-sm"
            >
              <span className="text-slate-700">{j.name}</span>
              <span className="text-xs font-medium tabular-nums text-slate-500">{j.time}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
