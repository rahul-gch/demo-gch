create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  window_start timestamptz := now() - interval '30 days';
  previous_window_start timestamptz := now() - interval '60 days';
begin
  if caller_id is null or not public.is_platform_admin(caller_id) then
    raise exception 'Forbidden: platform admins only.' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'orgs', (select count(*) from public.orgs),
    'countries', (select count(distinct nullif(trim(country), '')) from public.orgs),
    'members', (select count(*) from public.org_members),
    'membersByRole', jsonb_build_object(
      'owner', (select count(*) from public.org_members where role = 'owner'),
      'admin', (select count(*) from public.org_members where role = 'admin'),
      'editor', (select count(*) from public.org_members where role = 'editor'),
      'viewer', (select count(*) from public.org_members where role = 'viewer')
    ),
    'activeProjects', (select count(*) from public.projects where lower(status) = 'active'),
    'pendingConnections', (select count(*) from public.org_connections where status = 'pending'),
    'pendingMeetings', (select count(*) from public.meeting_requests where status = 'pending'),
    'ordersAwaitingQuote', (select count(*) from public.sample_orders where status = 'requested'),
    'ordersAwaitingConfirmation', (select count(*) from public.sample_orders where status = 'quoted'),
    'openInvites', (
      select count(*)
      from public.platform_invites
      where accepted_at is null
        and revoked_at is null
        and expires_at > now()
        and uses < max_uses
    ),
    'unclaimedOrgs', (
      select count(*)
      from public.orgs o
      where not exists (select 1 from public.org_members m where m.org_id = o.id)
    ),
    'incompleteOnboarding', (select count(*) from public.orgs where onboarding_completed_at is null),
    'unresolvedErrors', (select count(*) from public.app_errors where resolved_at is null),
    'errors24h', (
      select count(*)
      from public.app_errors
      where occurred_at >= now() - interval '24 hours'
    ),
    'growth', jsonb_build_object(
      'orgs', jsonb_build_object(
        'total', (select count(*) from public.orgs),
        'last30', (select count(*) from public.orgs where created_at >= window_start),
        'prev30', (select count(*) from public.orgs where created_at >= previous_window_start and created_at < window_start)
      ),
      'members', jsonb_build_object(
        'total', (select count(*) from public.org_members),
        'last30', (select count(*) from public.org_members where joined_at >= window_start),
        'prev30', (select count(*) from public.org_members where joined_at >= previous_window_start and joined_at < window_start)
      ),
      'messages', jsonb_build_object(
        'total', (select count(*) from public.messages),
        'last30', (select count(*) from public.messages where created_at >= window_start),
        'prev30', (select count(*) from public.messages where created_at >= previous_window_start and created_at < window_start)
      ),
      'posts', jsonb_build_object(
        'total', (select count(*) from public.feed_posts),
        'last30', (select count(*) from public.feed_posts where created_at >= window_start),
        'prev30', (select count(*) from public.feed_posts where created_at >= previous_window_start and created_at < window_start)
      ),
      'connections', jsonb_build_object(
        'total', (select count(*) from public.org_connections where status = 'accepted'),
        'last30', (select count(*) from public.org_connections where status = 'accepted' and coalesce(responded_at, updated_at, created_at) >= window_start),
        'prev30', (select count(*) from public.org_connections where status = 'accepted' and coalesce(responded_at, updated_at, created_at) >= previous_window_start and coalesce(responded_at, updated_at, created_at) < window_start)
      )
    )
  );
end;
$$;

revoke all on function public.admin_dashboard_stats() from public;
grant execute on function public.admin_dashboard_stats() to authenticated;