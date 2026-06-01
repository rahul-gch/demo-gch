import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Building2, Users, FileText, Settings, Upload, Trash2, Download, Plus, Save, ShieldAlert } from "lucide-react";
import {
  getOrgBySlug, listOrgDocuments, updateOrg,
  inviteGhostMember, updateMemberRole, removeMember,
  createDocument, deleteDocument,
} from "@/lib/org.functions";
import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser } from "@/lib/auth";
import { RoleGate, RoleBadge, canAtLeast, type OrgRole } from "@/components/RoleGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/org/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `Organisation · ${params.slug} — GCH` },
      { name: "description", content: `Org profile, members and documents for ${params.slug}.` },
    ],
  }),
  component: OrgProfilePage,
});

type Member = { id: string; user_id: string | null; display_name: string; title: string | null; role: OrgRole; joined_at: string };
type Doc = { id: string; category: "certification" | "evidence" | "org_document"; title: string; description: string | null; storage_path: string; mime_type: string | null; size_bytes: number | null; uploaded_by: string | null; created_at: string };
type Org = { id: string; slug: string; name: string; type: string; country: string | null; region: string | null; size: string | null; tier: number | null; description: string | null; website: string | null; certifications: string[] };

type Tab = "overview" | "members" | "documents" | "settings";

