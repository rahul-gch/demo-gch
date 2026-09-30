const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve an org uuid/slug to its uuid, as the signed-in user (RLS applies). */
export async function resolveOrgUuid(supabase: any, ref: string): Promise<string | null> {
  if (UUID_RE.test(ref)) return ref;
  const { data } = await supabase.from("orgs").select("id").eq("slug", ref).maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

/** Throws unless the caller is a member of the org or a platform admin. */
export async function assertOrgMemberOrAdmin(supabase: any, userId: string, orgId: string) {
  const [{ data: member }, { data: admin }] = await Promise.all([
    supabase.rpc("is_org_member", { _user: userId, _org: orgId }),
    supabase.rpc("is_platform_admin", { _user: userId }),
  ]);
  if (!member && !admin) throw new Error("Forbidden");
}

/** Throws unless the caller can edit the org (owner/admin/editor or platform admin). */
export async function assertOrgEditor(supabase: any, userId: string, orgId: string) {
  const { data } = await supabase.rpc("user_can_edit", { _user: userId, _org: orgId });
  if (!data) throw new Error("Forbidden");
}

/** Reads profile_answers through the access-checked private-details lookup. */
export async function readProfileAnswers(
  supabase: any,
  orgId: string,
): Promise<Record<string, unknown>> {
  const { data } = await supabase.rpc("org_private_details", { _org: orgId });
  const row = Array.isArray(data) ? data[0] : data;
  return (row?.profile_answers as Record<string, unknown> | undefined) ?? {};
}

export async function writeProfileAnswers(
  supabase: any,
  orgId: string,
  answers: Record<string, unknown>,
) {
  const { error } = await supabase.from("orgs").update({ profile_answers: answers }).eq("id", orgId);
  if (error) throw new Error("Could not save changes.");
}
