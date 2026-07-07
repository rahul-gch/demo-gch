import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { buildEcosystemCounts } from "@/lib/dashboard-derive";
import { EcosystemGoogleMap } from "@/components/EcosystemGoogleMap";
import { getEcosystemConnections } from "@/seed/showcase";
import { ArrowUpRight, Globe2 } from "lucide-react";

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-slate-50/60 p-3">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

export function EcosystemSummary({ entity }: { entity: Entity }) {
  const c = buildEcosystemCounts(entity);
  const conns = getEcosystemConnections(entity).map((x) => x.entity);
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold">
          <Globe2 className="mr-1.5 -mt-0.5 inline h-4 w-4 text-sky-600" />
          Ecosystem network
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link to="/organizations/$id/supply-chain" params={{ id: entity.id }}>
            Open network <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <Cell label="Organizations" value={c.organizations} />
          <Cell label="Countries" value={c.countries} />
          <Cell label="Suppliers" value={c.suppliers} />
          <Cell label="Research" value={c.research} />
          <Cell label="NGOs" value={c.ngos} />
          <Cell label="Auditors" value={c.auditors} />
          <Cell label="Certifiers" value={c.certifiers} />
        </div>
        <div className="overflow-hidden rounded-lg border">
          <EcosystemGoogleMap
            entities={[entity, ...conns]}
            selectedId={entity.id}
            height={220}
            center={{ lat: entity.latitude, lng: entity.longitude }}
            zoom={3}
            compact
          />
        </div>
      </CardContent>
    </Card>
  );
}
