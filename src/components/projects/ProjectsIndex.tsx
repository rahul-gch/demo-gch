import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Plus,
  Search,
  Users,
  Inbox,
  CalendarDays,
  Eye,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Entity } from "@/seed/types";
import type { Project } from "@/lib/projects-types";
import { useProjects, createProject } from "@/lib/use-projects";
import { ProjectStatusBadge } from "./ProjectShell";
import { useOrgRole } from "@/lib/use-org-role";
import { DeleteProjectDialog } from "./ProjectActions";

export function ProjectsIndex({ entity }: { entity: Entity }) {
  const projects = useProjects(entity);
  const { canEdit, canManage } = useOrgRole(entity.orgUuid ?? entity.id);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Project | null>(null);
  const [form, setForm] = useState({ name: "", description: "", tags: "" });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.tags.some((t) => t.toLowerCase().includes(s)),
    );
  }, [projects, q]);

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cross-organization collaboration workspaces. Every project is a shared, permissioned hub
            for requests, documents, discussions and meetings.
          </p>
        </div>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a project</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Project name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Regenerative Cotton Program"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Shared goals, scope, and target outcomes..."
                    rows={3}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="e.g. Circularity, Tier 1, Q3-2026"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  disabled={!form.name.trim()}
                  onClick={() => {
                    createProject(entity, {
                      name: form.name.trim(),
                      description: form.description.trim(),
                      tags: form.tags
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    });
                    setForm({ name: "", description: "", tags: "" });
                    setOpen(false);
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </header>

      {!canEdit && (
        <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
          <Eye className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            You have viewer access in <strong>{entity.name}</strong>. You can browse active projects and details, but project creation is reserved for Editors and Admins.
          </span>
        </div>
      )}

      {projects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search projects..."
            className="pl-9"
          />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to="/organizations/$id/projects/$projectId"
            params={{ id: entity.slug || entity.id, projectId: p.id }}
            className="group block"
          >
            <Card className="h-full transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Owner: {p.ownerOrgId === entity.id ? "You" : p.ownerOrgId}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <ProjectStatusBadge status={p.status} />
                    {canManage && p.ownerOrgId === entity.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            aria-label={`More actions for ${p.name}`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setDeleting(p);
                            }}
                          >
                            <Trash2 className="h-4 w-4" /> Delete project
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {p.description || "No description provided."}
                </p>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {p.partners.length} partner
                    {p.partners.length === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Inbox className="h-3.5 w-3.5" /> {p.requests.filter((r) => r.status === "Open").length} open
                  </span>
                  {p.meetings.length > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5" /> {p.meetings[0].date}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {p.tags.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <Card>
          <CardContent className="space-y-3 p-10 text-center">
            {projects.length === 0 ? (
              <>
                <div className="text-sm font-medium">No projects yet</div>
                <p className="mx-auto max-w-md text-sm text-muted-foreground">
                  {canEdit
                    ? "Create a project to start a shared workspace with your partners — requests, documents, discussions and meetings all live inside it."
                    : "No projects have been created in this organization yet."}
                </p>
                {canEdit && (
                  <Button onClick={() => setOpen(true)}>
                    <Plus className="h-4 w-4" /> New project
                  </Button>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No projects match “{q}”.</p>
            )}
          </CardContent>
        </Card>
      )}

      {deleting && (
        <DeleteProjectDialog
          entity={entity}
          project={deleting}
          open={!!deleting}
          onOpenChange={(o) => {
            if (!o) setDeleting(null);
          }}
        />
      )}
    </div>
  );
}
