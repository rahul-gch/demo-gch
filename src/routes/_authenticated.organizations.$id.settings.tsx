import { createFileRoute, notFound, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { getEntity } from "@/seed/all-entities";
import { updateOrgProfile } from "@/lib/orgs.functions";
import { refreshRegistry } from "@/lib/registry";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { ORG_TYPES } from "@/lib/org-types";

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

export const Route = createFileRoute("/_authenticated/organizations/$id/settings")({
  loader: ({ params }) => {
    const entity = getEntity(params.id);
    if (!entity) throw notFound();
    return { entity };
  },
  component: OrgSettingsPage,
});

const csv = (list: string[]) => list.join(", ");
const parseCsv = (v: string) =>
  v
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

function OrgSettingsPage() {
  const { entity: e } = Route.useLoaderData();
  const queryClient = useQueryClient();
  const hash = useLocation({ select: (l) => l.hash });
  const saveProfile = useServerFn(updateOrgProfile);

  const [name, setName] = useState(e.name);
  const [type, setType] = useState(e.organizationType || e.rawEntityType || "");
  const [country, setCountry] = useState(e.country);
  const [region, setRegion] = useState(e.region);
  const [city, setCity] = useState(e.city);
  const [website, setWebsite] = useState(e.website ?? "");
  const [description, setDescription] = useState(e.description ?? "");
  const [size, setSize] = useState<string>("");
  const [capacity, setCapacity] = useState(e.capacity);
  const [moq, setMoq] = useState(e.moq);
  const [leadTime, setLeadTime] = useState(e.leadTimeDays || 0);
  const [deliveryTimeframe, setDeliveryTimeframe] = useState(
    e.deliveryTimeframeDays ?? e.leadTimeDays ?? 30,
  );
  const [onTimeRate, setOnTimeRate] = useState(e.onTimeRate ?? 0);
  const [avgDelay, setAvgDelay] = useState(e.avgDelayDays ?? 0);
  const [materials, setMaterials] = useState(csv(e.materials));
  const [capabilities, setCapabilities] = useState(csv(e.capabilities));
  const [certs, setCerts] = useState(csv(e.certifications));
  const [productCategories, setProductCategories] = useState(csv(e.productCategories ?? []));
  const [productTypes, setProductTypes] = useState(csv(e.productTypes ?? []));
  const [saving, setSaving] = useState(false);

  const orgUuid = e.orgUuid;

  const save = async () => {
    if (!orgUuid) {
      toast.error("This organization is not editable.");
      return;
    }
    setSaving(true);
    try {
      await saveProfile({
        data: {
          orgId: orgUuid,
          name: name.trim(),
          type: type.trim() || undefined,
          country: country.trim() || null,
          region: region.trim() || null,
          city: city.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
          size: size || null,
          capacity: capacity.trim() || null,
          moq: moq.trim() || null,
          leadTimeDays: Number(leadTime) || 0,
          deliveryTimeframeDays: Number(deliveryTimeframe) || 0,
          onTimeRate: Number(onTimeRate) || 0,
          avgDelayDays: Number(avgDelay) || 0,
          materials: parseCsv(materials),
          capabilities: parseCsv(capabilities),
          certifications: parseCsv(certs),
          productCategories: parseCsv(productCategories),
          productTypes: parseCsv(productTypes),
        },
      });
      await refreshRegistry(queryClient);
      toast.success("Organization profile saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message.replace(/^.*: /, "") : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">Organization settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage {e.name}'s profile and team members. Everything you save here powers your
          dashboard, matchmaking and passport.
        </p>
      </header>

      <Tabs defaultValue={hash === "members" ? "members" : "profile"} className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="members">Members & invites</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <MembersPanel orgId={orgUuid || e.id} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Row label="Organization name">
                <Input value={name} onChange={(ev) => setName(ev.target.value)} />
              </Row>
              <Row label="Organization type">
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {ORG_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <Row label="Country">
                <Input value={country} onChange={(ev) => setCountry(ev.target.value)} />
              </Row>
              <Row label="Region / State">
                <Input value={region} onChange={(ev) => setRegion(ev.target.value)} />
              </Row>
              <Row label="City">
                <Input value={city} onChange={(ev) => setCity(ev.target.value)} />
              </Row>
              <Row label="Website">
                <Input
                  value={website}
                  onChange={(ev) => setWebsite(ev.target.value)}
                  placeholder="https://example.com"
                />
              </Row>
              <Row label="Company size">
                <Select value={size} onValueChange={setSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s} employees
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <div className="md:col-span-2">
                <Row label="About the organization">
                  <Textarea
                    rows={4}
                    value={description}
                    onChange={(ev) => setDescription(ev.target.value)}
                    placeholder="What you make, who you work with, and what you're known for."
                  />
                </Row>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Operations & reliability</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Row label="Capacity">
                <Input value={capacity} onChange={(ev) => setCapacity(ev.target.value)} />
              </Row>
              <Row label="MOQ">
                <Input value={moq} onChange={(ev) => setMoq(ev.target.value)} />
              </Row>
              <Row label="Lead time (days)">
                <Input
                  type="number"
                  value={leadTime}
                  onChange={(ev) => setLeadTime(parseInt(ev.target.value) || 0)}
                />
              </Row>
              <Row label="Target delivery timeframe (days)">
                <Input
                  type="number"
                  value={deliveryTimeframe}
                  onChange={(ev) => setDeliveryTimeframe(parseInt(ev.target.value) || 0)}
                />
              </Row>
              <Row label="On-time rate (%)">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={onTimeRate}
                  onChange={(ev) => setOnTimeRate(parseInt(ev.target.value) || 0)}
                />
              </Row>
              <Row label="Average delay (days)">
                <Input
                  type="number"
                  min={0}
                  value={avgDelay}
                  onChange={(ev) => setAvgDelay(parseInt(ev.target.value) || 0)}
                />
              </Row>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                Capabilities, materials & certifications
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <Row label="Materials (comma-separated)">
                <Textarea
                  rows={2}
                  value={materials}
                  onChange={(ev) => setMaterials(ev.target.value)}
                />
              </Row>
              <Row label="Capabilities (comma-separated)">
                <Textarea
                  rows={2}
                  value={capabilities}
                  onChange={(ev) => setCapabilities(ev.target.value)}
                />
              </Row>
              <Row label="Certifications (comma-separated)">
                <Textarea rows={2} value={certs} onChange={(ev) => setCerts(ev.target.value)} />
              </Row>
              <Row label="Product categories (comma-separated)">
                <Textarea
                  rows={2}
                  value={productCategories}
                  onChange={(ev) => setProductCategories(ev.target.value)}
                />
              </Row>
              <Row label="Product types (comma-separated)">
                <Textarea
                  rows={2}
                  value={productTypes}
                  onChange={(ev) => setProductTypes(ev.target.value)}
                />
              </Row>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
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
