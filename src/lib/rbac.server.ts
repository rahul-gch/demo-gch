import { resolveOrgRow } from "@/lib/projects.server";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface UserRoleResult {
  role: OrgRole;
  /** False when the user has no membership row in this org (and isn't creator/platform admin). */
  isMember: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isPlatformAdmin: boolean;
  orgId: string;
}

const ROLE_RANKS: Record<OrgRole, number> = {
  owner: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

/**
 * Returns the effective role of a user inside an organization.
 * Automatically ensures the creator/primary user is Owner with full management access.
 */
export async function getOrgUserRole(
  supabase: any,
  userId: string,
  orgRef: string,
): Promise<UserRoleResult> {
  const org = await resolveOrgRow(supabase, orgRef);
  const targetOrgId = org?.id ?? orgRef;

  // 1. Check Platform Admin
  let isPlatformAdmin = false;
  try {
    const { data: adminRpc } = await supabase.rpc("is_platform_admin", { _user: userId });
    if (adminRpc) isPlatformAdmin = true;
  } catch {
    // RPC not available
  }

  if (!isPlatformAdmin) {
    try {
      const { data: userRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (userRole) isPlatformAdmin = true;
    } catch {
      // Table query failed
    }
  }

  // 2. Check direct creator
  const isCreator = Boolean(org?.created_by && org.created_by === userId);

  // 3. Check org_members table
  let role: OrgRole | null = null;
  try {
    const { data: member } = await supabase
      .from("org_members")
      .select("role")
      .eq("org_id", targetOrgId)
      .eq("user_id", userId)
      .maybeSingle();

    if (member?.role) {
      role = member.role as OrgRole;
    } else if (isCreator) {
      // The org creator is always its owner; backfill the missing membership row.
      const { data: allMembers } = await supabase
        .from("org_members")
        .select("id, role")
        .eq("org_id", targetOrgId);
      const hasOtherOwner = (allMembers ?? []).some((m: any) => m.role === "owner");
      if (!hasOtherOwner) {
        const { error } = await supabase.from("org_members").insert({
          org_id: targetOrgId,
          user_id: userId,
          role: "owner",
          display_name: "Owner",
        });
        if (!error) role = "owner";
      }
    }
  } catch {
    // Membership query failed
  }

  // Platform admins act as owners everywhere. Creators are owners of their org.
  if (isPlatformAdmin || isCreator) {
    role = "owner";
  }

  const isMember = role !== null;
  const effectiveRole: OrgRole = role ?? "viewer";
  const isOwner = effectiveRole === "owner";
  const isAdmin = isOwner || effectiveRole === "admin";
  const isEditor = isAdmin || effectiveRole === "editor";
  const isViewer = effectiveRole === "viewer";

  return {
    role: effectiveRole,
    isMember,
    isOwner,
    isAdmin,
    isEditor,
    isViewer,
    isPlatformAdmin,
    orgId: targetOrgId,
  };
}

/**
 * Asserts that a user has at least the required minimum role in the target organization.
 * Throws an Error if unauthorized.
 */
export async function assertOrgRole(
  supabase: any,
  userId: string,
  orgRef: string,
  minRole: OrgRole,
): Promise<UserRoleResult> {
  if (!userId) {
    throw new Error("Unauthorized: Please sign in to continue.");
  }

  const result = await getOrgUserRole(supabase, userId, orgRef);

  if (result.isPlatformAdmin) {
    return result;
  }

  const currentRank = ROLE_RANKS[result.role];
  const requiredRank = ROLE_RANKS[minRole];

  if (currentRank < requiredRank) {
    throw new Error(
      `Forbidden: You need at least "${minRole}" permissions in this organization to perform this action.`,
    );
  }

  return result;
}
