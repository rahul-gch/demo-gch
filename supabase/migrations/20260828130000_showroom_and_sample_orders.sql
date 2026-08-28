-- Migration: Showroom Products & Sample Orders
-- Provides a B2B product catalogue per organization and sample ordering between connected partners.

-- 1. Helper function: Are two orgs connected via conversations or shared projects
create or replace function public.orgs_are_connected(_org_a uuid, _org_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when _org_a is null or _org_b is null then false
    when _org_a = _org_b then true
    -- Check direct conversation between the two organizations
    when exists (
      select 1
      from public.conversation_participants cp1
      join public.conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
      where cp1.org_id = _org_a and cp2.org_id = _org_b
    ) then true
    -- Check project partnership (org_a is owner, org_b is partner)
    when exists (
      select 1
      from public.projects p
      join public.project_partners pp on pp.project_id = p.id
      where (p.owner_org_id = _org_a and pp.partner_org_id = _org_b)
         or (p.owner_org_id = _org_b and pp.partner_org_id = _org_a)
    ) then true
    else false
  end;
$$;

grant execute on function public.orgs_are_connected(uuid, uuid) to authenticated, service_role;

-- 2. Showroom products table
create table if not exists public.showroom_products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.orgs(id) on delete cascade,
  name text not null,
  description text,
  images jsonb not null default '[]'::jsonb,
  materials text[] not null default '{}'::text[],
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_showroom_products_org on public.showroom_products(org_id);
create index if not exists idx_showroom_products_active on public.showroom_products(is_active);

alter table public.showroom_products enable row level security;

-- Policies for showroom_products
create policy "showroom_products_select" on public.showroom_products
  for select
  using (
    public.is_org_member(auth.uid(), org_id)
    or exists (
      select 1
      from public.org_members om
      where om.user_id = auth.uid()
        and public.orgs_are_connected(om.org_id, showroom_products.org_id)
    )
  );

create policy "showroom_products_insert" on public.showroom_products
  for insert
  with check (public.user_can_edit(auth.uid(), org_id));

create policy "showroom_products_update" on public.showroom_products
  for update
  using (public.user_can_edit(auth.uid(), org_id));

create policy "showroom_products_delete" on public.showroom_products
  for delete
  using (public.user_can_edit(auth.uid(), org_id));

grant all on public.showroom_products to authenticated, service_role;

-- 3. Sample orders table
create table if not exists public.sample_orders (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.showroom_products(id) on delete set null,
  seller_org_id uuid not null references public.orgs(id) on delete cascade,
  buyer_org_id uuid not null references public.orgs(id) on delete cascade,
  requested_by uuid not null,
  quantity integer not null default 1,
  material text,
  notes text,
  shipping_address text not null,
  needed_by date,
  status text not null default 'requested' check (status in ('requested', 'accepted', 'declined', 'completed', 'withdrawn', 'cancelled', 'shipped', 'delivered')),
  conversation_id uuid references public.conversations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sample_orders_seller on public.sample_orders(seller_org_id, status);
create index if not exists idx_sample_orders_buyer on public.sample_orders(buyer_org_id, status);
create index if not exists idx_sample_orders_product on public.sample_orders(product_id);

alter table public.sample_orders enable row level security;

-- Policies for sample_orders
create policy "sample_orders_select" on public.sample_orders
  for select
  using (
    public.is_org_member(auth.uid(), buyer_org_id)
    or public.is_org_member(auth.uid(), seller_org_id)
  );

create policy "sample_orders_insert" on public.sample_orders
  for insert
  with check (
    public.is_org_member(auth.uid(), buyer_org_id)
    and public.orgs_are_connected(buyer_org_id, seller_org_id)
  );

create policy "sample_orders_update" on public.sample_orders
  for update
  using (
    public.is_org_member(auth.uid(), seller_org_id)
    or (
      public.is_org_member(auth.uid(), buyer_org_id)
      and status in ('withdrawn', 'cancelled', 'requested')
    )
  );

create policy "sample_orders_delete" on public.sample_orders
  for delete
  using (
    public.user_is_owner(auth.uid(), buyer_org_id)
    or public.user_is_owner(auth.uid(), seller_org_id)
  );

grant all on public.sample_orders to authenticated, service_role;

-- 4. Showroom storage bucket
insert into storage.buckets (id, name, public)
values ('showroom', 'showroom', false)
on conflict (id) do nothing;

create policy "showroom_storage_select" on storage.objects
  for select
  using (bucket_id = 'showroom' and auth.role() = 'authenticated');

create policy "showroom_storage_insert" on storage.objects
  for insert
  with check (bucket_id = 'showroom' and auth.role() = 'authenticated');

create policy "showroom_storage_update" on storage.objects
  for update
  using (bucket_id = 'showroom' and auth.role() = 'authenticated');

create policy "showroom_storage_delete" on storage.objects
  for delete
  using (bucket_id = 'showroom' and auth.role() = 'authenticated');
