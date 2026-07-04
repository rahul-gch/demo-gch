import { useMemo, useState } from "react";
import {
  Plus,
  Upload,
  CalendarPlus,
  UserPlus,
  Inbox,
  Users,
  FolderOpen,
  MessageCircle,
  CalendarDays,
  Activity,
  
  Building2,
  Mail,
  ExternalLink,
  CheckCircle2,
  Clock,
  Circle,
  XCircle,
  Search,
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Entity } from "@/seed/types";
import { ALL_ENTITIES } from "@/seed/all-entities";
import {
  addDiscussion,
  addRequestComment,
  createRequest,
  invitePartner,
  reactDiscussion,
  replyDiscussion,
  scheduleMeeting,
  setPartnerPermission,
  setRequestStatus,
  toggleActionItem,
  uploadDocument,
} from "@/lib/use-projects";
import {
  PERMISSION_LABELS,
  type DocFolder,
  type PermissionKey,
  type Project,
  type ProjectPartner,
  type RequestPriority,
  type RequestStatus,
} from "@/seed/projects";
import { ProjectStatusBadge } from "./ProjectShell";

const FOLDERS: DocFolder[] = [
  "Certificates",
  "Contracts",
  "Design Files",
  "Audit Reports",
  "Images",
  "Videos",
  "Invoices",
  "Reports",
];

const REQ_STATUSES: RequestStatus[] = [
  "Open",
  "In Progress",
  "Waiting for Response",
  "Completed",
  "Rejected",
];

const PRIORITIES: RequestPriority[] = ["Low", "Medium", "High", "Urgent"];

const PRIORITY_TONE: Record<RequestPriority, string> = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-blue-100 text-blue-700",
  High: "bg-amber-100 text-amber-700",
  Urgent: "bg-rose-100 text-rose-700",
};

const STATUS_ICON: Record<RequestStatus, typeof Circle> = {
  Open: Circle,
  "In Progress": Clock,
  "Waiting for Response": Clock,
  Completed: CheckCircle2,
  Rejected: XCircle,
};

