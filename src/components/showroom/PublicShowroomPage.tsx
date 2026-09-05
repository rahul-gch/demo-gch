import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardDescription, CardTitle, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/showroom/ProductCard";
import { useShowroomProducts } from "@/lib/use-showroom";
import { useActingOrgId } from "@/lib/use-comms";
import type { Entity } from "@/seed/types";
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Filter,
  Package,
  RotateCcw,
  Search,
  Tag,
  Scissors,
  X,
} from "lucide-react";
import { ShowroomLocked } from "@/components/showroom/ShowroomLocked";
import { SampleCartDrawer } from "@/components/showroom/SampleCartDrawer";
import { cn } from "@/lib/utils";

/** Read-only showroom of another organization, reached from its network profile. */
export function PublicShowroomPage({ entity }: { entity: Entity }) {
  const navigate = useNavigate();
  const myOrgId = useActingOrgId(null);
  const targetOrgUuid = entity.orgUuid ?? entity.id;
  const { data, isLoading } = useShowroomProducts(targetOrgUuid, myOrgId);
  const [search, setSearch] = useState("");
  const [material, setMaterial] = useState<string | null>(null);

  const products = data?.products ?? [];
  const isConnected = data?.isConnected ?? false;
  const locked = !isLoading && (data?.locked ?? false);

  const materialCounts = useMemo(() => {
    const counts = new Map<string, number>();
    products.forEach((p) => {
      p.materials?.forEach((m) => {
        counts.set(m, (counts.get(m) ?? 0) + 1);
      });
    });
    return counts;
  }, [products]);

  const materials = useMemo(() => {
    return Array.from(materialCounts.keys()).sort();
  }, [materialCounts]);

  const filtered = useMemo(
    () =>
      products.filter((p) => {
        const q = search.toLowerCase();
        const matches =
          !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
        return matches && (!material || p.materials?.includes(material));
      }),
    [products, search, material],
  );

  const hasActiveFilters = Boolean(search.trim() || material);

  const clearFilters = () => {
    setSearch("");
    setMaterial(null);
  };

  const goOrder = (productId: string) =>
    navigate({
      to: "/directory/$id/showroom/$productId/order",
      params: { id: entity.id, productId },
    });

  return (
    <div className="mx-auto w-full max-w-[1720px] space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Bar Navigation & Mill Identity */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
            <Link to="/directory/$id" params={{ id: entity.id }}>
              <ArrowLeft className="h-4 w-4" /> Back to {entity.name}
            </Link>
          </Button>
          <span className="hidden sm:inline text-muted-foreground/40">•</span>
          <span className="hidden sm:inline text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            {entity.name} B2B Showroom
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs gap-1 py-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Connected Partner
            </Badge>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => navigate({ to: "/directory/$id", params: { id: entity.id } })}
            >
              Connect to Order
            </Button>
          )}
          <Badge variant="secondary" className="text-xs py-1">
            {products.length} Fabrics Available
          </Badge>
        </div>
      </div>

      {locked ? (
        <ShowroomLocked entity={entity} />
      ) : (
        /* Widescreen 2-Column Layout: Filter & Specs Sidebar + Fluid Fabric Catalog Grid */
        <div className="grid grid-cols-1 lg:grid-cols-[290px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start">
          {/* LEFT SIDEBAR: Mill Overview & Filter Controls */}
          <aside className="space-y-6 lg:sticky lg:top-6 order-2 lg:order-1">
            {/* Search Box */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search fabrics, codes, compositions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-card pl-9 pr-8"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Mill Overview & Sample Policy Card */}
            <Card className="bg-card/70 border-border/80 shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-primary">
                  <Building2 className="h-4 w-4" />
                  <CardTitle className="text-sm font-semibold">{entity.name}</CardTitle>
                </div>
                <CardDescription className="text-xs">
                  Physical fabric sample dispatch directly from mill facility.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between rounded-md bg-muted/40 p-2.5 border">
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">Hangers</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Max 1 pc</span>
                </div>

                <div className="flex items-center justify-between rounded-md bg-muted/40 p-2.5 border">
                  <div className="flex items-center gap-2">
                    <Scissors className="h-4 w-4 text-primary shrink-0" />
                    <span className="font-medium text-foreground">Meters</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-semibold">Max 3m</span>
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Dispatch time:</span>
                  <span className="font-semibold text-foreground">2–3 business days</span>
                </div>
              </CardContent>
            </Card>

            {/* Material & Composition Filter Section */}
            {materials.length > 0 && (
              <Card className="bg-card/70 border-border/80 shadow-none">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <Filter className="h-3.5 w-3.5" /> Compositions ({materials.length})
                  </div>
                  {material !== null && (
                    <button
                      onClick={() => setMaterial(null)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </CardHeader>
                <CardContent className="space-y-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setMaterial(null)}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors text-left",
                      material === null
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span>All Compositions</span>
                    <span
                      className={cn(
                        "text-[10px] rounded px-1.5 py-0.5 font-mono",
                        material === null ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted",
                      )}
                    >
                      {products.length}
                    </span>
                  </button>

                  <div className="max-h-[380px] overflow-y-auto space-y-1 pr-1">
                    {materials.map((m) => {
                      const count = materialCounts.get(m) ?? 0;
                      const isSelected = material === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMaterial(isSelected ? null : m)}
                          className={cn(
                            "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors text-left",
                            isSelected
                              ? "bg-primary text-primary-foreground font-semibold"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <span className="truncate mr-2">{m}</span>
                          <span
                            className={cn(
                              "text-[10px] rounded px-1.5 py-0.5 font-mono shrink-0",
                              isSelected
                                ? "bg-primary-foreground/20 text-primary-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="w-full text-xs gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear All Filters
              </Button>
            )}
          </aside>

          {/* RIGHT MAIN AREA: Header & Multi-Column Fabric Grid */}
          <main className="space-y-6 order-1 lg:order-2">
            {/* Title & Filter Badges Bar */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
                  Fabric Showroom
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Browse available fabrics, view compositions, and assemble your sample package.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Showing <strong className="text-foreground">{filtered.length}</strong> of{" "}
                  {products.length} fabrics
                </span>
              </div>
            </div>

            {/* Active Filter Pills Bar */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2 bg-muted/30 p-2.5 rounded-lg border text-xs">
                <span className="text-muted-foreground font-medium">Active filters:</span>
                {search && (
                  <Badge variant="secondary" className="gap-1 pr-1.5 font-normal">
                    Search: "{search}"
                    <button
                      onClick={() => setSearch("")}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {material && (
                  <Badge variant="secondary" className="gap-1 pr-1.5 font-normal">
                    Composition: {material}
                    <button
                      onClick={() => setMaterial(null)}
                      className="ml-1 rounded-full hover:bg-muted p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline ml-auto"
                >
                  Reset all
                </button>
              </div>
            )}

            {/* Loading Skeleton */}
            {isLoading ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Card key={n} className="h-80 animate-pulse bg-muted/40" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
                <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
                <CardTitle className="text-lg font-medium">No fabrics found</CardTitle>
                <CardDescription className="mt-1 max-w-sm">
                  {products.length === 0
                    ? "This organization has not published any fabrics to their showroom yet."
                    : "No fabrics matched your current search or composition filters."}
                </CardDescription>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" /> Clear Filters
                  </Button>
                )}
              </Card>
            ) : (
              /* High-Density Fluid Product Grid */
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filtered.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    orgRouteId={entity.id}
                    detailBase="directory"
                    isOwner={false}
                    canManage={false}
                    isConnected={isConnected}
                    onOrderSample={(prod) => goOrder(prod.id)}
                    onConnect={() => navigate({ to: "/directory/$id", params: { id: entity.id } })}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* Floating / Expandable Sample Cart Drawer */}
      <SampleCartDrawer sellerEntity={entity} canOrder={isConnected} />
    </div>
  );
}
