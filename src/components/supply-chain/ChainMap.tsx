import { useMemo } from "react";
import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EcosystemGoogleMap } from "@/components/EcosystemGoogleMap";
import { getEcosystemConnections } from "@/seed/showcase";

export function ChainMap({ entity }: { entity: Entity }) {
  const conns = useMemo(() => getEcosystemConnections(entity), [entity]);
  const nodes = useMemo(() => {
    const list: Entity[] = [entity, ...conns.map((c) => c.entity)];
    // Dedupe by id
    const seen = new Set<string>();
    return list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  }, [entity, conns]);

  const upstream = conns.filter((c) => c.role === "Upstream").length;
  const downstream = conns.filter((c) => c.role === "Downstream").length;
  const countries = new Set(nodes.map((n) => n.country).filter(Boolean)).size;

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-semibold">Current supply chain map</CardTitle>
        <p className="mt-1 text-xs text-muted-foreground">
          Geographic view of your organization and its known upstream, downstream and verifier
          partners.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Nodes" value={nodes.length} />
          <Stat label="Countries" value={countries} />
          <Stat label="Upstream" value={upstream} />
          <Stat label="Downstream" value={downstream} />
        </div>
        {nodes.length > 1 ? (
          <EcosystemGoogleMap entities={nodes} height={460} />
        ) : (
          <div className="rounded-lg border border-dashed px-6 py-10 text-center text-sm text-muted-foreground">
            No mapped partners yet. Upload your supply chain above to populate the map.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}
