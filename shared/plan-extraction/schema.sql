-- SmartChantier AI — Plan Extraction (PostgreSQL / Supabase ready)
-- Multi-tenant SaaS schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  UNIQUE (tenant_id, user_id)
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client TEXT,
  address TEXT,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  budget_percent NUMERIC(5,2) DEFAULT 0,
  delay_percent NUMERIC(5,2) DEFAULT 0,
  currency TEXT DEFAULT 'MAD',
  vat_rate NUMERIC(5,2) DEFAULT 20,
  margin_rate NUMERIC(5,2) DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  contact TEXT,
  email TEXT,
  phone TEXT
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  color TEXT,
  name TEXT NOT NULL,
  unit TEXT NOT NULL DEFAULT 'm²',
  unit_price NUMERIC(12,2) DEFAULT 0,
  stock NUMERIC(12,2) DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  legend_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plan_extraction_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_kind TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error_message TEXT,
  provider TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  extraction_id UUID NOT NULL REFERENCES plan_extraction_jobs(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  surface_sqm NUMERIC(12,2) NOT NULL DEFAULT 0,
  floor_reference TEXT,
  floor_material_id UUID REFERENCES materials(id),
  wall_material_id UUID REFERENCES materials(id),
  ceiling_material_id UUID REFERENCES materials(id),
  technical_notes JSONB DEFAULT '[]'
);

CREATE TABLE floor_coverings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  surface_sqm NUMERIC(12,2) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL
);

CREATE TABLE wall_coverings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  surface_sqm NUMERIC(12,2) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL
);

CREATE TABLE ceilings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  surface_sqm NUMERIC(12,2) NOT NULL,
  quantity NUMERIC(12,2) NOT NULL
);

CREATE TABLE colored_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  extraction_id UUID NOT NULL REFERENCES plan_extraction_jobs(id) ON DELETE CASCADE,
  color_hex TEXT NOT NULL,
  color_label TEXT NOT NULL,
  zone_name TEXT NOT NULL,
  material_name TEXT,
  surface_sqm NUMERIC(12,2) NOT NULL,
  legend_code TEXT,
  room_id UUID REFERENCES rooms(id)
);

CREATE TABLE devis_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  extraction_id UUID NOT NULL REFERENCES plan_extraction_jobs(id) ON DELETE CASCADE,
  lines JSONB NOT NULL,
  subtotal_ht NUMERIC(14,2) NOT NULL,
  margin_amount NUMERIC(14,2) NOT NULL,
  vat_amount NUMERIC(14,2) NOT NULL,
  total_ttc NUMERIC(14,2) NOT NULL,
  currency TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE material_change_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  old_material_id UUID NOT NULL REFERENCES materials(id),
  new_material_id UUID NOT NULL REFERENCES materials(id),
  quantity_delta NUMERIC(12,2) NOT NULL,
  price_delta NUMERIC(14,2) NOT NULL,
  budget_impact NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE plan_photo_comparisons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  plan_job_id UUID NOT NULL REFERENCES plan_extraction_jobs(id),
  photo_id TEXT NOT NULL,
  completion_percent NUMERIC(5,2) NOT NULL,
  difference_percent NUMERIC(5,2) NOT NULL,
  risk_score NUMERIC(5,2) NOT NULL,
  missing_work JSONB DEFAULT '[]',
  wrong_materials JSONB DEFAULT '[]',
  delays JSONB DEFAULT '[]',
  finished_zones JSONB DEFAULT '[]',
  alerts JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_tenant ON projects(tenant_id);
CREATE INDEX idx_materials_project ON materials(project_id);
CREATE INDEX idx_rooms_extraction ON rooms(extraction_id);
CREATE INDEX idx_jobs_project ON plan_extraction_jobs(project_id);
