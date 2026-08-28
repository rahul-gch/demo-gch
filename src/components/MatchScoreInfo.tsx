import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { MATCH_WEIGHTS } from "@/seed/matchmaking";

export function MatchScoreInfo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full border text-muted-foreground hover:bg-muted"
          aria-label="How matches are calculated"
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-xs">
        <div className="mb-2 text-sm font-semibold">How partners are matched</div>
        <p className="mb-3 text-muted-foreground">
          Each pair is scored 0–100 by combining these signals. We use the score to rank partners —
          you don't need to read it directly.
        </p>
        <div className="space-y-2">
          {MATCH_WEIGHTS.map((w) => (
            <div key={w.key}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{w.label}</span>
                <span className="tabular-nums text-muted-foreground">{w.weight}%</span>
              </div>
              <div className="text-muted-foreground">{w.description}</div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
