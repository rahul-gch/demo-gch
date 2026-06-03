import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMockDocuments } from "@/seed/showcase";
import { FileText } from "lucide-react";

export function DocumentsList({ entity }: { entity: Entity }) {
  const docs = getMockDocuments(entity);
  if (docs.length === 0) return null;
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Documents</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-3 px-5 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                <FileText className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{d.name}</div>
                <div className="text-xs text-muted-foreground">
                  {d.type} · {d.size} · uploaded {d.uploadedAt}
                </div>
              </div>
              <Badge
                variant="outline"
                className={
                  d.status === "Verified"
                    ? "border-slate-300 bg-slate-900 text-white"
                    : d.status === "Expired"
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-amber-200 bg-amber-50 text-amber-800"
                }
              >
                {d.status}
              </Badge>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
