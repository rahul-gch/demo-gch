import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Loader2, Search } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { aiSearchPartners, type PartnerSearchFilters } from "@/lib/matchmaking-ai.functions";
import { toast } from "sonner";

export function AiPartnerSearch({
  onFilters,
  onSearchText,
}: {
  onFilters: (f: PartnerSearchFilters | null) => void;
  onSearchText?: (text: string) => void;
}) {
  const call = useServerFn(aiSearchPartners);
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<PartnerSearchFilters | null>(null);
  const [loading, setLoading] = useState(false);

  const handleTextChange = (val: string) => {
    setQuery(val);
    if (onSearchText) {
      onSearchText(val);
    }
  };

  const run = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const f = await call({ data: { query: query.trim() } });
      setFilters(f);
      onFilters(f);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI search failed");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFilters(null);
    setQuery("");
    onFilters(null);
    if (onSearchText) onSearchText("");
  };

  const chips: { key: string; label: string }[] = [];
  if (filters) {
    filters.materials?.forEach((m) => chips.push({ key: `mat-${m}`, label: `Material: ${m}` }));
    filters.certifications?.forEach((c) => chips.push({ key: `cert-${c}`, label: `Cert: ${c}` }));
    filters.countries?.forEach((c) => chips.push({ key: `co-${c}`, label: `Country: ${c}` }));
    filters.tiers?.forEach((t) => chips.push({ key: `t-${t}`, label: t }));
    filters.productCategories?.forEach((c) => chips.push({ key: `pc-${c}`, label: c }));
    if (filters.maxLeadTimeDays)
      chips.push({ key: "lt", label: `≤ ${filters.maxLeadTimeDays}d lead time` });
    if (filters.minOnTimeRate)
      chips.push({ key: "otr", label: `≥ ${filters.minOnTimeRate}% on-time` });
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run();
            }}
            placeholder="Search by name, country, material (e.g. Sharabati, GOTS denim in Turkey)"
            className="pl-8"
          />
        </div>
        <Button onClick={run} disabled={loading || !query.trim()} className="gap-1.5">
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 text-amber-300" />
          )}
          AI Filter
        </Button>
        {(filters || query) && (
          <Button variant="outline" onClick={clear}>
            <X className="mr-1 h-4 w-4" /> Clear
          </Button>
        )}
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <Badge key={c.key} variant="secondary" className="text-[10px] font-normal">
              {c.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

export function applyPartnerFilters<
  T extends {
    country?: string;
    materials?: string[];
    certifications?: string[];
    actorType?: string;
    leadTimeDays?: number;
    onTimeRate?: number;
    productCategories?: string[];
  },
>(items: T[], f: PartnerSearchFilters | null): T[] {
  if (!f) return items;
  return items.filter((it) => {
    if (
      f.materials?.length &&
      !f.materials.some((m) =>
        it.materials?.some((im) => im.toLowerCase().includes(m.toLowerCase())),
      )
    )
      return false;
    if (
      f.certifications?.length &&
      !f.certifications.some((c) =>
        it.certifications?.some((ic) => ic.toLowerCase().includes(c.toLowerCase())),
      )
    )
      return false;
    if (
      f.countries?.length &&
      !f.countries.some((c) => it.country?.toLowerCase().includes(c.toLowerCase()))
    )
      return false;
    if (f.tiers?.length && !f.tiers.some((t) => it.actorType?.toLowerCase() === t.toLowerCase()))
      return false;
    if (
      f.productCategories?.length &&
      it.productCategories &&
      !f.productCategories.some((c) =>
        it.productCategories?.some((ic) => ic.toLowerCase() === c.toLowerCase()),
      )
    )
      return false;
    if (f.maxLeadTimeDays != null && (it.leadTimeDays ?? 0) > f.maxLeadTimeDays) return false;
    if (f.minOnTimeRate != null && (it.onTimeRate ?? 0) < f.minOnTimeRate) return false;
    return true;
  });
}
