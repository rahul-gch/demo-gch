import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  useOrgMatchPreferences,
  useSaveOrgMatchPreferences,
  DEFAULT_PREFERENCES,
  type MatchPreferences,
} from "@/lib/match-preferences";
import { Sliders, Save, Check, Loader2 } from "lucide-react";

const ALL_TIERS = ["Tier 0 (Brand)", "Tier 1 (Garment Factory)", "Tier 2 (Fabric Mill)", "Tier 3 (Spinner)", "Tier 4 (Farmer / Ginner)"];
const ALL_COUNTRIES = ["Egypt", "Turkey", "Portugal", "India", "Pakistan", "Germany", "China", "Bangladesh", "Vietnam", "Italy", "USA"];
const ALL_MATERIALS = ["Cotton", "Organic Cotton", "Denim", "Wool", "Viscose", "Polyester", "Recycled Polyester", "Linen", "Silk"];
const ALL_GARMENT_TYPES = ["Women", "Men", "Kids", "Baby", "Unisex", "Knits", "Woven", "Denimwear", "Outerwear"];
const ALL_CERTS = ["GOTS", "GRS", "OEKO-TEX Standard 100", "BSCI", "SA8000", "Fair Trade", "OCS", "Cradle to Cradle"];

export function MatchPreferencesTab({ orgId }: { orgId: string }) {
  const { preferences, isLoading } = useOrgMatchPreferences(orgId);
  const saveMutation = useSaveOrgMatchPreferences();
  const [prefs, setPrefs] = useState<MatchPreferences>(preferences);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (preferences) {
      setPrefs(preferences);
    }
  }, [preferences]);

  const toggleArrayItem = (key: keyof Pick<MatchPreferences, "targetTiers" | "targetCountries" | "targetMaterials" | "productCategories" | "certifications">, item: string) => {
    setPrefs((prev) => {
      const current = prev[key];
      const next = current.includes(item)
        ? current.filter((x) => x !== item)
        : [...current, item];
      return { ...prev, [key]: next };
    });
    setSaved(false);
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync({ orgId, prefs });
      setSaved(true);
      toast.success("Matchmaking criteria & preferences saved to cloud!");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      toast.error("Failed to save preferences");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                <Sliders className="h-5 w-5 text-primary" />
                Matchmaking & Sourcing Criteria
              </CardTitle>
              <CardDescription>
                Define your target partner requirements. The AI engine uses these criteria to rank and suggest the most compatible supply chain partners.
              </CardDescription>
            </div>
            <Button onClick={handleSave} className="gap-2">
              {saved ? <Check className="h-4 w-4 text-emerald-300" /> : <Save className="h-4 w-4" />}
              {saved ? "Saved" : "Save Criteria"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Target Tiers */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Target Supply Chain Tiers to Connect With</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_TIERS.map((tier) => {
                const isSelected = prefs.targetTiers.includes(tier);
                return (
                  <Badge
                    key={tier}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleArrayItem("targetTiers", tier)}
                  >
                    {tier}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Target Countries */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Preferred Regions & Sourcing Locations</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_COUNTRIES.map((co) => {
                const isSelected = prefs.targetCountries.includes(co);
                return (
                  <Badge
                    key={co}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleArrayItem("targetCountries", co)}
                  >
                    {co}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Materials & Raw Fibers Required</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_MATERIALS.map((mat) => {
                const isSelected = prefs.targetMaterials.includes(mat);
                return (
                  <Badge
                    key={mat}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleArrayItem("targetMaterials", mat)}
                  >
                    {mat}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Garment / Product Types */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Garment & Product Categories</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_GARMENT_TYPES.map((cat) => {
                const isSelected = prefs.productCategories.includes(cat);
                return (
                  <Badge
                    key={cat}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleArrayItem("productCategories", cat)}
                  >
                    {cat}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mandatory Certifications</Label>
            <div className="flex flex-wrap gap-2">
              {ALL_CERTS.map((cert) => {
                const isSelected = prefs.certifications.includes(cert);
                return (
                  <Badge
                    key={cert}
                    variant={isSelected ? "default" : "outline"}
                    className="cursor-pointer text-xs py-1.5 px-3"
                    onClick={() => toggleArrayItem("certifications", cert)}
                  >
                    {cert}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Operational Metrics (Max Lead Time & Min OTR) */}
          <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Max Desired Lead Time (Days)</Label>
              <Input
                type="number"
                placeholder="e.g. 45"
                value={prefs.maxLeadTimeDays ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setPrefs((p) => ({ ...p, maxLeadTimeDays: val }));
                  setSaved(false);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Min On-Time Delivery Rate (%)</Label>
              <Input
                type="number"
                placeholder="e.g. 90"
                value={prefs.minOnTimeRate ?? ""}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value, 10) : null;
                  setPrefs((p) => ({ ...p, minOnTimeRate: val }));
                  setSaved(false);
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
