import { useQuery } from "@tanstack/react-query";
import { getMyOrgRoleFn } from "@/lib/projects.functions";
import type { OrgRole } from "@/lib/rbac.server";

export interface OrgRoleState {
  role: OrgRole | null;
  isOwner: boolean;
  isAdmin: boolean;
  isEditor: boolean;
  isViewer: boolean;
  isPlatformAdmin: boolean;
  canManage: boolean;
  canEdit: boolean;
  isLoading: boolean;
}

export function useOrgRole(orgId: string | undefined | null): OrgRoleState {
  const { data, isLoading } = useQuery({
    queryKey: ["my-org-role", orgId],
    queryFn: () => (orgId ? getMyOrgRoleFn({ data: { orgId } }) : null),
    enabled: Boolean(orgId),
    staleTime: 30_000,
  });

  return {
    role: data?.role ?? null,
    isOwner: data?.isOwner ?? false,
    isAdmin: data?.isAdmin ?? false,
    isEditor: data?.isEditor ?? false,
    isViewer: data?.isViewer ?? false,
    isPlatformAdmin: data?.isPlatformAdmin ?? false,
    canManage: (data?.isAdmin || data?.isOwner || data?.isPlatformAdmin) ?? false,
    canEdit: (data?.isEditor || data?.isAdmin || data?.isOwner || data?.isPlatformAdmin) ?? false,
    isLoading,
  };
}
