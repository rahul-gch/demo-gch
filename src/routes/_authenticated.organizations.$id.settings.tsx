import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getEntity } from "@/seed/all-entities";
import {
  setOverride,
  clearOverride,
  getOverride,
} from "@/seed/org-overrides";

export const Route = createFileRoute("/_authenticated/organizations/$id/settings")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgSettingsPage,
});

function OrgSettingsPage() {
  const { entity: e } = Route.useLoaderData();
  const override = getOverride(e.id);

  const [name, setName] = useState(e.name);
  const [country, setCountry] = useState(e.country);
  const [region, setRegion] = useState(e.region);
  const [city, setCity] = useState(e.city);
  const [capacity, setCapacity] = useState(e.capacity);
  const [moq, setMoq] = useState(e.moq);
  const [leadTime, setLeadTime] = useState(e.leadTimeDays || 0);
  const [deliveryTimeframe, setDeliveryTimeframe] = useState(
    e.deliveryTimeframeDays ?? e.leadTimeDays ?? 30,
  );
  const [onTimeRate, setOnTimeRate] = useState(e.onTimeRate ?? 85);
  const [avgDelay, setAvgDelay] = useState(e.avgDelayDays ?? 2);
  const [materials, setMaterials] = useState(e.materials.join(", "));
  const [certs, setCerts] = useState(e.certifications.join(", "));

  const save = () => {
    setOverride(e.id, {
      name,
      country,
      region,
      city,
      capacity,
      moq,
      leadTimeDays: Number(leadTime) || 0,
      deliveryTimeframeDays: Number(deliveryTimeframe) || 0,
      onTimeRate: Number(onTimeRate) || 0,
      avgDelayDays: Number(avgDelay) || 0,
      materials: materials.split(",").map((s: string) => s.trim()).filter(Boolean),
      certifications: certs.split(",").map((s: string) => s.trim()).filter(Boolean),
    });
    toast.success("Organization profile saved");
  };

  const reset = () => {
    clearOverride(e.id);
    toast.success("Profile reset to seed values");
    setTimeout(() => window.location.reload(), 200);
  };

  const hasOverride = override && Object.keys(override).length > 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organization settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Editable profile for {e.name}. Changes feed dashboards and matchmaking.
          </p>
        </div>
        {hasOverride && (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">
            Local override active
          </Badge>
        )}
      </header>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Identity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Row label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Row>
          <Row label="Country">
            <Input value={country} onChange={(e) => setCountry(e.target.value)} />
          </Row>
          <Row label="Region / State">
            <Input value={region} onChange={(e) => setRegion(e.target.value)} />
          </Row>
          <Row label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </Row>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Operations & reliability</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Row label="Capacity">
            <Input value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </Row>
          <Row label="MOQ">
            <Input value={moq} onChange={(e) => setMoq(e.target.value)} />
          </Row>
          <Row label="Lead time (days)">
            <Input
              type="number"
              value={leadTime}
              onChange={(e) => setLeadTime(parseInt(e.target.value) || 0)}
            />
          </Row>
          <Row label="Target delivery timeframe (days)">
            <Input
              type="number"
              value={deliveryTimeframe}
              onChange={(e) => setDeliveryTimeframe(parseInt(e.target.value) || 0)}
            />
          </Row>
          <Row label="On-time rate (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={onTimeRate}
              onChange={(e) => setOnTimeRate(parseInt(e.target.value) || 0)}
            />
          </Row>
          <Row label="Average delay (days)">
            <Input
              type="number"
              min={0}
              value={avgDelay}
              onChange={(e) => setAvgDelay(parseInt(e.target.value) || 0)}
            />
          </Row>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Materials & certifications</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <Row label="Materials (comma-separated)">
            <Textarea
              rows={2}
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
            />
          </Row>
          <Row label="Certifications (comma-separated)">
            <Textarea rows={2} value={certs} onChange={(e) => setCerts(e.target.value)} />
          </Row>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        {hasOverride && (
          <Button variant="ghost" onClick={reset}>
            Reset to defaults
          </Button>
        )}
        <Button onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
