import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/showroom/ProductCard";
import { ProductEditorDialog } from "@/components/showroom/ProductEditorDialog";
import { SampleOrderDialog } from "@/components/showroom/SampleOrderDialog";
import { SampleOrdersPanel } from "@/components/showroom/SampleOrdersPanel";
import {
  useShowroomProducts,
  useUpsertShowroomProduct,
  useDeleteShowroomProduct,
  useSampleOrders,
  useCreateSampleOrder,
  useUpdateSampleOrderStatus,
} from "@/lib/use-showroom";
import { useActingOrgId } from "@/lib/use-comms";
import { isOrgsConnected } from "@/lib/org-connections";
import type { ShowroomProduct, SampleOrderStatus } from "@/lib/showroom.functions";
import type { Entity } from "@/seed/types";
import {
  Store,
  Package,
  Plus,
  Search,
  Lock,
  Inbox,
  Filter,
  ArrowRight,
  Boxes,
} from "lucide-react";

interface ShowroomWorkspaceProps {
  entity: Entity;
  defaultTab?: "products" | "orders";
}

export function ShowroomWorkspace({ entity, defaultTab = "products" }: ShowroomWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  // Dialogs state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ShowroomProduct | null>(null);
  const [orderModalProduct, setOrderModalProduct] = useState<ShowroomProduct | null>(null);

  const myOrgId = useActingOrgId(null);
  const targetOrgUuid = entity.orgUuid ?? entity.id;

  // React Query hooks
  const { data: showroom, isLoading: productsLoading } = useShowroomProducts(
    targetOrgUuid,
    myOrgId,
  );
  const upsertMutation = useUpsertShowroomProduct(targetOrgUuid);
  const deleteMutation = useDeleteShowroomProduct(targetOrgUuid);

  const isOwner = showroom?.isOwner ?? false;
  const canManage = showroom?.canManage ?? false;
  const isConnected =
    (showroom?.isConnected ?? false) ||
    (myOrgId ? isOrgsConnected(myOrgId, targetOrgUuid) : false);
  const products = showroom?.products ?? [];

  // Extract all unique materials for filtering
  const allMaterials = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      p.materials?.forEach((m) => set.add(m));
    });
    return Array.from(set).sort();
  }, [products]);

  // Filter products by search and material tag
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMaterial =
        !selectedMaterial || (p.materials && p.materials.includes(selectedMaterial));

      return matchesSearch && matchesMaterial;
    });
  }, [products, searchQuery, selectedMaterial]);

  const { data: ordersData, isLoading: ordersLoading } = useSampleOrders(targetOrgUuid);
  const orders = ordersData
    ? isOwner
      ? ordersData.inbound
      : ordersData.outbound
    : [];

  const createOrderMutation = useCreateSampleOrder(myOrgId);
  const updateStatusMutation = useUpdateSampleOrderStatus(targetOrgUuid);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Product Showroom</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Browse fabric specs, materials, and request physical sample swatches directly from{" "}
            <span className="font-semibold text-foreground">{entity.name}</span>.
          </p>
        </div>

        {canManage && (
          <Button
            onClick={() => {
              setEditingProduct(null);
              setEditorOpen(true);
            }}
            className="gap-2 shadow-sm font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Product to Showroom
          </Button>
        )}
      </div>

      {/* Non-connected Visitor Notification Banner */}
      {!isOwner && !isConnected && (
        <Card className="border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Connect with {entity.name} to order samples
                </h4>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
                  Sample ordering is reserved for verified supply chain partners. Start a
                  conversation or partner on a project to unlock sample ordering.
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="border-amber-300 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-200 shrink-0"
            >
              <Link to="/organizations/$id/matchmaking" params={{ id: entity.id }}>
                Connect Partner <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Workspace Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="products" className="gap-2">
            <Boxes className="h-4 w-4" />
            Products ({products.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Inbox className="h-4 w-4" />
            Sample Orders ({orders.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Products Catalogue */}
        <TabsContent value="products" className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by title, materials, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>
          </div>

          {/* Material Tag Filters */}
          {allMaterials.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Material:
              </span>
              <Badge
                variant={selectedMaterial === null ? "default" : "outline"}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedMaterial(null)}
              >
                All Materials
              </Badge>
              {allMaterials.map((mat) => (
                <Badge
                  key={mat}
                  variant={selectedMaterial === mat ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() =>
                    setSelectedMaterial(selectedMaterial === mat ? null : mat)
                  }
                >
                  {mat}
                </Badge>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {productsLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="h-80 animate-pulse bg-muted/40" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <CardTitle className="text-lg font-medium">No Products Found</CardTitle>
              <CardDescription className="max-w-sm mt-1">
                {products.length === 0
                  ? "This showroom doesn't have any products listed yet."
                  : "No products matched your current search and material filter criteria."}
              </CardDescription>
              {canManage && products.length === 0 && (
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditorOpen(true);
                  }}
                  className="mt-4 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add First Product
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  isOwner={isOwner}
                  canManage={canManage}
                  isConnected={isConnected}
                  onEdit={() => {
                    setEditingProduct(prod);
                    setEditorOpen(true);
                  }}
                  onDelete={() => deleteMutation.mutate(prod.id)}
                  onOrderSample={() => setOrderModalProduct(prod)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Sample Orders Management */}
        <TabsContent value="orders" className="space-y-6">
          <SampleOrdersPanel
            inbound={ordersData?.inbound ?? []}
            outbound={ordersData?.outbound ?? []}
            orgId={targetOrgUuid}
            onUpdateStatus={async (orderId, status, message) => {
              await updateStatusMutation.mutateAsync({
                orderId,
                status,
                message,
              });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Product Create/Edit Dialog */}
      {canManage && (
        <ProductEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          product={editingProduct}
          orgId={targetOrgUuid}
          onSave={async (prodData) => {
            await upsertMutation.mutateAsync(prodData);
            setEditorOpen(false);
          }}
        />
      )}

      {/* Order Sample Dialog */}
      {orderModalProduct && (
        <SampleOrderDialog
          open={!!orderModalProduct}
          onOpenChange={(open) => !open && setOrderModalProduct(null)}
          product={orderModalProduct}
          sellerOrgId={targetOrgUuid}
          sellerName={entity.name}
          onSubmit={async (orderData) => {
            await createOrderMutation.mutateAsync(orderData);
            setOrderModalProduct(null);
          }}
        />
      )}
    </div>
  );
}
