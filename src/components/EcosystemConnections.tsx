import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { EcosystemConnection } from "@/seed/showcase";
import { ArrowUpRight } from "lucide-react";

export function EcosystemConnections({ connections }: { connections: EcosystemConnection[] }) {
  const groups: ("Upstream" | "Downstream" | "Verifier")[] = ["Upstream", "Downstream", "Verifier"];
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {groups.map((g) => {
        const items = connections.filter((c) => c.role === g);
        return (
          <Card key={g} className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">
                {g} ({items.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {items.length === 0 && <p className="text-xs text-muted-foreground">No connections.</p>}
              {items.map((c) => (
                <Link
                  key={c.entity.id}
                  to="/directory/$id"
                  params={{ id: c.entity.id }}
                  className="group block rounded-md border p-3 transition hover:bg-accent"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.entity.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{c.relationship}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">{c.entity.entityType}</Badge>
                        <Badge variant="outline" className="text-[10px]">{c.entity.country}</Badge>
                      </div>
                    </div>
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition group-hover:opacity-100" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
