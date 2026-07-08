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
          <Inbox className="h-4 w-4 text-slate-600" /> Pending approvals
        </CardTitle>
        <Tabs value={kind} onValueChange={(v) => setKind(v as ApprovalKind)}>
          <TabsList className="flex w-full flex-wrap gap-1 bg-slate-100">
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
          <div
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm"
          >
            <div className="min-w-0 flex-1">
              <Link
                to="/organizations/$id"
                params={{ id: r.orgId }}
                className="truncate font-medium hover:underline"
              >
                {r.orgName}
              </Link>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                <span>{r.type}</span>
                <span>·</span>
                <span>{fmtAge(r.waitingHours)} waiting</span>
              </div>
            </div>
            <Badge variant="outline" className={prioTone[r.priority]}>
              {r.priority}
            </Badge>
            <div className="flex gap-1">
              <Button size="sm" className="h-7 px-2 text-xs">
                Approve
              </Button>
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
