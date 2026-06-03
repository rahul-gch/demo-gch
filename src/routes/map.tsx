import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VerificationBadge, RiskBadge } from "@/components/StatusBadge";
import { MockWorldMap } from "@/components/MockWorldMap";
import { ENTITIES, ENTITY_TYPES } from "@/seed/entities";
import type { Entity } from "@/seed/types";
import { X } from "lucide-react";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Map View — Global Chain Hub" },
      { name: "description", content: "Geographic view of ecosystem entities." },
    ],
  }),
  component: MapPage,
});

const ALL = "__all";

function MapPage() {
  const [entityType, setEntityType] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [risk, setRisk] = useState(ALL);
  const [verification, setVerification] = useState(ALL);
  const [confidence, setConfidence] = useState(ALL);
  const [selected, setSelected] = useState<Entity | null>(null);

  const countries = useMemo(
    () => Array.from(new Set(ENTITIES.map((e) => e.country))).sort(),
    [],
  );

  const filtered = useMemo(
    () =>
      ENTITIES.filter((e) => {
        if (entityType !== ALL && e.entityType !== entityType) return false;
        if (country !== ALL && e.country !== country) return false;
        if (risk !== ALL && e.riskLevel !== risk) return false;
        if (verification !== ALL && e.verificationStatus !== verification) return false;
        if (confidence === "high" && e.confidenceScore < 85) return false;
        if (confidence === "med" && (e.confidenceScore < 70 || e.confidenceScore >= 85))
          return false;
        if (confidence === "low" && e.confidenceScore >= 70) return false;
        return true;
      }),
    [entityType, country, risk, verification, confidence],
  );

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Map View</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Geographic ecosystem map of all seeded entities.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardContent className="grid grid-cols-2 gap-3 p-5 md:grid-cols-5">
            <Filter label="Entity Type" value={entityType} onChange={setEntityType} options={ENTITY_TYPES} />
            <Filter label="Country" value={country} onChange={setCountry} options={countries} />
            <Filter label="Risk" value={risk} onChange={setRisk} options={["Low", "Medium", "High"]} />
            <Filter
              label="Verification"
              value={verification}
              onChange={setVerification}
              options={["Verified", "Pending", "Incomplete", "Flagged"]}
            />
            <Filter
              label="Confidence"
              value={confidence}
              onChange={setConfidence}
              options={[
                { value: "high", label: "High (85+)" },
                { value: "med", label: "Medium (70–84)" },
                { value: "low", label: "Low (<70)" },
              ]}
            />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <MockWorldMap
                  entities={filtered}
                  onSelect={setSelected}
                  selectedId={selected?.id}
                  height={560}
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  Showing {filtered.length} of {ENTITIES.length} entities.
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            {selected ? (
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {selected.gchNumber}
                    </div>
                    <CardTitle className="text-base font-semibold">{selected.name}</CardTitle>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelected(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{selected.entityType}</Badge>
                    <Badge variant="outline">{selected.country}</Badge>
                    <VerificationBadge status={selected.verificationStatus} />
                    <RiskBadge level={selected.riskLevel} />
                  </div>
                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div className="text-muted-foreground">Confidence</div>
                    <div className="text-right tabular-nums">{selected.confidenceScore}%</div>
                    <div className="text-muted-foreground">Evidence</div>
                    <div className="text-right tabular-nums">{selected.evidenceCount}</div>
                    <div className="text-muted-foreground">Missing data</div>
                    <div className="text-right tabular-nums">{selected.missingDataCount}</div>
                  </div>
                  <Block label="Materials" items={selected.materials} />
                  <Block label="Capabilities" items={selected.capabilities} />
                  <Block label="Certifications" items={selected.certifications} />
                  <Button asChild className="w-full">
                    <Link to="/organizations/$id" params={{ id: selected.id }}>
                      View full profile
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-sm">
                <CardContent className="p-6 text-sm text-muted-foreground">
                  Click any pin on the map to see organization details.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function Block({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {items.map((i) => (
          <Badge key={i} variant="secondary" className="font-normal">
            {i}
          </Badge>
        ))}
      </div>
    </div>
  );
}

type Opt = string | { value: string; label: string };

function Filter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Opt[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All</SelectItem>
          {options.map((o) => {
            const v = typeof o === "string" ? o : o.value;
            const l = typeof o === "string" ? o : o.label;
            return (
              <SelectItem key={v} value={v}>
                {l}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
