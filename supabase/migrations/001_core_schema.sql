-- SmartChantierAI — core production schema
-- Run in Supabase SQL editor or via CLI

create extension if not exists "uuid-ossp";

create type public.user_role as enum (
  'admin',
  'project_manager',
  'site_manager',
  'client'
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text not null default '',
  role public.user_role not null default 'client',
  company_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_name text,
  address text,
  city text,
  manager_id uuid references public.users(id),
  budget_planned numeric(14,2) default 0,
  budget_consumed numeric(14,2) default 0,
  progress smallint default 0 check (progress between 0 and 100),
  status text default 'active',
  start_date date,
  end_date date,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  description text,
  assignee_id uuid references public.users(id),
  status text default 'todo',
  priority text default 'medium',
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  phone text,
  email text,
  website text,
  city text,
  rating smallint,
  created_at timestamptz not null default now()
);

create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  name text not null,
  reference text,
  brand text,
  unit text default 'm²',
  quantity numeric(12,3) default 0,
  unit_price_ht numeric(12,2),
  supplier_id uuid references public.suppliers(id),
  created_at timestamptz not null default now()
);

create table if not exists public.quotations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  client_name text,
  site_address text,
  city text,
  status text default 'draft',
  subtotal_ht numeric(14,2) default 0,
  tva_amount numeric(14,2) default 0,
  total_ttc numeric(14,2) default 0,
  payload jsonb default '{}',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  supplier_id uuid references public.suppliers(id),
  status text default 'draft',
  total_ht numeric(14,2) default 0,
  total_ttc numeric(14,2) default 0,
  payload jsonb default '{}',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  number text not null,
  supplier_id uuid references public.suppliers(id),
  amount_ht numeric(14,2) default 0,
  amount_ttc numeric(14,2) default 0,
  status text default 'pending',
  ocr_payload jsonb,
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text,
  type text default 'info',
  read boolean default false,
  href text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_materials_project on public.materials(project_id);
create index if not exists idx_quotations_project on public.quotations(project_id);
create index if not exists idx_notifications_user on public.notifications(user_id);

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.suppliers enable row level security;
alter table public.materials enable row level security;
alter table public.quotations enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.invoices enable row level security;
alter table public.notifications enable row level security;

-- Authenticated users can read own profile; admins manage all (simplified policies — tighten in prod)
create policy "users_select_own" on public.users for select using (auth.uid() = id);
create policy "users_update_own" on public.users for update using (auth.uid() = id);

create policy "projects_authenticated" on public.projects for all using (auth.role() = 'authenticated');
create policy "tasks_authenticated" on public.tasks for all using (auth.role() = 'authenticated');
create policy "suppliers_authenticated" on public.suppliers for all using (auth.role() = 'authenticated');
create policy "materials_authenticated" on public.materials for all using (auth.role() = 'authenticated');
create policy "quotations_authenticated" on public.quotations for all using (auth.role() = 'authenticated');
create policy "purchase_orders_authenticated" on public.purchase_orders for all using (auth.role() = 'authenticated');
create policy "invoices_authenticated" on public.invoices for all using (auth.role() = 'authenticated');
create policy "notifications_own" on public.notifications for all using (auth.uid() = user_id);
