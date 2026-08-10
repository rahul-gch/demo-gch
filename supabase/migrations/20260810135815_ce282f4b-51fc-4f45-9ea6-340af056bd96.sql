
CREATE TABLE public.feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Member',
  author_role text,
  kind text NOT NULL DEFAULT 'update',
  title text,
  body text NOT NULL DEFAULT '',
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  event_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feed_posts TO authenticated;
GRANT ALL ON public.feed_posts TO service_role;
ALTER TABLE public.feed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_posts_select" ON public.feed_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_posts_insert" ON public.feed_posts FOR INSERT TO authenticated
  WITH CHECK (public.is_org_member(auth.uid(), org_id) AND author_user_id = auth.uid());
CREATE POLICY "feed_posts_update" ON public.feed_posts FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid()) WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "feed_posts_delete" ON public.feed_posts FOR DELETE TO authenticated
  USING (author_user_id = auth.uid() OR public.user_can_manage(auth.uid(), org_id));
CREATE TRIGGER feed_posts_updated_at BEFORE UPDATE ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX feed_posts_org_created_idx ON public.feed_posts (org_id, created_at DESC);

CREATE TABLE public.feed_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.feed_likes TO authenticated;
GRANT ALL ON public.feed_likes TO service_role;
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_likes_select" ON public.feed_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_likes_insert" ON public.feed_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "feed_likes_delete" ON public.feed_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE TABLE public.feed_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  author_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text NOT NULL DEFAULT 'Member',
  author_role text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.feed_comments TO authenticated;
GRANT ALL ON public.feed_comments TO service_role;
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_comments_select" ON public.feed_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "feed_comments_insert" ON public.feed_comments FOR INSERT TO authenticated WITH CHECK (author_user_id = auth.uid());
CREATE POLICY "feed_comments_delete" ON public.feed_comments FOR DELETE TO authenticated USING (author_user_id = auth.uid());
CREATE INDEX feed_comments_post_idx ON public.feed_comments (post_id, created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_comments;
