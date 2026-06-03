export type DbProject = {
  id: string;
  name: string;
  client_name: string | null;
  address: string | null;
  city: string | null;
  manager_id: string | null;
  budget_planned: number;
  budget_consumed: number;
  progress: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at?: string;
  updated_at?: string;
};

export type DbSupplier = {
  id: string;
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  city: string | null;
  rating: number | null;
  created_at?: string;
};

export type DbQuotation = {
  id: string;
  project_id: string | null;
  number: string;
  client_name: string | null;
  site_address: string | null;
  city: string | null;
  status: string;
  subtotal_ht: number;
  tva_amount: number;
  total_ttc: number;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at?: string;
};

export type DbPurchaseOrder = {
  id: string;
  project_id: string | null;
  number: string;
  supplier_id: string | null;
  status: string;
  total_ht: number;
  total_ttc: number;
  payload: Record<string, unknown>;
  created_by: string | null;
  created_at?: string;
};

export type DbTechnicalSheet = {
  id: string;
  project_id: string | null;
  product_name: string;
  reference: string | null;
  brand: string | null;
  supplier: string | null;
  payload: Record<string, unknown>;
  pdf_storage_path: string | null;
  confidence: string;
  created_at?: string;
};

export type DashboardMetrics = {
  activeProjects: number;
  delayedProjects: number;
  atRiskProjects: number;
  totalBudgetPlanned: number;
  totalBudgetConsumed: number;
  quotationsCount: number;
  purchaseOrdersCount: number;
  suppliersCount: number;
  openTasks: number;
  expensiveQuotations: number;
  avgQuotationTtc: number;
  dataSource: 'supabase' | 'local';
};
