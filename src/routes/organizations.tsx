import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VerificationBadge, RiskBadge } from "@/components/StatusBadge";
import { ENTITIES, ENTITY_TYPES } from "@/seed/entities";

export const Route = createFileRoute("/organizations")({
  head: () => ({
    meta: [
      { title: "Organizations — Global Chain Hub" },
      { name: "description", content: "Search and filter all entities in the Global Chain Hub registry." },
    ],
  }),
  component: OrganizationsPage,
});

const ALL = "__all";

function uniq(arr: string[]) {
  return Array.from(new Set(arr)).sort();
}

function OrganizationsPage() {
  const [q, setQ] = useState("");
  const [entityType, setEntityType] = useState(ALL);
  const [actorType, setActorType] = useState(ALL);
  const [country, setCountry] = useState(ALL);
  const [certification, setCertification] = useState(ALL);
  const [risk, setRisk] = useState(ALL);
  const [confidence, setConfidence] = useState(ALL);
  const [verification, setVerification] = useState(ALL);
  const [completeness, setCompleteness] = useState(ALL);

  const countries = useMemo(() => uniq(ENTITIES.map((e) => e.country)), []);
  const actors = useMemo(() => uniq(ENTITIES.map((e) => e.actorType)), []);
  const certs = useMemo(() => uniq(ENTITIES.flatMap((e) => e.certifications)), []);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return ENTITIES.filter((e) => {
      if (entityType !== ALL && e.entityType !== entityType) return false;
      if (actorType !== ALL && e.actorType !== actorType) return false;
      if (country !== ALL && e.country !== country) return false;
      if (certification !== ALL && !e.certifications.includes(certification)) return false;
      if (risk !== ALL && e.riskLevel !== risk) return false;
      if (verification !== ALL && e.verificationStatus !== verification) return false;
      if (confidence === "high" && e.confidenceScore < 85) return false;
      if (confidence === "med" && (e.confidenceScore < 70 || e.confidenceScore >= 85)) return false;
      if (confidence === "low" && e.confidenceScore >= 70) return false;
      if (completeness === "high" && e.profileCompleteness < 85) return false;
      if (completeness === "med" && (e.profileCompleteness < 70 || e.profileCompleteness >= 85))
        return false;
      if (completeness === "low" && e.profileCompleteness >= 70) return false;
      if (term) {
        const hay = [
          e.name,
          e.country,
          e.region,
          e.actorType,
          ...e.materials,
          ...e.capabilities,
          ...e.certifications,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [q, entityType, actorType, country, certification, risk, confidence, verification, completeness]);

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Organization Registry</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ENTITIES.length} entities in registry — {rows.length} matching current filters.
          </p>
        </header>

        <Card className="shadow-sm">
          <CardContent className="space-y-4 p-5">
            <Input
              placeholder="Search by name, country, material, capability, certification…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xl"
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <FilterSelect label="Entity Type" value={entityType} onChange={setEntityType} options={ENTITY_TYPES} />
              <FilterSelect label="Actor Type" value={actorType} onChange={setActorType} options={actors} />
              <FilterSelect label="Country" value={country} onChange={setCountry} options={countries} />
              <FilterSelect label="Certification" value={certification} onChange={setCertification} options={certs} />
              <FilterSelect label="Risk Level" value={risk} onChange={setRisk} options={["Low", "Medium", "High"]} />
              <FilterSelect
                label="Confidence"
                value={confidence}
                onChange={setConfidence}
                options={[
                  { value: "high", label: "High (85+)" },
                  { value: "med", label: "Medium (70–84)" },
                  { value: "low", label: "Low (<70)" },
                ]}
              />
              <FilterSelect
                label="Verification"
                value={verification}
                onChange={setVerification}
                options={["Verified", "Pending", "Incomplete", "Flagged"]}
              />
              <FilterSelect
                label="Completeness"
                value={completeness}
                onChange={setCompleteness}
                options={[
                  { value: "high", label: "High (85+)" },
                  { value: "med", label: "Medium (70–84)" },
                  { value: "low", label: "Low (<70)" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Entity Type</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Materials</TableHead>
                    <TableHead>Capabilities</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Completeness</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Evidence</TableHead>
                    <TableHead className="text-right">Missing</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Link
                          to="/organizations/$id"
                          params={{ id: e.id }}
                          className="font-medium hover:underline"
                        >
                          {e.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{e.entityType}</TableCell>
                      <TableCell className="text-muted-foreground">{e.actorType}</TableCell>
                      <TableCell className="text-muted-foreground">{e.country}</TableCell>
                      <TableCell className="text-muted-foreground">{e.region}</TableCell>
                      <TableCell>
                        <TagList items={e.materials} />
                      </TableCell>
                      <TableCell>
                        <TagList items={e.capabilities} />
                      </TableCell>
                      <TableCell>
                        <TagList items={e.certifications} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{e.confidenceScore}%</TableCell>
                      <TableCell>
                        <RiskBadge level={e.riskLevel} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{e.profileCompleteness}%</TableCell>
                      <TableCell>
                        <VerificationBadge status={e.verificationStatus} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{e.evidenceCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{e.missingDataCount}</TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={14} className="py-10 text-center text-muted-foreground">
                        No entities match your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) return <span className="text-muted-foreground">—</span>;
  const shown = items.slice(0, 2);
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <Badge key={s} variant="secondary" className="font-normal">
          {s}
        </Badge>
      ))}
      {extra > 0 && <span className="text-xs text-muted-foreground">+{extra}</span>}
    </div>
  );
}

type Option = string | { value: string; label: string };

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly Option[];
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
