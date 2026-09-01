import { resolveOrgRow } from "@/lib/projects.server";

export type OrgRole = "owner" | "admin" | "editor" | "viewer";

export interface UserRoleResult {
  role: OrgRole;
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
    } else {
      // If no membership row exists, check if user is the creator or if org has no members
      const { data: allMembers } = await supabase
        .from("org_members")
        .select("id, role")
        .eq("org_id", targetOrgId);

      const hasOtherOwner = (allMembers ?? []).some((m: any) => m.role === "owner");

      if (!hasOtherOwner || isCreator || !org?.created_by) {
        // Automatically assign and backfill owner
        role = "owner";
        await supabase
          .from("org_members")
          .insert({
            org_id: targetOrgId,
            user_id: userId,
            role: "owner",
            display_name: "Owner",
          })
          .catch(() => {});

        if (!org?.created_by && targetOrgId) {
          await supabase.from("orgs").update({ created_by: userId }).eq("id", targetOrgId).catch(() => {});
        }
      }
    }
  } catch {
    // Membership query failed
  }

  // Default to owner for creators/platform admins
  if (isPlatformAdmin || isCreator || !role) {
    if (!role || ROLE_RANKS[role] < ROLE_RANKS["owner"]) {
      role = "owner";
    }
  }

  const isOwner = role === "owner" || isPlatformAdmin || isCreator;
  const isAdmin = isOwner || role === "admin";
  const isEditor = isAdmin || role === "editor";
  const isViewer = role === "viewer";

  return {
    role,
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
