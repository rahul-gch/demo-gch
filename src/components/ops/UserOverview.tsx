import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { userOverview } from "@/lib/ops-derive";
import { Users } from "lucide-react";

export function UserOverview() {
  const rows = userOverview();
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-slate-600" /> Users
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-2">
          {rows.map((r) => (
            <li key={r.role}>
              <Link
                to="/organizations"
                className="flex items-center justify-between rounded-md border bg-slate-50/50 px-3 py-2 text-sm transition hover:bg-white"
              >
                <span className="text-slate-700">{r.role}</span>
                <span className="tabular-nums font-semibold">{r.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
