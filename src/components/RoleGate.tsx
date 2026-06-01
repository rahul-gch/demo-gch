import type { ReactNode } from "react";

export type OrgRole = "owner" | "admin" | "editor" | "viewer" | null;

const LEVELS: Record<Exclude<OrgRole, null>, number> = {
  owner: 4, admin: 3, editor: 2, viewer: 1,
};

export function canAtLeast(role: OrgRole, need: "manage" | "edit" | "view" | "owner"): boolean {
  if (!role) return false;
  const have = LEVELS[role];
  if (need === "owner")  return have >= LEVELS.owner;
  if (need === "manage") return have >= LEVELS.admin;
  if (need === "edit")   return have >= LEVELS.editor;
  return have >= LEVELS.viewer;
}

export function RoleGate({
  role, need, children, fallback = null,
}: {
  role: OrgRole;
  need: "manage" | "edit" | "view" | "owner";
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return canAtLeast(role, need) ? <>{children}</> : <>{fallback}</>;
}

export function RoleBadge({ role }: { role: OrgRole }) {
  if (!role) return null;
  const tone = role === "owner" ? "bg-rose-50 text-rose-700 border-rose-200"
    : role === "admin" ? "bg-amber-50 text-amber-700 border-amber-200"
    : role === "editor" ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${tone}`}>
      {role}
    </span>
  );
}
