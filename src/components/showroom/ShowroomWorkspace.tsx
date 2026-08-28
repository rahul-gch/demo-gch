import { useState, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import type { ShowroomProduct, SampleOrderStatus } from "@/lib/showroom.functions";
import type { Entity } from "@/seed/types";
import {
  Store,
  Package,
  Plus,
  Search,
  Lock,
  MessageSquare,
  Sparkles,
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

  const { data: ordersData, isLoading: ordersLoading } = useSampleOrders(targetOrgUuid);
  const createOrderMutation = useCreateSampleOrder(myOrgId);
  const updateOrderMutation = useUpdateSampleOrderStatus(targetOrgUuid);

  const isOwner = showroom?.isOwner ?? false;
  const canManage = showroom?.canManage ?? false;
  const isConnected = showroom?.isConnected ?? false;
  const products = showroom?.products ?? [];

  // Extract all unique materials for filtering
  const allMaterials = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      for (const m of p.materials) {
        if (m) set.add(m);
      }
    }
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesMaterial = !selectedMaterial || p.materials.includes(selectedMaterial);

      return matchesSearch && matchesMaterial;
    });
  }, [products, searchQuery, selectedMaterial]);

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Product Showroom
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            B2B material catalog, sample requests, and spec sheets for {entity.name}.
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
              variant="default"
              className="shrink-0 bg-amber-700 hover:bg-amber-800 text-white"
            >
              <Link to="/messages">
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                Send Message
              </Link>
            </Button>
          </div>
        </Card>
      )}

      {/* Main Tabs (Products vs Sample Orders) */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-96">
          <TabsTrigger value="products" className="gap-2">
            <Boxes className="h-4 w-4" />
            Products & Materials ({products.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <Inbox className="h-4 w-4" />
            Sample Orders
            {(ordersData?.pendingCount ?? 0) > 0 && (
              <Badge className="h-5 min-w-5 justify-center px-1 text-[10px] bg-amber-600">
                {ordersData?.pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* TAB: PRODUCTS */}
        <TabsContent value="products" className="space-y-4">
          {/* Search & Material Filters */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search materials, weaves, specs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Materials Pills */}
            {allMaterials.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant={selectedMaterial === null ? "default" : "outline"}
                  className="cursor-pointer text-[11px]"
                  onClick={() => setSelectedMaterial(null)}
                >
                  All ({products.length})
                </Badge>
                {allMaterials.map((mat) => (
                  <Badge
                    key={mat}
                    variant={selectedMaterial === mat ? "default" : "outline"}
                    className="cursor-pointer text-[11px]"
                    onClick={() => setSelectedMaterial(selectedMaterial === mat ? null : mat)}
                  >
                    {mat}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Product Grid */}
          {productsLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-72 animate-pulse bg-slate-100 dark:bg-slate-800" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <Card className="border-dashed p-12 text-center text-muted-foreground">
              <Package className="mx-auto h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">
                {products.length === 0 ? "Showroom is empty" : "No matching products found"}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                {products.length === 0
                  ? canManage
                    ? "Add your first product or raw material to showcase your capabilities to brands and manufacturers."
                    : "This organization has not added any products to their showroom yet."
                  : "Try clearing your search query or material filter to see more products."}
              </p>

              {canManage && products.length === 0 && (
                <Button
                  onClick={() => {
                    setEditingProduct(null);
                    setEditorOpen(true);
                  }}
                  className="mt-4 gap-2 font-medium"
                >
                  <Plus className="h-4 w-4" />
                  Add First Product
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  isOwner={isOwner}
                  canManage={canManage}
                  isConnected={isConnected}
                  onEdit={(prod) => {
                    setEditingProduct(prod);
                    setEditorOpen(true);
                  }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onOrderSample={(prod) => setOrderModalProduct(prod)}
                  onConnect={() => {
                    // Navigate to messages
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* TAB: SAMPLE ORDERS */}
        <TabsContent value="orders">
          <SampleOrdersPanel
            inbound={ordersData?.inbound ?? []}
            outbound={ordersData?.outbound ?? []}
            orgId={targetOrgUuid}
            onUpdateStatus={async (orderId, status, message) => {
              await updateOrderMutation.mutateAsync({ orderId, status, message });
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Product Editor Modal */}
      <ProductEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        product={editingProduct}
        orgId={targetOrgUuid}
        onSave={async (prod) => {
          await upsertMutation.mutateAsync(prod);
        }}
      />

      {/* Sample Order Modal */}
      <SampleOrderDialog
        open={Boolean(orderModalProduct)}
        onOpenChange={(open) => !open && setOrderModalProduct(null)}
        product={orderModalProduct}
        sellerOrgId={targetOrgUuid}
        sellerName={entity.name}
        onSubmit={async (data) => {
          await createOrderMutation.mutateAsync(data);
        }}
      />
    </div>
  );
}
