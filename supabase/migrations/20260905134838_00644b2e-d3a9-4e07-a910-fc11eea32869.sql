-- 1) Feed likes/comments: require network membership (matches feed_posts_select)
DROP POLICY IF EXISTS feed_likes_select ON public.feed_likes;
CREATE POLICY feed_likes_select ON public.feed_likes
  FOR SELECT TO authenticated
  USING (
    public.is_network_user(auth.uid())
    AND EXISTS (SELECT 1 FROM public.feed_posts p WHERE p.id = feed_likes.post_id)
  );

DROP POLICY IF EXISTS feed_comments_select ON public.feed_comments;
CREATE POLICY feed_comments_select ON public.feed_comments
  FOR SELECT TO authenticated
  USING (
    public.is_network_user(auth.uid())
    AND EXISTS (SELECT 1 FROM public.feed_posts p WHERE p.id = feed_comments.post_id)
  );

-- 2) org_documents: scope to authenticated; certifications only for signed-in network users
DROP POLICY IF EXISTS "docs read members or cert" ON public.org_documents;
CREATE POLICY "docs read members or cert" ON public.org_documents
  FOR SELECT TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND (
      public.is_org_member(auth.uid(), org_id)
      OR (category = 'certification'::public.doc_category AND public.is_network_user(auth.uid()))
    )
  );

DROP POLICY IF EXISTS "docs insert by editors" ON public.org_documents;
CREATE POLICY "docs insert by editors" ON public.org_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.user_can_edit(auth.uid(), org_id) AND uploaded_by = auth.uid());

DROP POLICY IF EXISTS "docs delete by uploader or manager" ON public.org_documents;
CREATE POLICY "docs delete by uploader or manager" ON public.org_documents
  FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid() OR public.user_can_manage(auth.uid(), org_id));

REVOKE ALL ON public.org_documents FROM anon;

-- 3) org-docs storage: scope to authenticated; cert branch requires signed-in network user
DROP POLICY IF EXISTS "org-docs read members" ON storage.objects;
CREATE POLICY "org-docs read members" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'org-docs'
    AND auth.uid() IS NOT NULL
    AND (
      public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      OR (
        public.is_network_user(auth.uid())
        AND EXISTS (
          SELECT 1 FROM public.org_documents d
          WHERE d.storage_path = objects.name
            AND d.category = 'certification'::public.doc_category
        )
      )
    )
  );

DROP POLICY IF EXISTS "org-docs write editors" ON storage.objects;
CREATE POLICY "org-docs write editors" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'org-docs'
    AND public.user_can_edit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "org-docs delete managers" ON storage.objects;
CREATE POLICY "org-docs delete managers" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'org-docs'
    AND public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );