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
import { Eye, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getEntity } from "@/seed/all-entities";
import { updateOrgProfile } from "@/lib/orgs.functions";
import { refreshRegistry } from "@/lib/registry";
import { MembersPanel } from "@/components/settings/MembersPanel";
import { EntityProfilePanel } from "@/components/settings/EntityProfilePanel";
import { BrandingPanel } from "@/components/settings/BrandingPanel";
import { useOrgRole } from "@/lib/use-org-role";
import { CountrySelect } from "@/components/CountrySelect";

import { ORG_TYPES } from "@/lib/org-types";

const SIZE_OPTIONS = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const COMMON_COUNTRIES = [
  "Egypt",
  "Turkey",
  "Portugal",
  "India",
  "Pakistan",
  "Germany",
  "China",
  "Bangladesh",
  "Vietnam",
  "Italy",
  "USA",
];

export const Route = createFileRoute("/_authenticated/organizations/$id/settings")({
  loader: async ({ params, context }) => {
    let entity = getEntity(params.id);
    if (!entity) {
      await refreshRegistry(context.queryClient);
      entity = getEntity(params.id);
    }
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
  const orgUuid = e.orgUuid ?? e.id;
  const { role } = useOrgRole(orgUuid);
  const isViewer = role === "viewer";

  const [name, setName] = useState(e.name);
  const [type, setType] = useState(e.organizationType || e.rawEntityType || "");
  const [country, setCountry] = useState(e.country);
  const [operatingCountries, setOperatingCountries] = useState<string[]>(
    e.operatingCountries && e.operatingCountries.length > 0
      ? e.operatingCountries
      : e.country
        ? [e.country]
        : [],
  );
  const [region, setRegion] = useState(e.region);
  const [city, setCity] = useState(e.city);
  const [address, setAddress] = useState(e.address ?? "");
  const [zipCode, setZipCode] = useState(e.zipCode ?? "");
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

  const addOperatingCountry = (val: string) => {
    const trimmed = val.trim();
    if (!trimmed) return;
    if (!operatingCountries.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setOperatingCountries([...operatingCountries, trimmed]);
    }
  };

  const removeOperatingCountry = (val: string) => {
    setOperatingCountries(operatingCountries.filter((c) => c.toLowerCase() !== val.toLowerCase()));
  };

  const save = async () => {
    if (isViewer) {
      toast.error("You have view-only permissions in this organization.");
      return;
    }
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
          operatingCountries:
            operatingCountries.length > 0
              ? operatingCountries
              : country.trim()
                ? [country.trim()]
                : [],
          region: region.trim() || null,
          city: city.trim() || null,
          address: address.trim() || null,
          zipCode: zipCode.trim() || null,
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

      {isViewer && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-950 dark:text-amber-200">
          <Eye className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-semibold">Viewer Access Mode</p>
            <p className="text-xs opacity-90">
              You have read-only access to <strong>{e.name}</strong>. Editing company information, uploading branding, and managing members are disabled.
            </p>
          </div>
        </div>
      )}

      <Tabs
        defaultValue={hash === "members" ? "members" : hash === "entity" ? "entity" : "profile"}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="entity">Entity profile</TabsTrigger>
          <TabsTrigger value="members">Members & invites</TabsTrigger>
        </TabsList>

        <TabsContent value="entity" className="space-y-6">
          <EntityProfilePanel orgId={orgUuid || e.id} />
        </TabsContent>

        <TabsContent value="members" className="space-y-6">
          <MembersPanel orgId={orgUuid || e.id} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <BrandingPanel orgId={orgUuid} logo={e.logoUrl ?? null} banners={e.bannerUrls ?? []} />
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Identity</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Row label="Organization name">
                <Input value={name} onChange={(ev) => setName(ev.target.value)} disabled={isViewer} />
              </Row>
              <Row label="Organization type">
                <Select value={type} onValueChange={setType} disabled={isViewer}>
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
              <Row label="Headquarters country">
                <CountrySelect
                  value={country}
                  onChange={(newCountry) => {
                    setCountry(newCountry);
                    if (
                      newCountry.trim() &&
                      !operatingCountries.some((c) => c.toLowerCase() === newCountry.trim().toLowerCase())
                    ) {
                      setOperatingCountries((prev) => [...prev, newCountry.trim()]);
                    }
                  }}
                  placeholder="Select headquarters country..."
                  disabled={isViewer}
                />
              </Row>
              <Row label="Region / State">
                <Input value={region} onChange={(ev) => setRegion(ev.target.value)} placeholder="e.g. Marmara" disabled={isViewer} />
              </Row>
              <Row label="City">
                <Input value={city} onChange={(ev) => setCity(ev.target.value)} placeholder="e.g. Istanbul" disabled={isViewer} />
              </Row>
              <Row label="Postal / ZIP code">
                <Input value={zipCode} onChange={(ev) => setZipCode(ev.target.value)} placeholder="e.g. 34100" disabled={isViewer} />
              </Row>
              <Row label="Street address (physical facility or HQ)" className="md:col-span-2">
                <Input
                  value={address}
                  onChange={(ev) => setAddress(ev.target.value)}
                  placeholder="e.g. Organize Sanayi Bolgesi, 4. Cadde No: 12"
                  disabled={isViewer}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Full physical address of your facility or headquarters for customs clearance, official audits, and partner verification.
                </p>
              </Row>
              <Row label="Website">
                <Input
                  value={website}
                  placeholder="https://example.com"
                  onChange={(ev) => setWebsite(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Company size (employees)">
                <Select value={size} onValueChange={setSize} disabled={isViewer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
              <div className="md:col-span-2 rounded-lg border bg-slate-50/70 dark:bg-muted/30 p-4 space-y-3">
                <div>
                  <Label className="text-sm font-semibold">Operating & Production Countries</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    List all countries where your organization maintains manufacturing facilities, mills, or regional offices (e.g. HQ in Turkey, facility in Egypt). Buyers filtering or searching for any of these countries will match with your profile.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {operatingCountries.map((c) => (
                    <Badge
                      key={c}
                      variant="secondary"
                      className="px-2.5 py-1 text-xs gap-1.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15"
                    >
                      <span>{c}</span>
                      {!isViewer && (
                        <button
                          type="button"
                          onClick={() => removeOperatingCountry(c)}
                          className="text-primary/70 hover:text-primary transition-colors focus:outline-none"
                          title={`Remove ${c}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {operatingCountries.length === 0 && (
                    <span className="text-xs text-muted-foreground italic">
                      No additional operating countries specified. Primary country ({country || "none"}) is used.
                    </span>
                  )}
                </div>
                {!isViewer && (
                  <div className="space-y-2 pt-1 border-t border-border/60">
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <div className="w-64">
                        <CountrySelect
                          value=""
                          onChange={(val) => {
                            if (val) addOperatingCountry(val);
                          }}
                          placeholder="Select country to add..."
                          disabled={isViewer}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="text-[11px] text-muted-foreground">Quick add:</span>
                      {COMMON_COUNTRIES.filter(
                        (c) => !operatingCountries.some((oc) => oc.toLowerCase() === c.toLowerCase()),
                      )
                        .slice(0, 8)
                        .map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => addOperatingCountry(c)}
                            className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-muted-foreground/30 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                          >
                            + {c}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <Row label="About / Description" className="md:col-span-2">
                <Textarea
                  value={description}
                  rows={3}
                  onChange={(ev) => setDescription(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Capacity &amp; operations</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Row label="Monthly capacity">
                <Input
                  value={capacity}
                  placeholder="e.g. 50,000 units/mo"
                  onChange={(ev) => setCapacity(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Minimum order quantity (MOQ)">
                <Input
                  value={moq}
                  placeholder="e.g. 500 pcs"
                  onChange={(ev) => setMoq(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Production lead time (days)">
                <Input
                  type="number"
                  value={leadTime}
                  onChange={(ev) => setLeadTime(Number(ev.target.value))}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Delivery timeframe (days)">
                <Input
                  type="number"
                  value={deliveryTimeframe}
                  onChange={(ev) => setDeliveryTimeframe(Number(ev.target.value))}
                  disabled={isViewer}
                />
              </Row>
              <Row label="On-time delivery rate (%)">
                <Input
                  type="number"
                  value={onTimeRate}
                  onChange={(ev) => setOnTimeRate(Number(ev.target.value))}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Average delay (days)">
                <Input
                  type="number"
                  value={avgDelay}
                  onChange={(ev) => setAvgDelay(Number(ev.target.value))}
                  disabled={isViewer}
                />
              </Row>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Capabilities &amp; materials</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Row label="Materials (comma separated)">
                <Input
                  value={materials}
                  placeholder="Organic cotton, recycled polyester..."
                  onChange={(ev) => setMaterials(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Capabilities (comma separated)">
                <Input
                  value={capabilities}
                  placeholder="Weaving, digital printing, cut & sew..."
                  onChange={(ev) => setCapabilities(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Certifications (comma separated)">
                <Input
                  value={certs}
                  placeholder="GOTS, OEKO-TEX 100, Fair Trade..."
                  onChange={(ev) => setCerts(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Product categories (comma separated)">
                <Input
                  value={productCategories}
                  placeholder="Apparel, Home Textiles, Accessories..."
                  onChange={(ev) => setProductCategories(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
              <Row label="Product types (comma separated)">
                <Input
                  value={productTypes}
                  placeholder="T-Shirts, Denim, Knitwear..."
                  onChange={(ev) => setProductTypes(ev.target.value)}
                  disabled={isViewer}
                />
              </Row>
            </CardContent>
          </Card>

          {!isViewer && (
            <div className="flex justify-end">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
