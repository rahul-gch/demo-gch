import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutGrid,
  Users,
  Inbox,
  FolderOpen,
  MessageCircle,
  CalendarDays,
  Activity,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Project } from "@/seed/projects";
import type { Entity } from "@/seed/types";

const STATUS_TONE: Record<Project["status"], string> = {
  Planning: "bg-blue-100 text-blue-700 border-blue-200",
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "On Hold": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-slate-100 text-slate-700 border-slate-200",
};

export function ProjectStatusBadge({ status }: { status: Project["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        STATUS_TONE[status],
      )}
    >
      {status}
    </span>
  );
}

export function ProjectShell({
  entity,
  project,
  children,
}: {
  entity: Entity;
  project: Project;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const base = `/organizations/${entity.id}/projects/${project.id}`;

  const items = [
    { label: "Overview", to: base, icon: LayoutGrid, exact: true },
    { label: "Partners", to: `${base}/partners`, icon: Users, count: project.partners.length },
    {
      label: "Requests",
      to: `${base}/requests`,
      icon: Inbox,
      count: project.requests.filter((r) => r.status !== "Completed" && r.status !== "Rejected")
        .length,
    },
    {
      label: "Shared Documents",
      to: `${base}/documents`,
      icon: FolderOpen,
      count: project.documents.length,
    },
    {
      label: "Discussions",
      to: `${base}/discussions`,
      icon: MessageCircle,
      count: project.discussions.length,
    },
    {
      label: "Meetings",
      to: `${base}/meetings`,
      icon: CalendarDays,
      count: project.meetings.length,
    },
    { label: "Activity Timeline", to: `${base}/activity`, icon: Activity },
    { label: "Permissions", to: `${base}/permissions`, icon: ShieldCheck },
  ];

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return pathname === to;
    if (pathname === to) return true;
    // Ensure we only match child paths, not partial string overlaps
    return pathname.startsWith(to + "/");
  };

  return (
    <div className="-mx-6 -my-8 flex min-h-[calc(100vh-3.5rem)]">
      <aside className="hidden w-64 shrink-0 border-r bg-muted/20 md:flex md:flex-col">
        <div className="border-b p-4">
          <Link
            to="/organizations/$id/projects"
            params={{ id: entity.id }}
            className="mb-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All projects
          </Link>
          <div className="line-clamp-2 text-sm font-semibold leading-tight">{project.name}</div>
          <div className="mt-2 flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <span className="text-[11px] text-muted-foreground">
              {project.partners.length} partners
            </span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 p-2">
          {items.map((item) => {
            const active = isActive(item.to, item.exact);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "border-l-2 border-primary bg-primary/5 font-medium text-foreground"
                    : "border-l-2 border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                {!!item.count && item.count > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center px-1 text-[10px]">
                    {item.count}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 px-6 py-6">{children}</div>
    </div>
  );
}
