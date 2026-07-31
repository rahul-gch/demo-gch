-- ---------- tables ----------
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  objectives text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'Planning',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz NOT NULL DEFAULT (now() + interval '90 days'),
  progress integer NOT NULL DEFAULT 0,
  image text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  industry text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;

CREATE TABLE public.project_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.orgs(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Partner',
  status text NOT NULL DEFAULT 'Invited',
  permissions jsonb NOT NULL DEFAULT '{"view":true,"upload":false,"edit":false,"approve":false,"invite":false,"createRequests":false,"comment":true,"download":true}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, org_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_partners TO authenticated;
GRANT ALL ON public.project_partners TO service_role;

CREATE TABLE public.project_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  assigned_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  requested_by_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  requested_by uuid,
  priority text NOT NULL DEFAULT 'Medium',
  due_date timestamptz,
  status text NOT NULL DEFAULT 'Open',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_requests TO authenticated;
GRANT ALL ON public.project_requests TO service_role;

CREATE TABLE public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder text NOT NULL DEFAULT 'Other',
  name text NOT NULL,
  uploaded_by_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  uploaded_by uuid,
  version integer NOT NULL DEFAULT 1,
  visibility text NOT NULL DEFAULT 'All Partners',
  mime text,
  size_bytes integer,
  url text,
  storage_path text,
  comments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_documents TO authenticated;
GRANT ALL ON public.project_documents TO service_role;

CREATE TABLE public.project_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  author_user_id uuid,
  author_name text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  mentions text[] NOT NULL DEFAULT '{}',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  reactions jsonb NOT NULL DEFAULT '{}'::jsonb,
  replies jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_discussions TO authenticated;
GRANT ALL ON public.project_discussions TO service_role;

CREATE TABLE public.project_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  meeting_date date NOT NULL DEFAULT current_date,
  meeting_time text NOT NULL DEFAULT '10:00',
  participants text[] NOT NULL DEFAULT '{}',
  link text,
  agenda text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  action_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_meetings TO authenticated;
GRANT ALL ON public.project_meetings TO service_role;

CREATE TABLE public.project_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type text NOT NULL,
  actor_org_id uuid REFERENCES public.orgs(id) ON DELETE SET NULL,
  actor_user_id uuid,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.project_activity TO authenticated;
GRANT ALL ON public.project_activity TO service_role;

CREATE INDEX idx_project_partners_org ON public.project_partners(org_id);
CREATE INDEX idx_project_requests_assigned ON public.project_requests(assigned_org_id);
CREATE INDEX idx_project_requests_project ON public.project_requests(project_id);
CREATE INDEX idx_project_documents_project ON public.project_documents(project_id);
CREATE INDEX idx_project_discussions_project ON public.project_discussions(project_id);
CREATE INDEX idx_project_meetings_project ON public.project_meetings(project_id);
CREATE INDEX idx_project_activity_project ON public.project_activity(project_id);

-- ---------- helpers ----------
CREATE OR REPLACE FUNCTION public.is_project_partner(_user uuid, _project uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_partners pp
    JOIN public.org_members m ON m.org_id = pp.org_id
    WHERE pp.project_id = _project AND m.user_id = _user
  )
$$;

CREATE OR REPLACE FUNCTION public.project_permission(_user uuid, _project uuid, _key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_partners pp
    JOIN public.org_members m ON m.org_id = pp.org_id
    WHERE pp.project_id = _project
      AND m.user_id = _user
      AND coalesce((pp.permissions ->> _key)::boolean, false)
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_project_partner(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.project_permission(uuid, uuid, text) TO authenticated, anon;

-- ---------- updated_at triggers ----------
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER project_requests_updated_at BEFORE UPDATE ON public.project_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER project_discussions_updated_at BEFORE UPDATE ON public.project_discussions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER project_meetings_updated_at BEFORE UPDATE ON public.project_meetings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------- RLS ----------
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects readable by authenticated" ON public.projects
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "projects insert by org editors" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (public.user_can_edit(auth.uid(), owner_org_id) AND created_by = auth.uid());
CREATE POLICY "projects update by partners with edit" ON public.projects
  FOR UPDATE TO authenticated
  USING (public.project_permission(auth.uid(), id, 'edit'))
  WITH CHECK (public.project_permission(auth.uid(), id, 'edit'));
CREATE POLICY "projects delete by owner org" ON public.projects
  FOR DELETE TO authenticated USING (public.user_can_manage(auth.uid(), owner_org_id));

CREATE POLICY "partners readable by authenticated" ON public.project_partners
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "partners insert by inviter or owner" ON public.project_partners
  FOR INSERT TO authenticated WITH CHECK (
    public.project_permission(auth.uid(), project_id, 'invite')
    OR EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND public.user_can_edit(auth.uid(), p.owner_org_id))
  );
CREATE POLICY "partners update by inviter" ON public.project_partners
  FOR UPDATE TO authenticated
  USING (public.project_permission(auth.uid(), project_id, 'invite'))
  WITH CHECK (public.project_permission(auth.uid(), project_id, 'invite'));
CREATE POLICY "partners delete by inviter" ON public.project_partners
  FOR DELETE TO authenticated USING (public.project_permission(auth.uid(), project_id, 'invite'));

CREATE POLICY "requests readable by authenticated" ON public.project_requests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "requests insert by permitted partners" ON public.project_requests
  FOR INSERT TO authenticated WITH CHECK (public.project_permission(auth.uid(), project_id, 'createRequests'));
CREATE POLICY "requests update by partners" ON public.project_requests
  FOR UPDATE TO authenticated
  USING (public.is_project_partner(auth.uid(), project_id))
  WITH CHECK (public.is_project_partner(auth.uid(), project_id));

CREATE POLICY "documents readable by authenticated" ON public.project_documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents insert by uploaders" ON public.project_documents
  FOR INSERT TO authenticated WITH CHECK (public.project_permission(auth.uid(), project_id, 'upload'));
CREATE POLICY "documents update by uploaders" ON public.project_documents
  FOR UPDATE TO authenticated
  USING (public.project_permission(auth.uid(), project_id, 'upload'))
  WITH CHECK (public.project_permission(auth.uid(), project_id, 'upload'));
CREATE POLICY "documents delete by uploader" ON public.project_documents
  FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

CREATE POLICY "discussions readable by authenticated" ON public.project_discussions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "discussions insert by commenters" ON public.project_discussions
  FOR INSERT TO authenticated WITH CHECK (
    public.project_permission(auth.uid(), project_id, 'comment') AND author_user_id = auth.uid()
  );
CREATE POLICY "discussions update by partners" ON public.project_discussions
  FOR UPDATE TO authenticated
  USING (public.is_project_partner(auth.uid(), project_id))
  WITH CHECK (public.is_project_partner(auth.uid(), project_id));

CREATE POLICY "meetings readable by authenticated" ON public.project_meetings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "meetings insert by partners" ON public.project_meetings
  FOR INSERT TO authenticated WITH CHECK (public.is_project_partner(auth.uid(), project_id));
CREATE POLICY "meetings update by partners" ON public.project_meetings
  FOR UPDATE TO authenticated
  USING (public.is_project_partner(auth.uid(), project_id))
  WITH CHECK (public.is_project_partner(auth.uid(), project_id));

CREATE POLICY "activity readable by authenticated" ON public.project_activity
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "activity insert by partners" ON public.project_activity
  FOR INSERT TO authenticated WITH CHECK (public.is_project_partner(auth.uid(), project_id));