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

export type DbTask = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  assignee_id: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  payload: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export type DbEmployee = {
  id: string;
  name: string;
  trade: string | null;
  role_type: string | null;
  team: string | null;
  project_id: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
  hours_this_week: number;
  created_at?: string;
};

export type DbAttendance = {
  id: string;
  employee_id: string | null;
  project_id: string | null;
  work_date: string;
  check_in: string | null;
  check_out: string | null;
  present: boolean;
  absent: boolean;
  sick: boolean;
  leave: boolean;
  hours_worked: number;
  created_at?: string;
  payload?: Record<string, unknown>;
};

export type DbSitePhoto = {
  id: string;
  project_id: string;
  album_id: string | null;
  room: string | null;
  storage_path: string | null;
  url: string | null;
  caption: string | null;
  phase: string;
  uploaded_by: string | null;
  file_size: string | null;
  tags: string[];
  created_at?: string;
};

export type DbPhotoAlbum = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  cover_photo_id: string | null;
  photo_ids: string[];
  created_at?: string;
};

export type DbMaterial = {
  id: string;
  project_id: string | null;
  name: string;
  reference: string | null;
  brand: string | null;
  unit: string;
  quantity: number;
  unit_price_ht: number | null;
  supplier_id: string | null;
  payload: Record<string, unknown>;
  created_at?: string;
};

export type DbNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string | null;
  type: string;
  read: boolean;
  href: string | null;
  metadata: Record<string, unknown>;
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
  completedTasks: number;
  overdueTasks: number;
  expensiveQuotations: number;
  avgQuotationTtc: number;
  presentToday: number;
  absentToday: number;
  workforceTotal: number;
  avgHealthScore: number;
  materialShortages: number;
  unreadNotifications: number;
  dataSource: 'supabase' | 'local';
};

export type SiteManagerInsight = {
  chantierId: string;
  chantierName: string;
  healthScore: number;
  healthLevel: 'green' | 'orange' | 'red';
  delayRisk: boolean;
  budgetOverrunRisk: boolean;
  predictedOverrunPercent: number;
  delayDays: number;
  actions: string[];
};
