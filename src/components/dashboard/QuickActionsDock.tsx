import type { Entity } from "@/seed/types";
import { Link } from "@tanstack/react-router";
import { FolderKanban, Handshake, Upload, Network, UserPlus, FileText, Plus } from "lucide-react";
import { useState } from "react";

const ACTIONS = [
  { icon: FolderKanban, label: "Create project", to: "/organizations/$id/projects" },
  { icon: Handshake, label: "Find partner", to: "/organizations/$id/matchmaking" },
  { icon: Upload, label: "Upload certificate", to: "/organizations/$id/compliance" },
  { icon: Network, label: "Map supply chain", to: "/organizations/$id/supply-chain" },
  { icon: UserPlus, label: "Invite member", to: "/organizations/$id/settings" },
  { icon: FileText, label: "Generate report", to: "/organizations/$id" },
] as const;

export function QuickActionsDock({ entity }: { entity: Entity }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {open &&
        ACTIONS.map((a) => (
          <Link
            key={a.label}
            to={a.to}
            params={{ id: entity.id }}
            className="group flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-xs font-medium shadow-md hover:bg-accent"
          >
            <a.icon className="h-3.5 w-3.5" />
            <span>{a.label}</span>
          </Link>
        ))}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg transition hover:bg-slate-800"
        aria-label="Quick actions"
      >
        <Plus className={`h-5 w-5 transition-transform ${open ? "rotate-45" : ""}`} />
      </button>
    </div>
  );
}