function OrgProfilePage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const fetchOrg = useServerFn(getOrgBySlug);
  const fetchDocs = useServerFn(listOrgDocuments);

  const [loading, setLoading] = useState(true);
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [myRole, setMyRole] = useState<OrgRole>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setLoading(true);
      const r = await fetchOrg({ data: { slug } });
      setOrg(r.org as Org);
      setMembers(r.members as Member[]);
      setMyRole(r.myRole as OrgRole);
      if (canAtLeast(r.myRole as OrgRole, "view")) {
        const d = await fetchDocs({ data: { orgId: (r.org as Org).id } });
        setDocs(d.documents as Doc[]);
      } else {
        // non-members still see certification docs (RLS allows)
        const d = await fetchDocs({ data: { orgId: (r.org as Org).id } });
        setDocs(d.documents as Doc[]);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load org");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getCurrentUser()) { navigate({ to: "/login" }); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (loading) return <Shell><div className="p-10 text-sm text-muted-foreground">Loading organisation…</div></Shell>;
  if (error || !org) return <Shell><div className="p-10 text-sm text-rose-600">{error ?? "Organisation not found"}</div></Shell>;

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 text-foreground">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{org.type} · {org.country ?? "—"}</div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{org.name}</h1>
              <div className="mt-1 flex items-center gap-2">
                <RoleBadge role={myRole} />
                {!myRole && <span className="text-[11px] text-muted-foreground">You are not a member of this org</span>}
              </div>
            </div>
          </div>
        </div>

        <nav className="mb-6 flex gap-1 rounded-full border border-border bg-card p-1 w-fit">
          {([
            { id: "overview",  label: "Overview",  icon: Building2, gate: "view" },
            { id: "members",   label: "Members",   icon: Users,     gate: "view" },
            { id: "documents", label: "Documents", icon: FileText,  gate: "view" },
            { id: "settings",  label: "Settings",  icon: Settings,  gate: "owner" },
          ] as const).map((t) => {
            const Icon = t.icon;
            const enabled = canAtLeast(myRole, t.gate);
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                disabled={!enabled}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  active ? "bg-foreground text-background" : enabled ? "text-muted-foreground hover:text-foreground" : "text-muted-foreground/40 cursor-not-allowed"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </nav>

        {tab === "overview"  && <OverviewTab  org={org} myRole={myRole} onSaved={refresh} />}
        {tab === "members"   && <MembersTab   org={org} members={members} myRole={myRole} onChanged={refresh} />}
        {tab === "documents" && <DocumentsTab org={org} docs={docs} myRole={myRole} onChanged={refresh} />}
        {tab === "settings"  && <SettingsTab  org={org} myRole={myRole} />}
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to workspace
          </Link>
          <Link to="/how-it-works" className="text-xs text-muted-foreground hover:text-foreground">How it works</Link>
        </div>
      </header>
      {children}
    </div>
  );
}

/* ---------- Overview ---------- */
function OverviewTab({ org, myRole, onSaved }: { org: Org; myRole: OrgRole; onSaved: () => void }) {
  const save = useServerFn(updateOrg);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(org.name);
  const [description, setDescription] = useState(org.description ?? "");
  const [website, setWebsite] = useState(org.website ?? "");
  const [country, setCountry] = useState(org.country ?? "");
  const [certs, setCerts] = useState(org.certifications.join(", "));
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      await save({ data: {
        orgId: org.id,
        name, description, country,
        website: website || null,
        certifications: certs.split(",").map((s) => s.trim()).filter(Boolean),
      }});
      setEditing(false);
      onSaved();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save");
    } finally { setSaving(false); }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">About</h2>
          <RoleGate role={myRole} need="edit">
            {!editing
              ? <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Edit</Button>
              : <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
                  <Button size="sm" onClick={submit} disabled={saving}><Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}</Button>
                </div>}
          </RoleGate>
        </div>
        {editing ? (
          <div className="space-y-3 text-sm">
            <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Country"><Input value={country} onChange={(e) => setCountry(e.target.value)} /></Field>
            <Field label="Website"><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" /></Field>
            <Field label="Description"><textarea className="min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm" value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
            <Field label="Certifications (comma-separated)"><Input value={certs} onChange={(e) => setCerts(e.target.value)} /></Field>
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <p className="text-foreground">{org.description ?? <span className="text-muted-foreground">No description yet.</span>}</p>
            {org.website && <a href={org.website} target="_blank" rel="noreferrer" className="text-xs text-sky-600 hover:underline">{org.website}</a>}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 text-sm">
        <h2 className="mb-3 text-sm font-semibold">Profile</h2>
        <dl className="space-y-2 text-xs">
          <Row k="Type" v={org.type} />
          <Row k="Country" v={org.country ?? "—"} />
          <Row k="Region" v={org.region ?? "—"} />
          <Row k="Size" v={org.size ?? "—"} />
          <Row k="Tier" v={org.tier ? `Tier ${org.tier}` : "—"} />
        </dl>
        <div className="mt-4">
          <div className="mb-1 text-[11px] uppercase tracking-wider text-muted-foreground">Certifications</div>
          <div className="flex flex-wrap gap-1">
            {org.certifications.length ? org.certifications.map((c) => (
              <span key={c} className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px]">{c}</span>
            )) : <span className="text-xs text-muted-foreground">None</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><div className="mb-1 text-[11px] font-medium text-muted-foreground">{label}</div>{children}</label>;
}
function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3"><dt className="text-muted-foreground">{k}</dt><dd className="text-foreground">{v}</dd></div>;
}

/* ---------- Members ---------- */
function MembersTab({ org, members, myRole, onChanged }: { org: Org; members: Member[]; myRole: OrgRole; onChanged: () => void }) {
  const invite = useServerFn(inviteGhostMember);
  const setRole = useServerFn(updateMemberRole);
  const remove = useServerFn(removeMember);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRoleState] = useState<"admin" | "editor" | "viewer">("editor");

  async function add() {
    if (!name.trim()) return;
    try {
      await invite({ data: { orgId: org.id, displayName: name.trim(), title: title.trim() || undefined, role } });
      setName(""); setTitle(""); setRoleState("editor"); setAdding(false); onChanged();
    } catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Members ({members.length})</h2>
        <RoleGate role={myRole} need="manage">
          {!adding
            ? <Button size="sm" onClick={() => setAdding(true)}><Plus className="h-3.5 w-3.5" /> Add member</Button>
            : <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>}
        </RoleGate>
      </div>

      {adding && (
        <div className="mb-4 grid grid-cols-1 gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 md:grid-cols-[1fr_1fr_140px_auto]">
          <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <select value={role} onChange={(e) => setRoleState(e.target.value as "admin" | "editor" | "viewer")} className="rounded-md border border-input bg-background px-3 py-1.5 text-sm">
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <Button size="sm" onClick={add}>Add</Button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr><th className="px-2 py-2">Name</th><th className="px-2 py-2">Title</th><th className="px-2 py-2">Role</th><th /></tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id} className="border-t border-border">
              <td className="px-2 py-2 font-medium text-foreground">{m.display_name}{!m.user_id && <span className="ml-1 text-[10px] text-muted-foreground">(seeded)</span>}</td>
              <td className="px-2 py-2 text-muted-foreground">{m.title ?? "—"}</td>
              <td className="px-2 py-2">
                <RoleGate role={myRole} need="manage" fallback={<RoleBadge role={m.role} />}>
                  <select
                    value={m.role ?? "viewer"}
                    onChange={async (e) => {
                      try { await setRole({ data: { memberId: m.id, role: e.target.value as "owner" | "admin" | "editor" | "viewer" } }); onChanged(); }
                      catch (err) { alert(err instanceof Error ? err.message : "Failed"); }
                    }}
                    className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                  >
                    <option value="owner" disabled={myRole !== "owner"}>Owner</option>
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </RoleGate>
              </td>
              <td className="px-2 py-2 text-right">
                <RoleGate role={myRole} need="manage">
                  <button
                    className="text-xs text-rose-600 hover:underline"
                    onClick={async () => { if (!confirm(`Remove ${m.display_name}?`)) return; try { await remove({ data: { memberId: m.id } }); onChanged(); } catch (e) { alert(e instanceof Error ? e.message : "Failed"); } }}
                  >Remove</button>
                </RoleGate>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Documents ---------- */
function DocumentsTab({ org, docs, myRole, onChanged }: { org: Org; docs: Doc[]; myRole: OrgRole; onChanged: () => void }) {
  const [category, setCategory] = useState<"certification" | "evidence" | "org_document">("certification");
  const createDoc = useServerFn(createDocument);
  const removeDoc = useServerFn(deleteDocument);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const filtered = docs.filter((d) => d.category === category);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { alert("Max 10 MB"); return; }
    setUploading(true);
    try {
      const path = `${org.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("org-docs").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      await createDoc({ data: {
        orgId: org.id, category, title: file.name,
        storagePath: path, mimeType: file.type, sizeBytes: file.size,
      }});
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function download(path: string) {
    const { data, error } = await supabase.storage.from("org-docs").createSignedUrl(path, 60);
    if (error) { alert(error.message); return; }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-full border border-border bg-background p-1">
          {([
            { id: "certification", label: "Certifications" },
            { id: "evidence",      label: "Evidence" },
            { id: "org_document",  label: "Org documents" },
          ] as const).map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)} className={`rounded-full px-3 py-1 text-xs font-medium ${category === c.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{c.label}</button>
          ))}
        </div>
        <RoleGate role={myRole} need="edit">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium hover:bg-muted">
            <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Upload"}
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.csv,.xlsx" onChange={onFile} disabled={uploading} />
          </label>
        </RoleGate>
      </div>

      {category === "certification" && !canAtLeast(myRole, "view") && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-sky-200 bg-sky-50 p-2 text-xs text-sky-800">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5" />
          Certifications are public to the ecosystem so partners can verify trust signals. Evidence & internal docs are members-only.
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-6 text-center text-sm text-muted-foreground">
          No {category.replace("_", " ")} uploaded yet.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {filtered.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{d.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {d.mime_type ?? "file"} · {d.size_bytes ? `${Math.round(d.size_bytes / 1024)} KB` : "—"} · {new Date(d.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => download(d.storage_path)} className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] hover:bg-muted">
                  <Download className="h-3 w-3" /> Open
                </button>
                <RoleGate role={myRole} need="edit">
                  <button
                    onClick={async () => { if (!confirm("Delete this document?")) return; try { await removeDoc({ data: { documentId: d.id } }); onChanged(); } catch (e) { alert(e instanceof Error ? e.message : "Failed"); } }}
                    className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </RoleGate>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Settings (Owner only) ---------- */
function SettingsTab({ org, myRole }: { org: Org; myRole: OrgRole }) {
  if (myRole !== "owner") {
    return <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">Only the Owner can access settings.</div>;
  }
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5 text-sm">
        <h2 className="mb-1 text-sm font-semibold">Organisation handle</h2>
        <p className="text-xs text-muted-foreground">Slug: <code className="rounded bg-muted px-1 py-0.5">{org.slug}</code> (read-only in the demo)</p>
      </div>
      <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-5 text-sm">
        <h2 className="mb-1 text-sm font-semibold text-rose-800">Danger zone</h2>
        <p className="text-xs text-rose-800/80">Transfer ownership or delete this organisation. Out of scope in the prototype.</p>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" disabled>Transfer ownership</Button>
          <Button size="sm" variant="destructive" disabled>Delete organisation</Button>
        </div>
      </div>
    </div>
  );
}
