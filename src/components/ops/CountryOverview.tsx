import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { topCountries } from "@/lib/ops-derive";
import { Globe2 } from "lucide-react";

export function CountryOverview() {
  const rows = topCountries();
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Globe2 className="h-4 w-4 text-slate-600" /> Country overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.country}>
              <Link
                to="/organizations"
                className="group grid grid-cols-[100px_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"
              >
                <span className="truncate text-slate-700">{r.country}</span>
                <span className="relative h-1.5 overflow-hidden rounded bg-slate-100">
                  <span
                    className="absolute inset-y-0 left-0 rounded bg-sky-500/70 transition group-hover:bg-sky-500"
                    style={{ width: `${(r.count / max) * 100}%` }}
                  />
                </span>
                <span className="tabular-nums text-xs text-muted-foreground">{r.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
