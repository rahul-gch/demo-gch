import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/showroom/ProductCard";
import { useShowroomProducts } from "@/lib/use-showroom";
import { useActingOrgId } from "@/lib/use-comms";
import type { Entity } from "@/seed/types";
import { ArrowLeft, Filter, Lock, Package, Search } from "lucide-react";

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

  const materials = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.materials?.forEach((m) => set.add(m)));
    return Array.from(set).sort();
  }, [products]);

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

  const goOrder = (productId: string) =>
    navigate({
      to: "/directory/$id/showroom/$productId/order",
      params: { id: entity.id, productId },
    });

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5 text-muted-foreground">
        <Link to="/directory/$id" params={{ id: entity.id }}>
          <ArrowLeft className="h-4 w-4" /> Back to {entity.name}
        </Link>
      </Button>

      <header className="border-b pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {entity.name}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Fabric Showroom</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
          Explore our collection of fabrics and request physical samples.
        </p>
      </header>

      {!isConnected && products.length > 0 && (
        <Card className="flex flex-col gap-3 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Connect with {entity.name} to request samples
              </h2>
              <p className="mt-0.5 text-xs text-amber-800/80 dark:text-amber-300/80">
                You can browse the catalogue now; sample requests unlock once you are connected.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="shrink-0">
            <Link to="/directory/$id" params={{ id: entity.id }}>
              Send connection request
            </Link>
          </Button>
        </Card>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search products, materials, descriptions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-card pl-9"
        />
      </div>

      {materials.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Filter className="h-3 w-3" /> Material:
          </span>
          <Badge
            variant={material === null ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setMaterial(null)}
          >
            All
          </Badge>
          {materials.map((m) => (
            <Badge
              key={m}
              variant={material === m ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setMaterial(material === m ? null : m)}
            >
              {m}
            </Badge>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="h-80 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed p-12 text-center">
          <Package className="mb-3 h-12 w-12 text-muted-foreground/50" />
          <CardTitle className="text-lg font-medium">No products found</CardTitle>
          <CardDescription className="mt-1 max-w-sm">
            {products.length === 0
              ? "This organization has not published any products yet."
              : "Nothing matched your search or material filter."}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}
