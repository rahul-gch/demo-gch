import type { Entity } from "@/seed/types";
import { cn } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

// Deterministic online status derived from entity id so it doesn't flicker.
export function isOnline(id: string): boolean {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return (Math.abs(h) % 3) !== 0; // ~66% online
}

export function initialsOf(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

export function OrgAvatar({
  entity,
  size = 40,
  showStatus = true,
  className,
}: {
  entity: Pick<Entity, "id" | "name" | "verificationStatus">;
  size?: number;
  showStatus?: boolean;
  className?: string;
}) {
  const online = isOnline(entity.id);
  const verified = entity.verificationStatus === "Verified";
  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div
        className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary/90 to-primary text-primary-foreground shadow-sm"
        style={{ fontSize: Math.max(11, Math.round(size * 0.36)) }}
      >
        <span className="font-medium">{initialsOf(entity.name)}</span>
      </div>
      {verified && (
        <span className="absolute -right-0.5 -top-0.5 rounded-full bg-background p-[1px] shadow-sm">
          <BadgeCheck className="h-3.5 w-3.5 text-primary" />
        </span>
      )}
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-background",
            online ? "bg-emerald-500" : "bg-muted-foreground/40",
          )}
        />
      )}
    </div>
  );
}

export function StatusText({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isOnline(id) ? "bg-emerald-500" : "bg-muted-foreground/40",
        )}
      />
      {isOnline(id) ? "Online" : "Offline"}
    </span>
  );
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  if (same(d, yest)) return "Yesterday";
  return d.toLocaleDateString(undefined, { month: "long", day: "numeric" });
}
