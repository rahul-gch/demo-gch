
-- =========================
-- Enums
-- =========================
do $$ begin
  create type public.org_role as enum ('owner', 'admin', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.doc_category as enum ('certification', 'evidence', 'org_document');
exception when duplicate_object then null; end $$;

-- =========================
-- Tables
-- =========================
create table if not exists public.orgs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  type text not null default 'brand',          -- brand | supplier | verifier | regulator
  country text,
  region text,
  size text,                                    -- S | M | L
  tier int,
  description text,
  website text,
  certifications text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade, -- nullable for seeded ghosts
  display_name text not null,
  title text,
  avatar_url text,
  role public.org_role not null default 'viewer',
  invited_by uuid references auth.users(id) on delete set null,
  joined_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index if not exists org_members_org_idx on public.org_members(org_id);
create index if not exists org_members_user_idx on public.org_members(user_id);

create table if not exists public.org_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  category public.doc_category not null,
  title text not null,
  description text,
  storage_path text not null,
  mime_type text,
  size_bytes int,
  created_at timestamptz not null default now()
);

create index if not exists org_documents_org_idx on public.org_documents(org_id);
create index if not exists org_documents_category_idx on public.org_documents(category);

-- =========================
-- GRANTs (Data API access)
-- =========================
grant select on public.orgs to anon, authenticated;
grant insert, update, delete on public.orgs to authenticated;
grant all on public.orgs to service_role;

grant select, insert, update, delete on public.org_members to authenticated;
grant all on public.org_members to service_role;

grant select, insert, update, delete on public.org_documents to authenticated;
grant all on public.org_documents to service_role;

-- =========================
-- updated_at trigger
-- =========================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists orgs_set_updated_at on public.orgs;
create trigger orgs_set_updated_at before update on public.orgs
  for each row execute function public.set_updated_at();

-- =========================
-- Security-definer helpers (avoid RLS recursion)
-- =========================
create or replace function public.user_org_role(_user uuid, _org uuid)
returns public.org_role
language sql stable security definer set search_path = public
as $$
  select role from public.org_members
  where user_id = _user and org_id = _org
  limit 1
$$;

create or replace function public.is_org_member(_user uuid, _org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.org_members
    where user_id = _user and org_id = _org
  )
$$;

create or replace function public.user_can_edit(_user uuid, _org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.user_org_role(_user, _org) in ('owner', 'admin', 'editor')
$$;

create or replace function public.user_can_manage(_user uuid, _org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.user_org_role(_user, _org) in ('owner', 'admin')
$$;

create or replace function public.user_is_owner(_user uuid, _org uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.user_org_role(_user, _org) = 'owner'
$$;

-- =========================
-- RLS
-- =========================
alter table public.orgs enable row level security;
alter table public.org_members enable row level security;
alter table public.org_documents enable row level security;

-- orgs
drop policy if exists "orgs readable by all" on public.orgs;
create policy "orgs readable by all" on public.orgs
  for select using (true);

drop policy if exists "orgs editable by managers" on public.orgs;
create policy "orgs editable by managers" on public.orgs
  for update using (public.user_can_edit(auth.uid(), id));

-- org_members
drop policy if exists "members readable by members" on public.org_members;
create policy "members readable by members" on public.org_members
  for select using (public.is_org_member(auth.uid(), org_id));

drop policy if exists "members insert by managers" on public.org_members;
create policy "members insert by managers" on public.org_members
  for insert with check (public.user_can_manage(auth.uid(), org_id));

drop policy if exists "members update by managers" on public.org_members;
create policy "members update by managers" on public.org_members
  for update using (public.user_can_manage(auth.uid(), org_id));

drop policy if exists "members delete by managers" on public.org_members;
create policy "members delete by managers" on public.org_members
  for delete using (public.user_can_manage(auth.uid(), org_id));

-- org_documents
drop policy if exists "docs read members or cert" on public.org_documents;
create policy "docs read members or cert" on public.org_documents
  for select using (
    category = 'certification'
    or public.is_org_member(auth.uid(), org_id)
  );

drop policy if exists "docs insert by editors" on public.org_documents;
create policy "docs insert by editors" on public.org_documents
  for insert with check (
    public.user_can_edit(auth.uid(), org_id)
    and uploaded_by = auth.uid()
  );

drop policy if exists "docs delete by uploader or manager" on public.org_documents;
create policy "docs delete by uploader or manager" on public.org_documents
  for delete using (
    uploaded_by = auth.uid()
    or public.user_can_manage(auth.uid(), org_id)
  );

-- =========================
-- Storage bucket + policies
-- =========================
insert into storage.buckets (id, name, public)
values ('org-docs', 'org-docs', false)
on conflict (id) do nothing;

-- Path convention: {org_id}/{filename}
drop policy if exists "org-docs read members" on storage.objects;
create policy "org-docs read members" on storage.objects
  for select using (
    bucket_id = 'org-docs'
    and (
      public.is_org_member(auth.uid(), ((storage.foldername(name))[1])::uuid)
      or exists (
        select 1 from public.org_documents d
        where d.storage_path = name and d.category = 'certification'
      )
    )
  );

drop policy if exists "org-docs write editors" on storage.objects;
create policy "org-docs write editors" on storage.objects
  for insert with check (
    bucket_id = 'org-docs'
    and public.user_can_edit(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "org-docs delete managers" on storage.objects;
create policy "org-docs delete managers" on storage.objects
  for delete using (
    bucket_id = 'org-docs'
    and public.user_can_manage(auth.uid(), ((storage.foldername(name))[1])::uuid)
  );
