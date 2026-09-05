import { Card, CardContent } from "@/components/ui/card";
import type { AdminDashboardStats } from "@/lib/admin.functions";

export function GrowthKpis({
  items,
  loading,
}: {
  items: AdminDashboardStats["growth"];
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardContent className="h-24 animate-pulse p-4" />
          </Card>
        ))}
      </section>
    );
  }
  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {items.map((k) => {
        const diff = k.last30 - k.prev30;
        const tone =
          diff > 0 ? "text-emerald-600" : diff < 0 ? "text-red-600" : "text-muted-foreground";
        return (
          <Card key={k.id} className="shadow-sm">
            <CardContent className="p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {k.label}
              </div>
              <div className="mt-1 text-2xl font-semibold tabular-nums">{k.total}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">+{k.last30}</span> last 30 days
                {k.prev30 > 0 || diff !== 0 ? (
                  <span className={`ml-1 font-medium ${tone}`}>
                    ({diff > 0 ? "+" : ""}
                    {diff} vs prior)
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
