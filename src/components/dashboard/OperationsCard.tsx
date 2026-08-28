import { useMemo, useState } from "react";
import type { Entity } from "@/seed/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { setOverride } from "@/seed/org-overrides";
import { useServerFn } from "@tanstack/react-start";
import { updateOrgOperations } from "@/lib/orgs.functions";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  X,
  Clock,
  Package,
  Factory,
  Gauge,
  Sparkles,
  Layers,
} from "lucide-react";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const SPEC_OPTIONS = [
  "Sportswear",
  "Womenswear",
  "Menswear",
  "Kidswear",
  "Denim",
  "Luxury",
  "Fast fashion",
  "Outdoor",
  "Loungewear",
  "Activewear",
  "Knitwear",
  "Footwear",
  "Traceability",
  "Digital Product Passport",
];

const MATERIAL_OPTIONS = [
  "Cotton",
  "Organic Cotton",
  "Recycled Cotton",
  "Denim",
  "Wool",
  "Viscose",
  "Polyester",
  "Recycled Polyester",
  "Linen",
  "Silk",
  "Hemp",
  "Nylon",
];

const CAPABILITY_OPTIONS = [
  "Spinning",
  "Weaving",
  "Knitting",
  "Dyeing",
  "Printing",
  "Finishing",
  "Cut & Sew",
  "Embroidery",
  "Washing",
  "Packaging",
];

function ChipEditor({
  label,
  value,
  onChange,
  suggestions,
}: {
  label: string;
  value: string[];
  onChange: (n: string[]) => void;
  suggestions: string[];
}) {
  const [input, setInput] = useState("");
  const add = (v: string) => {
    const t = v.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  };
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {value.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">
            {v}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="opacity-60 hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(input);
            }
          }}
          placeholder={`Add ${label.toLowerCase()}`}
          className="h-8"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => add(input)}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-1 pt-0.5">
        {suggestions
          .filter((s) => !value.includes(s))
          .slice(0, 8)
          .map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-muted"
            >
              + {s}
            </button>
          ))}
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold tabular-nums text-slate-900">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

export function OperationsCard({ entity }: { entity: Entity }) {
  const updateFn = useServerFn(updateOrgOperations);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [moq, setMoq] = useState(entity.moq ?? "");
  const [leadTime, setLeadTime] = useState(entity.leadTimeDays ? String(entity.leadTimeDays) : "");
  const [capacity, setCapacity] = useState(entity.capacity ?? "");
  const [onTime, setOnTime] = useState(entity.onTimeRate ? String(entity.onTimeRate) : "");
  const [materials, setMaterials] = useState<string[]>(entity.materials ?? []);
  const [capabilities, setCapabilities] = useState<string[]>(entity.capabilities ?? []);
  const [specializations, setSpecializations] = useState<string[]>(entity.specializations ?? []);

  const isDbOrg = useMemo(() => UUID_RE.test(entity.id), [entity.id]);

  const reset = () => {
    setMoq(entity.moq ?? "");
    setLeadTime(entity.leadTimeDays ? String(entity.leadTimeDays) : "");
    setCapacity(entity.capacity ?? "");
    setOnTime(entity.onTimeRate ? String(entity.onTimeRate) : "");
    setMaterials(entity.materials ?? []);
    setCapabilities(entity.capabilities ?? []);
    setSpecializations(entity.specializations ?? []);
  };

  const save = async () => {
    setSaving(true);
    const patch = {
      moq: moq.trim() || null,
      leadTimeDays: leadTime ? Number(leadTime) : null,
      capacity: capacity.trim() || null,
      onTimeRate: onTime ? Number(onTime) : null,
      materials,
      capabilities,
      specializations,
    };
    try {
      if (isDbOrg) {
        await updateFn({ data: { orgId: entity.id, ...patch } });
      } else {
        setOverride(entity.id, {
          moq: patch.moq ?? undefined,
          leadTimeDays: patch.leadTimeDays ?? undefined,
          capacity: patch.capacity ?? undefined,
          onTimeRate: patch.onTimeRate ?? undefined,
          materials,
          capabilities,
          specializations,
        });
      }
      toast.success("Operations updated");
      setEditing(false);
      if (isDbOrg) {
        // Reload so server-fetched entity refreshes.
        window.setTimeout(() => window.location.reload(), 300);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-base font-semibold">Operations & Capacity</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Lead time, MOQ, capacity, specializations
          </p>
        </div>
        {!editing ? (
          <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
            <Pencil className="mr-1.5 h-3 w-3" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                reset();
                setEditing(false);
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-5">
        {!editing ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Stat
                icon={Clock}
                label="Lead time"
                value={entity.leadTimeDays ? `${entity.leadTimeDays} days` : ""}
              />
              <Stat icon={Package} label="MOQ" value={entity.moq} />
              <Stat icon={Factory} label="Capacity" value={entity.capacity} />
              <Stat
                icon={Gauge}
                label="On-time rate"
                value={entity.onTimeRate ? `${entity.onTimeRate}%` : ""}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-3 w-3" /> Specializations
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(entity.specializations ?? []).length === 0 ? (
                  <span className="text-xs text-muted-foreground">
                    No specializations added yet.
                  </span>
                ) : (
                  entity.specializations!.map((s) => (
                    <Badge key={s} variant="secondary">
                      {s}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            {((entity.materials ?? []).length > 0 || (entity.capabilities ?? []).length > 0) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(entity.materials ?? []).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Layers className="h-3 w-3" /> Materials
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entity.materials!.map((m) => (
                        <Badge key={m} variant="outline">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(entity.capabilities ?? []).length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Factory className="h-3 w-3" /> Capabilities
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {entity.capabilities!.map((c) => (
                        <Badge key={c} variant="outline">
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1">
                <Label className="text-xs">Lead time (days)</Label>
                <Input
                  type="number"
                  min={0}
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  placeholder="45"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">MOQ</Label>
                <Input value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="500 pcs" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Capacity</Label>
                <Input
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="1M units/yr"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">On-time rate (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={onTime}
                  onChange={(e) => setOnTime(e.target.value)}
                  placeholder="92"
                />
              </div>
            </div>

            <ChipEditor
              label="Specializations"
              value={specializations}
              onChange={setSpecializations}
              suggestions={SPEC_OPTIONS}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <ChipEditor
                label="Materials"
                value={materials}
                onChange={setMaterials}
                suggestions={MATERIAL_OPTIONS}
              />
              <ChipEditor
                label="Capabilities"
                value={capabilities}
                onChange={setCapabilities}
                suggestions={CAPABILITY_OPTIONS}
              />
            </div>
            {!isDbOrg && (
              <p className="text-[11px] text-muted-foreground">
                Demo organization — changes are saved locally in your browser.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
