import { cn } from "@/lib/utils";

const SIZES = {
  sm: {
    letter: "text-lg",
    tagline: "text-[8px]",
    gap: "ml-2 pl-2",
  },
  md: {
    letter: "text-[26px]",
    tagline: "text-[10px]",
    gap: "ml-2 pl-2 sm:ml-3 sm:pl-3",
  },
} as const;

/**
 * GCH wordmark: bold "GCH" with an amber C, followed by a divider and
 * "GLOBAL CHAIN HUB" in small tracked uppercase — matches the brand header.
 * Use `invert` on dark surfaces (e.g. the primary brand panel).
 * Use `size="sm"` for compact placements such as workspace top bars.
 */
export function GchLogo({
  invert = false,
  size = "md",
  className,
}: {
  invert?: boolean;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span aria-label="GCH — Global Chain Hub" className={cn("inline-flex max-w-full items-center whitespace-nowrap", className)}>
      <span
        className={cn(
          "font-bold leading-none tracking-normal",
          s.letter,
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        G
      </span>
      <span className={cn("font-bold leading-none tracking-normal text-brand", s.letter)}>
        C
      </span>
      <span
        className={cn(
          "font-bold leading-none tracking-normal",
          s.letter,
          invert ? "text-primary-foreground" : "text-foreground",
        )}
      >
        H
      </span>
      <span
        className={cn(
          "border-l font-medium uppercase leading-none tracking-normal",
          s.gap,
          s.tagline,
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
