-- 1. Function execution grants
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;
GRANT EXECUTE ON FUNCTION public.get_invite_by_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_platform_invite_by_token(text) TO anon;
-- trigger/internal helpers: not callable by app users
REVOKE EXECUTE ON FUNCTION public.log_member_activity() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.log_org_activity() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_org_created_by() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.platform_admin_domains() FROM authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM anon;

-- 2. search_path pinning
ALTER FUNCTION public.platform_admin_domains() SET search_path = public;
ALTER FUNCTION public.set_updated_at() SET search_path = public;

-- 3. Feed visibility
CREATE OR REPLACE FUNCTION public.is_network_user(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _user IS NOT NULL AND (
    EXISTS (SELECT 1 FROM public.org_members m WHERE m.user_id = _user)
    OR public.is_platform_admin(_user)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.is_network_user(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_network_user(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS feed_posts_select ON public.feed_posts;
CREATE POLICY feed_posts_select ON public.feed_posts FOR SELECT TO authenticated
  USING (public.is_network_user(auth.uid()));

DROP POLICY IF EXISTS feed_likes_select ON public.feed_likes;
CREATE POLICY feed_likes_select ON public.feed_likes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.feed_posts p WHERE p.id = feed_likes.post_id));

DROP POLICY IF EXISTS feed_comments_select ON public.feed_comments;
CREATE POLICY feed_comments_select ON public.feed_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.feed_posts p WHERE p.id = feed_comments.post_id));

-- 4. org_documents UPDATE policy
CREATE POLICY "docs update by uploader or manager" ON public.org_documents FOR UPDATE TO authenticated
  USING (uploaded_by = auth.uid() OR public.user_can_manage(auth.uid(), org_id))
  WITH CHECK (public.user_can_edit(auth.uid(), org_id));

-- 5. org_members UPDATE: owner role only manageable by owners
DROP POLICY IF EXISTS "members update by managers" ON public.org_members;
CREATE POLICY "members update by managers" ON public.org_members FOR UPDATE TO authenticated
  USING (
    public.user_can_manage(auth.uid(), org_id)
    AND (role <> 'owner'::org_role OR public.user_is_owner(auth.uid(), org_id))
  )
  WITH CHECK (
    public.user_can_manage(auth.uid(), org_id)
    AND (role <> 'owner'::org_role OR public.user_is_owner(auth.uid(), org_id))
  );

-- 6. org-logos bootstrap restricted to org creator
DROP POLICY IF EXISTS "org-logos insert by managers or bootstrap" ON storage.objects;
CREATE POLICY "org-logos insert by managers or bootstrap" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-logos'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
    AND (
      public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR (
        NOT EXISTS (SELECT 1 FROM public.org_members m WHERE m.org_id = ((storage.foldername(name))[1])::uuid)
        AND EXISTS (SELECT 1 FROM public.orgs o WHERE o.id = ((storage.foldername(name))[1])::uuid AND o.created_by = auth.uid())
      )
    )
  );