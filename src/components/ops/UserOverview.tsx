import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export function UserOverview({
  rows,
  total,
  loading,
}: {
  rows: { role: string; count: number }[];
  total: number;
  loading?: boolean;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Users className="h-4 w-4 text-slate-600" /> Members
        </CardTitle>
        {!loading && <span className="text-xs text-muted-foreground">{total} total</span>}
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-2 gap-2">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <li key={i} className="h-9 animate-pulse rounded-md border bg-slate-50" />
              ))
            : rows.map((r) => (
                <li key={r.role}>
                  <Link
                    to="/admin/organizations"
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
