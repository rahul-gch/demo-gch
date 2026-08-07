import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pendingApprovals, type ApprovalKind } from "@/lib/ops-derive";
import { Inbox } from "lucide-react";

const KINDS: ApprovalKind[] = [
  "Verification",
  "Projects",
  "Partnerships",
  "Org Updates",
  "Invitations",
  "Certificates",
];

function fmtAge(h: number): string {
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

const prioTone: Record<"High" | "Medium" | "Low", string> = {
  High: "border-red-200 bg-red-50 text-red-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-slate-200 bg-slate-50 text-slate-600",
};

export function PendingApprovals() {
  const [kind, setKind] = useState<ApprovalKind>("Verification");
  const rows = pendingApprovals(kind);
  return (
    <Card className="shadow-sm">
      <CardHeader className="space-y-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Inbox className="h-4 w-4 shrink-0 text-slate-600" /> Pending approvals
        </CardTitle>
        <Tabs value={kind} onValueChange={(v) => setKind(v as ApprovalKind)}>
          <TabsList className="flex h-auto w-full flex-wrap gap-1 bg-slate-100 p-1">
            {KINDS.map((k) => (
              <TabsTrigger key={k} value={k} className="text-xs">
                {k}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded-md border p-3 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Link
                  to="/organizations/$id"
                  params={{ id: r.orgId }}
                  title={r.orgName}
                  className="block truncate font-medium hover:underline"
                >
                  {r.orgName}
                </Link>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                  <span>{r.type}</span>
                  <span aria-hidden>·</span>
                  <span>{fmtAge(r.waitingHours)} waiting</span>
                </div>
              </div>
              <Badge variant="outline" className={`shrink-0 ${prioTone[r.priority]}`}>
                {r.priority}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap justify-end gap-1">

              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                Review
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-red-600">
                Reject
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
