import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Minus, Plus, AlertCircle } from "lucide-react";

export interface SampleOptionSelectorProps {
  hangerQty: number; // 0 or 1
  metersQty: number; // 0, 1, 2, or 3
  onChange: (config: { hangerQty: number; metersQty: number }) => void;
  className?: string;
}

export function SampleOptionSelector({
  hangerQty,
  metersQty,
  onChange,
  className,
}: SampleOptionSelectorProps) {
  const isSelected = hangerQty > 0 || metersQty > 0;

  const updateMeters = (delta: number) => {
    const next = Math.max(0, Math.min(3, metersQty + delta));
    onChange({ hangerQty, metersQty: next });
  };

  const updateHangers = (delta: number) => {
    const next = Math.max(0, Math.min(1, hangerQty + delta));
    onChange({ hangerQty: next, metersQty });
  };

  return (
    <div className={cn("w-full space-y-3", className)}>
      <div className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
        Select options
      </div>

      <Card className="divide-y border bg-card shadow-xs overflow-hidden">
        {/* ROW 1: METERS */}
        <div className="flex items-center justify-between p-4 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              METERS
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">max 3</div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              disabled={metersQty <= 0}
              onClick={() => updateMeters(-1)}
              aria-label="Decrease meters"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <span className="w-6 text-center font-semibold text-base text-foreground tabular-nums select-none">
              {metersQty}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              disabled={metersQty >= 3}
              onClick={() => updateMeters(1)}
              aria-label="Increase meters"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* ROW 2: HANGERS */}
        <div className="flex items-center justify-between p-4 gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-foreground">
              HANGERS
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">max 1</div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              disabled={hangerQty <= 0}
              onClick={() => updateHangers(-1)}
              aria-label="Decrease hangers"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>

            <span className="w-6 text-center font-semibold text-base text-foreground tabular-nums select-none">
              {hangerQty}
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full border-muted-foreground/30 text-muted-foreground hover:text-foreground"
              disabled={hangerQty >= 1}
              onClick={() => updateHangers(1)}
              aria-label="Increase hangers"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </Card>

      {!isSelected && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 font-medium pt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Please select at least 1 hanger or meters to continue</span>
        </div>
      )}
    </div>
  );
}
