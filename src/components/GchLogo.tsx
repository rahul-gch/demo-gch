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
    <span aria-label="GCH — Global Chain Hub" className={cn("inline-flex max-w-full items-center whitespace-nowrap", className)}>
      <span
        className={cn(
          "text-[26px] font-bold leading-none tracking-normal",
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        G
      </span>
      <span className="text-[26px] font-bold leading-none tracking-normal text-brand">
        C
      </span>
      <span
        className={cn(
          "text-[26px] font-bold leading-none tracking-normal",
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        H
      </span>
      <span
        className={cn(
          "ml-2 border-l pl-2 text-[10px] font-medium uppercase leading-none tracking-normal sm:ml-3 sm:pl-3",
          invert
            ? "border-primary-foreground/20 text-primary-foreground/60"
            : "border-border text-foreground",
        )}
      >
        Global Chain Hub
      </span>
    </span>
  );
}
