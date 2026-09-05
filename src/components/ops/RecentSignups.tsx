import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/admin-feed";
import { ArrowUpRight, UserPlus } from "lucide-react";

export interface SignupRow {
  id: string;
  name: string;
  slug: string;
  type: string;
  country: string | null;
  created_at: string;
  memberCount: number;
  ownerName: string | null;
  claimed: boolean;
}

export function RecentSignups({ rows, loading }: { rows: SignupRow[]; loading?: boolean }) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <UserPlus className="h-4 w-4 text-slate-600" /> Recent signups
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/organizations">
            Manage <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-11 animate-pulse rounded-md border bg-slate-50" />
          ))}
        {!loading && rows.length === 0 && (
          <p className="text-xs text-muted-foreground">No organizations yet.</p>
        )}
        {!loading &&
          rows.map((r) => (
            <Link
              key={r.id}
              to="/organizations/$id"
              params={{ id: r.slug || r.id }}
              className="flex items-center justify-between gap-3 rounded-md border bg-slate-50/50 px-3 py-2 text-sm transition hover:bg-white"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{r.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {r.type}
                  {r.country ? ` · ${r.country}` : ""}
                  {r.ownerName ? ` · ${r.ownerName}` : ""}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant={r.claimed ? "secondary" : "outline"} className="text-[10px]">
                  {r.claimed ? `${r.memberCount} member${r.memberCount === 1 ? "" : "s"}` : "Unclaimed"}
                </Badge>
                <span className="text-[10px] tabular-nums text-muted-foreground">
                  {formatRelative(r.created_at)}
                </span>
              </div>
            </Link>
          ))}
      </CardContent>
    </Card>
  );
}
