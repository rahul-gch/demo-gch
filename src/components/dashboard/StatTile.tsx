import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  icon?: LucideIcon;
  className?: string;
}

/**
 * Single source of truth for a compact metric tile so numbers, labels and
 * units align identically everywhere on the dashboard.
 */
export function StatTile({ label, value, unit, hint, icon: Icon, className }: StatTileProps) {
  return (
    <Card className={cn("shadow-sm", className)}>
      <CardContent className="flex h-full flex-col justify-between gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <span className="min-h-[2rem] text-[10px] font-semibold uppercase leading-4 tracking-wider text-muted-foreground">
            {label}
          </span>
          {Icon && <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />}
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold leading-none tabular-nums">{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>
        <div className="min-h-[1rem] text-[11px] leading-4 text-muted-foreground">{hint ?? ""}</div>
      </CardContent>
    </Card>
  );
}

export function StatTileGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("grid grid-cols-2 gap-3", className)}>{children}</div>;
}