function orgName(project: Project, orgId: string): string {
  return project.partners.find((p) => p.orgId === orgId)?.name ?? orgId;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${Math.max(1, min)}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

// ============================================================
// OVERVIEW
// ============================================================

export function OverviewPanel({ entity, project }: { entity: Entity; project: Project }) {
  const openReq = project.requests.filter((r) => r.status !== "Completed" && r.status !== "Rejected");
  const upcoming = project.meetings
    .filter((m) => new Date(m.date).getTime() >= Date.now() - 86400000)
    .slice(0, 3);
  const recentDocs = project.documents.slice(0, 4);
  const recentActivity = project.activity.slice(0, 6);

  return (
    <div className="space-y-6">
      <ProjectHeader entity={entity} project={project} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatTile icon={Users} label="Partner organizations" value={project.partners.length} />
        <StatTile icon={Inbox} label="Open requests" value={openReq.length} />
        <StatTile
          icon={CheckCircle2}
          label="Completed requests"
          value={project.requests.filter((r) => r.status === "Completed").length}
        />
        <StatTile icon={CalendarDays} label="Upcoming meetings" value={upcoming.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="space-y-4 p-5">
            <SectionTitle icon={FolderOpen}>Project description</SectionTitle>
            <p className="text-sm leading-relaxed text-muted-foreground">{project.description}</p>
            {project.objectives.length > 0 && (
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">Objectives</div>
                <ul className="space-y-1.5 text-sm">
                  {project.objectives.map((o) => (
                    <li key={o} className="flex items-start gap-2">
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{o}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 border-t pt-4 text-xs text-muted-foreground">
              <div>
                <div className="mb-0.5 font-medium text-foreground">Timeline</div>
                {fmtDate(project.startDate)} → {fmtDate(project.endDate)}
              </div>
              <div>
                <div className="mb-0.5 font-medium text-foreground">Industry</div>
                {project.industry}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <SectionTitle icon={Activity}>Recent activity</SectionTitle>
            <ul className="space-y-3">
              {recentActivity.map((a) => (
                <li key={a.id} className="flex items-start gap-2 text-sm">
                  <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0">
                    <div className="truncate">{a.message}</div>
                    <div className="text-[11px] text-muted-foreground">{fmtRelative(a.at)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 p-5">
            <SectionTitle icon={FolderOpen}>Important documents</SectionTitle>
            <ul className="space-y-2">
              {recentDocs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-2 rounded-md border p-2 text-sm"
                >
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{d.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.folder} · v{d.version}
                    </div>
                  </div>
                </li>
              ))}
              {recentDocs.length === 0 && (
                <li className="text-sm text-muted-foreground">No documents yet.</li>
              )}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="space-y-3 p-5">
            <SectionTitle icon={CalendarDays}>Upcoming meetings</SectionTitle>
            {upcoming.length === 0 && (
              <div className="text-sm text-muted-foreground">No meetings scheduled.</div>
            )}
            <ul className="space-y-2">
              {upcoming.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {fmtDate(m.date)} · {m.time} · {m.participants.length} participants
                    </div>
                  </div>
                  {m.link && (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      Join <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <QuickActions entity={entity} project={project} />
    </div>
  );
}

function ProjectHeader({ entity, project }: { entity: Entity; project: Project }) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div
        className="h-40 w-full bg-cover bg-center"
        style={{ backgroundImage: `url(${project.image})` }}
      />
      <div className="space-y-3 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <ProjectStatusBadge status={project.status} />
              <span>· Owner: {entity.name}</span>
              <span>· {project.industry}</span>
              <span>· Updated {fmtRelative(project.updatedAt)}</span>
            </div>
          </div>
          <div className="w-48">
            <div className="mb-1 flex justify-between text-[11px] text-muted-foreground">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {project.tags.map((t) => (
            <span
              key={t}
              className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-semibold leading-none">{value}</div>
          <div className="mt-1 text-[11px] text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium">
      <Icon className="h-4 w-4 text-muted-foreground" /> {children}
    </div>
  );
}

function QuickActions({ entity, project }: { entity: Entity; project: Project }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <CreateRequestDialog entity={entity} project={project}>
        <Button variant="outline" className="justify-start">
          <Plus className="h-4 w-4" /> Create Request
        </Button>
      </CreateRequestDialog>
      <InvitePartnerDialog entity={entity} project={project}>
        <Button variant="outline" className="justify-start">
          <UserPlus className="h-4 w-4" /> Invite Partner
        </Button>
      </InvitePartnerDialog>
      <UploadDocumentDialog entity={entity} project={project}>
        <Button variant="outline" className="justify-start">
          <Upload className="h-4 w-4" /> Upload Document
        </Button>
      </UploadDocumentDialog>
      <ScheduleMeetingDialog entity={entity} project={project}>
        <Button variant="outline" className="justify-start">
          <CalendarPlus className="h-4 w-4" /> Schedule Meeting
        </Button>
      </ScheduleMeetingDialog>
    </div>
  );
}

// ============================================================
// PARTNERS
// ============================================================

export function PartnersPanel({ entity, project }: { entity: Entity; project: Project }) {
  return (
    <div className="space-y-5">
      <PanelHeader
        title="Partner organizations"
        subtitle="Every organization participating in this project."
        action={
          <InvitePartnerDialog entity={entity} project={project}>
            <Button>
              <UserPlus className="h-4 w-4" /> Invite partner
            </Button>
          </InvitePartnerDialog>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {project.partners.map((p) => (
          <Card key={p.orgId}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {initials(p.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{p.name}</div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    {p.orgType} · {p.country}
                  </div>
                </div>
                <StatusPill status={p.status} />
              </div>
              <div className="rounded-md bg-muted/50 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Role: </span>
                {p.role}
              </div>
              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <a href={`/organizations/${p.orgId}`}>
                    <Building2 className="h-3.5 w-3.5" /> Profile
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="flex-1">
                  <a href={`/organizations/${entity.id}/messages`}>
                    <MessageCircle className="h-3.5 w-3.5" /> Message
                  </a>
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Mail className="h-3.5 w-3.5" /> Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: ProjectPartner["status"] }) {
  const tone =
    status === "Active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "Invited"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-700";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", tone)}>{status}</span>
  );
}

function InvitePartnerDialog({
  entity,
  project,
  children,
}: {
  entity: Entity;
  project: Project;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [orgId, setOrgId] = useState("");
  const [role, setRole] = useState("Tier-1 Manufacturer");
  const [category, setCategory] = useState<ProjectPartner["orgType"]>("Manufacturer");

  const available = useMemo(
    () => ALL_ENTITIES.filter((e) => !project.partners.some((p) => p.orgId === e.id)),
    [project.partners],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a partner organization</DialogTitle>
          <DialogDescription>
            Choose an organization from the GCH registry and set their role in this project.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Organization</Label>
            <Select value={orgId} onValueChange={setOrgId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an organization…" />
              </SelectTrigger>
              <SelectContent>
                {available.slice(0, 40).map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} — {e.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ProjectPartner["orgType"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Brand",
                    "Manufacturer",
                    "Supplier",
                    "Research Institute",
                    "NGO",
                    "Auditor",
                    "Certifier",
                    "Recycler",
                    "Technology Provider",
                    "Investor",
                    "Consultant",
                    "Logistics",
                    "Government",
                  ].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Input value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!orgId}
            onClick={() => {
              const e = ALL_ENTITIES.find((x) => x.id === orgId);
              if (!e) return;
              invitePartner(entity, project.id, {
                orgId: e.id,
                name: e.name,
                orgType: category,
                country: e.country,
                role,
                status: "Invited",
                permissions: {
                  view: true,
                  upload: false,
                  edit: false,
                  approve: false,
                  invite: false,
                  createRequests: true,
                  comment: true,
                  download: true,
                },
              });
              setOpen(false);
              setOrgId("");
            }}
          >
            Send invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// REQUESTS
// ============================================================

export function RequestsPanel({ entity, project }: { entity: Entity; project: Project }) {
  const [filter, setFilter] = useState<RequestStatus | "All">("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const filtered =
    filter === "All" ? project.requests : project.requests.filter((r) => r.status === filter);
  const active = project.requests.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Requests"
        subtitle="Lightweight cross-organization asks — certificates, approvals, samples, reviews."
        action={
          <CreateRequestDialog entity={entity} project={project}>
            <Button>
              <Plus className="h-4 w-4" /> New request
            </Button>
          </CreateRequestDialog>
        }
      />
      <div className="flex flex-wrap gap-1">
        {(["All", ...REQ_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border hover:bg-muted",
            )}
          >
            {s}
            {s !== "All" && (
              <span className="ml-1.5 text-[10px] opacity-70">
                {project.requests.filter((r) => r.status === s).length}
              </span>
            )}
          </button>
        ))}
      </div>
      <Card>
        <CardContent className="p-0">
          <ul className="divide-y">
            {filtered.map((r) => {
              const Icon = STATUS_ICON[r.status];
              return (
                <li key={r.id}>
                  <button
                    onClick={() => setOpenId(r.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/40"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium">{r.title}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                            PRIORITY_TONE[r.priority],
                          )}
                        >
                          {r.priority}
                        </span>
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                        <span>Assigned: {orgName(project, r.assignedOrgId)}</span>
                        <span>· Requested by: {orgName(project, r.requestedByOrgId)}</span>
                        <span>· Due {fmtDate(r.dueDate)}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px]">
                      {r.status}
                    </Badge>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="p-8 text-center text-sm text-muted-foreground">
                No requests in this view.
              </li>
            )}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(v) => !v && setOpenId(null)}>
        {active && (
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="pr-8">{active.title}</DialogTitle>
              <DialogDescription>
                Assigned to {orgName(project, active.assignedOrgId)} · Requested by{" "}
                {orgName(project, active.requestedByOrgId)} · Due {fmtDate(active.dueDate)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", PRIORITY_TONE[active.priority])}>
                  {active.priority} priority
                </span>
                <Select
                  value={active.status}
                  onValueChange={(v) =>
                    setRequestStatus(entity, project.id, active.id, v as RequestStatus)
                  }
                >
                  <SelectTrigger className="h-8 w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REQ_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">{active.description}</p>
              {active.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {active.attachments.map((a) => (
                    <span
                      key={a.name}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5" /> {a.name}
                    </span>
                  ))}
                </div>
              )}
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">
                  Discussion ({active.comments.length})
                </div>
                <ul className="mb-3 space-y-2">
                  {active.comments.map((c) => (
                    <li key={c.id} className="rounded-md border p-2.5 text-sm">
                      <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                        {c.authorName} · {fmtRelative(c.at)}
                      </div>
                      <div>{c.body}</div>
                    </li>
                  ))}
                  {active.comments.length === 0 && (
                    <li className="text-xs text-muted-foreground">No comments yet.</li>
                  )}
                </ul>
                <CommentComposer
                  onSubmit={(body) => addRequestComment(entity, project.id, active.id, body)}
                />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function CommentComposer({ onSubmit }: { onSubmit: (body: string) => void }) {
  const [body, setBody] = useState("");
  return (
    <div className="flex gap-2">
      <Input
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write a comment…"
      />
      <Button
        disabled={!body.trim()}
        onClick={() => {
          onSubmit(body.trim());
          setBody("");
        }}
      >
        Reply
      </Button>
    </div>
  );
}

function CreateRequestDialog({
  entity,
  project,
  children,
}: {
  entity: Entity;
  project: Project;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    assignedOrgId: project.partners[1]?.orgId ?? project.partners[0]?.orgId ?? "",
    priority: "Medium" as RequestPriority,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a request</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Submit updated GOTS certificate"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label>Assign to</Label>
              <Select
                value={form.assignedOrgId}
                onValueChange={(v) => setForm({ ...form, assignedOrgId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {project.partners.map((p) => (
                    <SelectItem key={p.orgId} value={p.orgId}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v as RequestPriority })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Due date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!form.title.trim() || !form.assignedOrgId}
            onClick={() => {
              createRequest(entity, project.id, {
                title: form.title.trim(),
                description: form.description.trim(),
                assignedOrgId: form.assignedOrgId,
                requestedByOrgId: entity.id,
                priority: form.priority,
                dueDate: new Date(form.dueDate).toISOString(),
              });
              setForm({
                title: "",
                description: "",
                assignedOrgId: form.assignedOrgId,
                priority: "Medium",
                dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
              });
              setOpen(false);
            }}
          >
            Create request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DOCUMENTS
// ============================================================

export function DocumentsPanel({ entity, project }: { entity: Entity; project: Project }) {
  const [folder, setFolder] = useState<DocFolder | "All">("All");
  const [q, setQ] = useState("");
  const filtered = project.documents.filter(
    (d) =>
      (folder === "All" || d.folder === folder) &&
      d.name.toLowerCase().includes(q.trim().toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Shared documents"
        subtitle="Secure, versioned document workspace visible to partners with the right permissions."
        action={
          <UploadDocumentDialog entity={entity} project={project}>
            <Button>
              <Upload className="h-4 w-4" /> Upload
            </Button>
          </UploadDocumentDialog>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <Card>
          <CardContent className="space-y-1 p-2">
            <FolderRow
              label="All"
              count={project.documents.length}
              active={folder === "All"}
              onClick={() => setFolder("All")}
            />
            {FOLDERS.map((f) => (
              <FolderRow
                key={f}
                label={f}
                count={project.documents.filter((d) => d.folder === f).length}
                active={folder === f}
                onClick={() => setFolder(f)}
              />
            ))}
          </CardContent>
        </Card>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search documents…"
              className="pl-9"
            />
          </div>
          <Card>
            <CardContent className="p-0">
              <ul className="divide-y">
                {filtered.map((d) => {
                  const Icon = d.mime?.startsWith("image/")
                    ? ImageIcon
                    : d.mime?.startsWith("video/")
                    ? Video
                    : FileText;
                  return (
                    <li
                      key={d.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40"
                    >
                      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{d.name}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {d.folder} · v{d.version} · {orgName(project, d.uploadedByOrgId)} ·{" "}
                          {fmtRelative(d.uploadedAt)}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        {d.visibility}
                      </Badge>
                      {d.url && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={d.url} target="_blank" rel="noreferrer" download={d.name}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="p-8 text-center text-sm text-muted-foreground">
                    No documents in this folder.
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function FolderRow({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm",
        active ? "bg-muted font-medium" : "hover:bg-muted/50",
      )}
    >
      <span>{label}</span>
      <span className="text-[11px] text-muted-foreground">{count}</span>
    </button>
  );
}

function UploadDocumentDialog({
  entity,
  project,
  children,
}: {
  entity: Entity;
  project: Project;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [folder, setFolder] = useState<DocFolder>("Certificates");
  const [name, setName] = useState("");
  const [visibility, setVisibility] = useState<"All Partners" | "Owner Only">("All Partners");
  const [file, setFile] = useState<{ dataUrl?: string; name: string; mime: string; size: number } | null>(
    null,
  );

  async function handleFile(f: File) {
    const buf = f.size <= 3.5 * 1024 * 1024;
    let dataUrl: string | undefined;
    if (buf) {
      dataUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result as string);
        r.onerror = rej;
        r.readAsDataURL(f);
      });
    }
    setFile({ dataUrl, name: f.name, mime: f.type, size: f.size });
    if (!name) setName(f.name);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload document</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>File</Label>
            <Input
              type="file"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            {file && (
              <div className="text-[11px] text-muted-foreground">
                {file.name} · {(file.size / 1024).toFixed(1)} KB
                {!file.dataUrl && " · (>3.5MB, stored as reference only)"}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Folder</Label>
              <Select value={folder} onValueChange={(v) => setFolder(v as DocFolder)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FOLDERS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Visibility</Label>
              <Select
                value={visibility}
                onValueChange={(v) => setVisibility(v as typeof visibility)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Partners">All partners</SelectItem>
                  <SelectItem value="Owner Only">Owner only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Display name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!file || !name.trim()}
            onClick={() => {
              if (!file) return;
              uploadDocument(entity, project.id, {
                folder,
                name: name.trim(),
                uploadedByOrgId: entity.id,
                visibility,
                url: file.dataUrl,
                mime: file.mime,
                sizeBytes: file.size,
              });
              setFile(null);
              setName("");
              setOpen(false);
            }}
          >
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// DISCUSSIONS
// ============================================================

export function DiscussionsPanel({ entity, project }: { entity: Entity; project: Project }) {
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const filtered = project.discussions.filter(
    (d) =>
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.body.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Discussions"
        subtitle="Project-wide threaded conversations. Mention organizations with @."
      />
      <Card>
        <CardContent className="space-y-2 p-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Start a new thread — subject line"
          />
          <Textarea
            rows={3}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message… use @ to mention an organization."
          />
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-muted-foreground">
              Mention: {project.partners.slice(0, 4).map((p) => `@${p.name.split(" ")[0]}`).join(", ")}
            </div>
            <Button
              disabled={!title.trim() || !body.trim()}
              onClick={() => {
                addDiscussion(entity, project.id, {
                  authorOrgId: entity.id,
                  authorName: entity.name,
                  title: title.trim(),
                  body: body.trim(),
                });
                setTitle("");
                setBody("");
              }}
            >
              Post thread
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search discussions…"
          className="pl-9"
        />
      </div>

      <div className="space-y-4">
        {filtered.map((d) => (
          <Card key={d.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {initials(d.authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="text-sm font-medium">{d.authorName}</span>
                    <span className="text-[11px] text-muted-foreground">{fmtRelative(d.at)}</span>
                  </div>
                  <div className="mt-1 font-medium">{d.title}</div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{d.body}</p>
                </div>
              </div>
              {d.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pl-12">
                  {d.attachments.map((a) => (
                    <span
                      key={a.name}
                      className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs"
                    >
                      <FileText className="h-3.5 w-3.5" /> {a.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 pl-12">
                {["👍", "🎉", "🙏", "💡"].map((e) => (
                  <button
                    key={e}
                    onClick={() => reactDiscussion(entity, project.id, d.id, e)}
                    className="rounded-full border px-2 py-0.5 text-xs hover:bg-muted"
                  >
                    {e} {d.reactions[e] ?? 0}
                  </button>
                ))}
              </div>
              <div className="ml-12 space-y-2 border-l-2 pl-4">
                {d.replies.map((r) => (
                  <div key={r.id} className="rounded-md bg-muted/40 p-2.5 text-sm">
                    <div className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                      {r.authorName} · {fmtRelative(r.at)}
                    </div>
                    <div>{r.body}</div>
                  </div>
                ))}
                <div className="pl-0">
                  <CommentComposer
                    onSubmit={(b) => replyDiscussion(entity, project.id, d.id, b)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No threads yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ============================================================
// MEETINGS
// ============================================================

export function MeetingsPanel({ entity, project }: { entity: Entity; project: Project }) {
  const now = Date.now();
  const upcoming = project.meetings.filter((m) => new Date(m.date).getTime() >= now - 86400000);
  const past = project.meetings.filter((m) => new Date(m.date).getTime() < now - 86400000);

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Meetings"
        subtitle="Steering calls, workshops, and reviews with your project partners."
        action={
          <ScheduleMeetingDialog entity={entity} project={project}>
            <Button>
              <CalendarPlus className="h-4 w-4" /> Schedule
            </Button>
          </ScheduleMeetingDialog>
        }
      />
      <MeetingList entity={entity} project={project} title="Upcoming" meetings={upcoming} />
      <MeetingList entity={entity} project={project} title="Past" meetings={past} />
    </div>
  );
}

function MeetingList({
  entity,
  project,
  title,
  meetings,
}: {
  entity: Entity;
  project: Project;
  title: string;
  meetings: Project["meetings"];
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      {meetings.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            Nothing here.
          </CardContent>
        </Card>
      )}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {meetings.map((m) => (
          <Card key={m.id}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{m.title}</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {fmtDate(m.date)} · {m.time} · {m.participants.length} participants
                  </div>
                </div>
                {m.link && (
                  <a
                    href={m.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-muted"
                  >
                    Join <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{m.agenda}</p>
              {m.actionItems.length > 0 && (
                <div>
                  <div className="mb-1.5 text-[11px] font-medium text-muted-foreground">
                    Action items
                  </div>
                  <ul className="space-y-1.5">
                    {m.actionItems.map((a) => (
                      <li key={a.id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={a.done}
                          onCheckedChange={() =>
                            toggleActionItem(entity, project.id, m.id, a.id)
                          }
                        />
                        <span className={cn(a.done && "text-muted-foreground line-through")}>
                          {a.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ScheduleMeetingDialog({
  entity,
  project,
  children,
}: {
  entity: Entity;
  project: Project;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
    time: "14:00",
    link: "",
    agenda: "",
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule a meeting</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Weekly steering committee"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Time</Label>
              <Input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Meeting link</Label>
            <Input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://meet.example.com/…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Agenda</Label>
            <Textarea
              rows={3}
              value={form.agenda}
              onChange={(e) => setForm({ ...form, agenda: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            disabled={!form.title.trim()}
            onClick={() => {
              scheduleMeeting(entity, project.id, {
                title: form.title.trim(),
                date: form.date,
                time: form.time,
                participants: project.partners.map((p) => p.orgId),
                link: form.link || undefined,
                agenda: form.agenda,
              });
              setOpen(false);
              setForm({
                title: "",
                date: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
                time: "14:00",
                link: "",
                agenda: "",
              });
            }}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// ACTIVITY
// ============================================================

export function ActivityPanel({ project }: { project: Project }) {
  return (
    <div className="space-y-5">
      <PanelHeader
        title="Activity timeline"
        subtitle="Every important action across partners, requests, documents and meetings."
      />
      <Card>
        <CardContent className="p-5">
          <ol className="relative space-y-4 border-l pl-6">
            {project.activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[27px] top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-background bg-primary" />
                <div className="text-sm">{a.message}</div>
                <div className="text-[11px] text-muted-foreground">
                  {fmtDate(a.at)} · {fmtRelative(a.at)}
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// PERMISSIONS
// ============================================================

export function PermissionsPanel({ entity, project }: { entity: Entity; project: Project }) {
  const isOwner = project.ownerOrgId === entity.id;
  const keys = Object.keys(PERMISSION_LABELS) as PermissionKey[];

  return (
    <div className="space-y-5">
      <PanelHeader
        title="Permissions"
        subtitle={
          isOwner
            ? "As project owner, you control what each partner can do inside this project."
            : "Only the project owner can change permissions."
        }
      />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium">Partner</th>
                  {keys.map((k) => (
                    <th key={k} className="px-2 py-2.5 text-center font-medium">
                      {PERMISSION_LABELS[k]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {project.partners.map((p) => (
                  <tr key={p.orgId}>
                    <td className="px-4 py-2.5">
                      <div className="text-sm font-medium">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {p.orgType} · {p.role}
                      </div>
                    </td>
                    {keys.map((k) => (
                      <td key={k} className="px-2 py-2.5 text-center">
                        <Checkbox
                          checked={p.permissions[k]}
                          disabled={!isOwner || p.orgId === project.ownerOrgId}
                          onCheckedChange={(v) =>
                            setPartnerPermission(entity, project.id, p.orgId, k, !!v)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================================
// shared
// ============================================================

function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
