CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d30 timestamptz := now() - interval '30 days';
  d60 timestamptz := now() - interval '60 days';
  d1  timestamptz := now() - interval '1 day';
  result jsonb;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden — platform admins only.';
  END IF;

  SELECT jsonb_build_object(
    'orgs', (SELECT count(*) FROM orgs),
    'countries', (SELECT count(DISTINCT country) FROM orgs WHERE country IS NOT NULL AND country <> ''),
    'members', (SELECT count(*) FROM org_members),
    'membersByRole', (
      SELECT jsonb_object_agg(role, c) FROM (
        SELECT role::text AS role, count(*) AS c FROM org_members GROUP BY role
      ) r
    ),
    'activeProjects', (SELECT count(*) FROM projects WHERE status = 'Active'),
    'pendingConnections', (SELECT count(*) FROM org_connections WHERE status = 'pending'),
    'pendingMeetings', (SELECT count(*) FROM meeting_requests WHERE status = 'pending'),
    'ordersAwaitingQuote', (SELECT count(*) FROM sample_orders WHERE status = 'requested'),
    'ordersAwaitingConfirmation', (SELECT count(*) FROM sample_orders WHERE status = 'quoted'),
    'openInvites', (SELECT count(*) FROM platform_invites WHERE revoked_at IS NULL AND accepted_at IS NULL AND expires_at > now()),
    'unclaimedOrgs', (SELECT count(*) FROM orgs o WHERE NOT EXISTS (SELECT 1 FROM org_members m WHERE m.org_id = o.id)),
    'incompleteOnboarding', (SELECT count(*) FROM orgs WHERE onboarding_completed_at IS NULL),
    'unresolvedErrors', (SELECT count(*) FROM app_errors WHERE resolved_at IS NULL),
    'errors24h', (SELECT count(*) FROM app_errors WHERE occurred_at >= d1),
    'growth', jsonb_build_object(
      'orgs', jsonb_build_object(
        'total', (SELECT count(*) FROM orgs),
        'last30', (SELECT count(*) FROM orgs WHERE created_at >= d30),
        'prev30', (SELECT count(*) FROM orgs WHERE created_at >= d60 AND created_at < d30)),
      'members', jsonb_build_object(
        'total', (SELECT count(*) FROM org_members WHERE user_id IS NOT NULL),
        'last30', (SELECT count(*) FROM org_members WHERE user_id IS NOT NULL AND joined_at >= d30),
        'prev30', (SELECT count(*) FROM org_members WHERE user_id IS NOT NULL AND joined_at >= d60 AND joined_at < d30)),
      'messages', jsonb_build_object(
        'total', (SELECT count(*) FROM messages),
        'last30', (SELECT count(*) FROM messages WHERE created_at >= d30),
        'prev30', (SELECT count(*) FROM messages WHERE created_at >= d60 AND created_at < d30)),
      'posts', jsonb_build_object(
        'total', (SELECT count(*) FROM feed_posts),
        'last30', (SELECT count(*) FROM feed_posts WHERE created_at >= d30),
        'prev30', (SELECT count(*) FROM feed_posts WHERE created_at >= d60 AND created_at < d30)),
      'connections', jsonb_build_object(
        'total', (SELECT count(*) FROM org_connections WHERE status = 'accepted'),
        'last30', (SELECT count(*) FROM org_connections WHERE status = 'accepted' AND created_at >= d30),
        'prev30', (SELECT count(*) FROM org_connections WHERE status = 'accepted' AND created_at >= d60 AND created_at < d30))
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated, service_role;