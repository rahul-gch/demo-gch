import { cn } from "@/lib/utils";

/**
 * GCH wordmark: bold "GCH" with an amber C, followed by a divider and
 * "GLOBAL CHAIN HUB" in small tracked uppercase — matches the brand header.
 * Use `invert` on dark surfaces (e.g. the primary brand panel).
 */
export function GchLogo({
  invert = false,
  className,
}: {
  invert?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <span
        className={cn(
          "text-[26px] font-bold leading-none tracking-[-0.03em]",
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        G
      </span>
      <span className="text-[26px] font-bold leading-none tracking-[-0.03em] text-brand">
        C
      </span>
      <span
        className={cn(
          "text-[26px] font-bold leading-none tracking-[-0.03em]",
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        H
      </span>
      <span
        className={cn(
          "ml-3 border-l pl-3 text-[10px] font-medium uppercase leading-none tracking-[0.25em]",
          invert
            ? "border-primary-foreground/20 text-primary-foreground/60"
            : "border-border text-muted-foreground",
        )}
      >
        Global Chain Hub
      </span>
    </span>
  );
}
