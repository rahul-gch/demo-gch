import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Trash2, UserMinus, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { deleteProject, removePartner } from "@/lib/use-projects";
import type { Project, ProjectPartner } from "@/lib/projects-types";
import type { Entity } from "@/seed/types";

/** Confirmation dialog that deletes a project once its name is typed back. */
export function DeleteProjectDialog({
  entity,
  project,
  open,
  onOpenChange,
}: {
  entity: Entity;
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const matches = typed.trim() === project.name.trim();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setTyped("");
        onOpenChange(o);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{project.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes the project together with its partners, requests, shared
            documents, discussions, meetings and activity. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="confirm-project-name" className="text-xs">
            Type <span className="font-semibold">{project.name}</span> to confirm
          </Label>
          <Input
            id="confirm-project-name"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={project.name}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!matches || busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async (e) => {
              e.preventDefault();
              setBusy(true);
              const ok = await deleteProject(entity, project.id);
              setBusy(false);
              if (ok) {
                onOpenChange(false);
                void navigate({
                  to: "/organizations/$id/projects",
                  params: { id: entity.id },
                  replace: true,
                });
              }
            }}
          >
            <Trash2 className="h-4 w-4" /> {busy ? "Deleting…" : "Delete project"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Confirmation dialog that removes a partner organization from a project. */
export function RemovePartnerDialog({
  entity,
  project,
  partner,
  open,
  onOpenChange,
}: {
  entity: Entity;
  project: Project;
  partner: ProjectPartner | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove {partner?.name ?? "this partner"}?</AlertDialogTitle>
          <AlertDialogDescription>
            {partner?.name ?? "This organization"} will lose access to this project's requests,
            documents, discussions and meetings. Requests assigned to them will become unassigned.
            You can invite them again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!partner || busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={async (e) => {
              e.preventDefault();
              if (!partner) return;
              setBusy(true);
              const ok = await removePartner(entity, project.id, partner.orgId);
              setBusy(false);
              if (ok) onOpenChange(false);
            }}
          >
            <UserMinus className="h-4 w-4" /> {busy ? "Removing…" : "Remove partner"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Red "danger zone" block shown to owner-org managers on the Permissions page. */
export function ProjectDangerZone({
  entity,
  project,
  extra,
}: {
  entity: Entity;
  project: Project;
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <div className="text-sm font-semibold text-foreground">Danger zone</div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Deleting this project removes it for every partner organization, including all
              shared documents and conversations. This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {extra}
          <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
            <Trash2 className="h-4 w-4" /> Delete project
          </Button>
        </div>
      </CardContent>
      <DeleteProjectDialog entity={entity} project={project} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
