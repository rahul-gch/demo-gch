import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Search, ArrowRight, Users, Inbox, CalendarDays } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Entity } from "@/seed/types";
import { useProjects, createProject } from "@/lib/use-projects";
import { ProjectStatusBadge } from "./ProjectShell";

export function ProjectsIndex({ entity }: { entity: Entity }) {
  const projects = useProjects(entity);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
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
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="What are you collaborating on?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="DPP, Traceability"
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
      </header>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects, tags, description…"
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => (
          <Link
            key={p.id}
            to="/organizations/$id/projects/$projectId"
            params={{ id: entity.id, projectId: p.id }}
            className="group"
          >
            <Card className="overflow-hidden transition-shadow group-hover:shadow-md">
              {p.image ? (
                <div
                  className="h-32 w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${p.image})` }}
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500">
                  <span className="px-4 text-center text-sm font-medium text-white/90 line-clamp-2">
                    {p.name}
                  </span>
                </div>
              )}

              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="line-clamp-1 font-medium">{p.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {p.industry} · {p.country}
                    </div>
                  </div>
                  <ProjectStatusBadge status={p.status} />
                </div>
                <p className="line-clamp-2 text-sm text-muted-foreground">{p.description}</p>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Progress</span>
                    <span>{p.progress}%</span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>
                <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {p.partners.length}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Inbox className="h-3.5 w-3.5" />
                    {p.requests.filter((r) => r.status !== "Completed").length} open
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> {p.meetings.length}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.tags.map((t) => (
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
                  Create a project to start a shared workspace with your partners — requests,
                  documents, discussions and meetings all live inside it.
                </p>
                <Button onClick={() => setOpen(true)}>
                  <Plus className="h-4 w-4" /> New project
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No projects match “{q}”.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
