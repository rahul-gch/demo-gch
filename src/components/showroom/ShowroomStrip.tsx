import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useShowroomProducts } from "@/lib/use-showroom";
import { useActingOrgId } from "@/lib/use-comms";
import type { Entity } from "@/seed/types";
import { isManufacturerOrg } from "@/lib/org-types";
import { Package, Plus, Store, ArrowRight } from "lucide-react";

/**
 * Compact product row shown on a manufacturer's dashboard overview and public
 * profile. Full management stays on the Showroom page.
 */
export function ShowroomStrip({ entity }: { entity: Entity }) {
  const myOrgId = useActingOrgId(null);
  const targetOrgUuid = entity.orgUuid ?? entity.id;
  const { data, isLoading } = useShowroomProducts(targetOrgUuid, myOrgId);

  if (!isManufacturerOrg(entity)) return null;

  const products = (data?.products ?? []).slice(0, 6);
  const canManage = data?.canManage ?? false;

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Store className="h-4 w-4 text-slate-500" /> Showroom
          {products.length > 0 && (
            <Badge variant="outline" className="text-[10px]">
              {products.length}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button size="sm" variant="outline" className="h-8 text-xs" asChild>
              <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
                <Plus className="mr-1 h-3 w-3" /> Add product
              </Link>
            </Button>
          )}
          <Button size="sm" variant="ghost" className="h-8 text-xs" asChild>
            <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
              Open <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Package className="mx-auto h-8 w-8 stroke-[1.25] text-slate-300" />
            <p className="mt-2 text-sm text-muted-foreground">
              No sample products published yet.
            </p>
            {canManage && (
              <Button size="sm" className="mt-3 h-8 text-xs" asChild>
                <Link to="/organizations/$id/showroom" params={{ id: entity.id }}>
                  Add your first product
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <Link
                key={p.id}
                to="/organizations/$id/showroom/$productId"
                params={{ id: entity.id, productId: p.id }}
                className="group flex gap-3 rounded-lg border bg-card p-3 transition-colors hover:bg-slate-50"
              >
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-slate-100">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Package className="h-5 w-5 text-slate-300" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium leading-5 text-slate-800">
                    {p.name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(p.materials ?? []).slice(0, 2).map((m) => (
                      <Badge key={m} variant="secondary" className="text-[10px] font-normal">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
