-- Technical sheets + storage bucket

create table if not exists public.technical_sheets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  product_name text not null,
  reference text,
  brand text,
  supplier text,
  payload jsonb not null default '{}',
  pdf_storage_path text,
  confidence text default 'a_verifier',
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_technical_sheets_project on public.technical_sheets(project_id);

alter table public.technical_sheets enable row level security;
create policy "technical_sheets_authenticated" on public.technical_sheets
  for all using (auth.role() = 'authenticated');

-- Storage bucket (create in Supabase dashboard or via API)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);
