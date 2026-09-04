import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import type { Entity } from "@/seed/types";

/**
 * Locked teaser shown when the viewer's organization is not connected to the
 * showroom owner. Products are never fetched in this state.
 */
export function ShowroomLocked({
  entity,
  variant = "page",
  connectAction,
}: {
  entity: Entity;
  /** "page" — full-width block with back link; "card" — compact card for the profile. */
  variant?: "page" | "card";
  /** Optional connect control rendered instead of the profile link. */
  connectAction?: React.ReactNode;
}) {
  const compact = variant === "card";
  return (
    <Card
      className={`flex flex-col items-center justify-center border-dashed text-center ${
        compact ? "p-8" : "p-12"
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Lock className="h-5 w-5 text-muted-foreground" />
      </div>
      <h2 className={`mt-4 font-semibold ${compact ? "text-base" : "text-lg"}`}>
        Showroom available to connected partners
      </h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Products and sample requests from {entity.name} unlock once your organizations are
        connected.
      </p>
      <div className="mt-5">
        {connectAction ?? (
          <Button asChild size="sm">
            <Link to="/directory/$id" params={{ id: entity.id }}>
              Go to profile to connect
            </Link>
          </Button>
        )}
      </div>
    </Card>
  );
}
