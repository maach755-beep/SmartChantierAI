-- Phase 2: employees, attendance, photos, albums

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade text,
  role_type text default 'worker',
  team text,
  project_id uuid references public.projects(id) on delete set null,
  phone text,
  email text,
  active boolean default true,
  hours_this_week smallint default 40,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references public.employees(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  work_date date not null default current_date,
  check_in timestamptz,
  check_out timestamptz,
  present boolean default true,
  absent boolean default false,
  sick boolean default false,
  leave boolean default false,
  hours_worked numeric(5,2) default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.photo_albums (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  description text default '',
  cover_photo_id uuid,
  photo_ids jsonb default '[]',
  created_at timestamptz not null default now()
);

create table if not exists public.site_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  album_id uuid references public.photo_albums(id) on delete set null,
  room text default '',
  storage_path text,
  url text,
  caption text,
  phase text default 'progress',
  uploaded_by text,
  file_size text,
  tags jsonb default '[]',
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists metadata jsonb default '{}';

create index if not exists idx_attendance_date on public.attendance_records(work_date);
create index if not exists idx_photos_project on public.site_photos(project_id);
create index if not exists idx_employees_project on public.employees(project_id);

alter table public.employees enable row level security;
alter table public.attendance_records enable row level security;
alter table public.photo_albums enable row level security;
alter table public.site_photos enable row level security;

create policy "employees_authenticated" on public.employees for all using (auth.role() = 'authenticated');
create policy "attendance_authenticated" on public.attendance_records for all using (auth.role() = 'authenticated');
create policy "photo_albums_authenticated" on public.photo_albums for all using (auth.role() = 'authenticated');
create policy "site_photos_authenticated" on public.site_photos for all using (auth.role() = 'authenticated');
