import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { dataStore } from '@/services/dataStore';
import { chantierToDbProject, dbProjectToChantier, dbSupplierToSupplier } from './mappers';
import { localSaasDb } from './localStore';
import type {
  DashboardMetrics,
  DbProject,
  DbPurchaseOrder,
  DbQuotation,
  DbSupplier,
  DbTechnicalSheet,
} from './types';
import type { Chantier, Supplier } from '@/types';

export function isSaasDatabaseLive(): boolean {
  return isSupabaseConfigured;
}

function newId(): string {
  return crypto.randomUUID();
}

async function sbSelect<T>(table: string): Promise<T[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as T[];
}

async function sbInsert<T>(table: string, row: Record<string, unknown>): Promise<T> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data as T;
}

async function sbUpdate(table: string, id: string, row: Record<string, unknown>): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { error } = await supabase.from(table).update(row).eq('id', id);
  if (error) throw error;
}

async function sbDelete(table: string, id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase non configuré');
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

/** Seed local DB from demo chantiers once (offline SaaS mode). */
export function seedLocalFromDemoIfEmpty(): void {
  if (localSaasDb.isSeeded() && localSaasDb.projects.list().length > 0) return;
  dataStore.init();
  const projects: DbProject[] = dataStore.getChantiers().map((c) => ({
    id: c.id,
    name: c.name,
    client_name: c.client,
    address: c.address,
    city: 'Nice',
    manager_id: null,
    budget_planned: c.budgetPlanned,
    budget_consumed: c.budgetConsumed,
    progress: c.progress,
    status: c.status,
    start_date: c.startDate,
    end_date: c.endDate,
    created_by: null,
  }));
  const suppliers: DbSupplier[] = dataStore.getSuppliers().map((s) => ({
    id: s.id,
    name: s.name,
    category: s.materials[0] ?? 'BTP',
    phone: s.phone,
    email: s.email,
    website: null,
    city: s.address,
    rating: s.performanceScore,
  }));
  localSaasDb.projects.save(projects);
  localSaasDb.suppliers.save(suppliers);
  localSaasDb.markSeeded();
}

// ——— Projects ———

export async function listProjects(): Promise<DbProject[]> {
  if (isSupabaseConfigured) return sbSelect<DbProject>('projects');
  seedLocalFromDemoIfEmpty();
  return localSaasDb.projects.list();
}

export async function listChantiers(): Promise<Chantier[]> {
  const rows = await listProjects();
  return rows.map(dbProjectToChantier);
}

export async function createProject(input: Partial<Chantier> & { name: string }, userId?: string): Promise<Chantier> {
  const row = {
    id: newId(),
    ...chantierToDbProject(input, userId),
    updated_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbProject>('projects', row);
    return dbProjectToChantier(created);
  }
  const list = localSaasDb.projects.list();
  const full = { ...row, created_at: new Date().toISOString() } as DbProject;
  localSaasDb.projects.save([full, ...list]);
  return dbProjectToChantier(full);
}

export async function updateProject(id: string, input: Partial<Chantier>): Promise<Chantier> {
  const patch = chantierToDbProject({ ...input, name: input.name ?? '' });
  if (isSupabaseConfigured) {
    await sbUpdate('projects', id, { ...patch, updated_at: new Date().toISOString() });
    const rows = await listProjects();
    const found = rows.find((p) => p.id === id);
    if (!found) throw new Error('Projet introuvable');
    return dbProjectToChantier({ ...found, ...patch } as DbProject);
  }
  const list = localSaasDb.projects.list().map((p) =>
    p.id === id ? ({ ...p, ...patch, updated_at: new Date().toISOString() } as DbProject) : p
  );
  localSaasDb.projects.save(list);
  const found = list.find((p) => p.id === id)!;
  return dbProjectToChantier(found);
}

export async function deleteProject(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await sbDelete('projects', id);
    return;
  }
  localSaasDb.projects.save(localSaasDb.projects.list().filter((p) => p.id !== id));
}

// ——— Suppliers ———

export async function listSuppliers(): Promise<Supplier[]> {
  let rows: DbSupplier[];
  if (isSupabaseConfigured) {
    rows = await sbSelect<DbSupplier>('suppliers');
  } else {
    seedLocalFromDemoIfEmpty();
    rows = localSaasDb.suppliers.list();
  }
  return rows.map(dbSupplierToSupplier);
}

export async function createSupplier(input: {
  name: string;
  category?: string;
  phone?: string;
  email?: string;
  city?: string;
  rating?: number;
}): Promise<Supplier> {
  const row: DbSupplier = {
    id: newId(),
    name: input.name,
    category: input.category ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: null,
    city: input.city ?? null,
    rating: input.rating ?? 80,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbSupplier>('suppliers', row);
    return dbSupplierToSupplier(created);
  }
  localSaasDb.suppliers.save([row, ...localSaasDb.suppliers.list()]);
  return dbSupplierToSupplier(row);
}

export async function deleteSupplier(id: string): Promise<void> {
  if (isSupabaseConfigured) await sbDelete('suppliers', id);
  else localSaasDb.suppliers.save(localSaasDb.suppliers.list().filter((s) => s.id !== id));
}

// ——— Quotations ———

export async function listQuotations(): Promise<DbQuotation[]> {
  if (isSupabaseConfigured) return sbSelect<DbQuotation>('quotations');
  return localSaasDb.quotations.list();
}

export async function createQuotation(input: {
  projectId?: string;
  number: string;
  clientName: string;
  siteAddress?: string;
  city?: string;
  subtotalHt: number;
  tvaAmount: number;
  totalTtc: number;
  payload?: Record<string, unknown>;
  userId?: string;
}): Promise<DbQuotation> {
  const row: DbQuotation = {
    id: newId(),
    project_id: input.projectId ?? null,
    number: input.number,
    client_name: input.clientName,
    site_address: input.siteAddress ?? null,
    city: input.city ?? null,
    status: 'draft',
    subtotal_ht: input.subtotalHt,
    tva_amount: input.tvaAmount,
    total_ttc: input.totalTtc,
    payload: input.payload ?? {},
    created_by: input.userId ?? null,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) return sbInsert<DbQuotation>('quotations', row);
  localSaasDb.quotations.save([row, ...localSaasDb.quotations.list()]);
  return row;
}

export async function deleteQuotation(id: string): Promise<void> {
  if (isSupabaseConfigured) await sbDelete('quotations', id);
  else localSaasDb.quotations.save(localSaasDb.quotations.list().filter((q) => q.id !== id));
}

// ——— Purchase orders ———

export async function listPurchaseOrders(): Promise<DbPurchaseOrder[]> {
  if (isSupabaseConfigured) return sbSelect<DbPurchaseOrder>('purchase_orders');
  return localSaasDb.purchaseOrders.list();
}

export async function createPurchaseOrder(input: {
  projectId?: string;
  number: string;
  supplierId?: string;
  totalHt: number;
  totalTtc: number;
  payload?: Record<string, unknown>;
  userId?: string;
}): Promise<DbPurchaseOrder> {
  const row: DbPurchaseOrder = {
    id: newId(),
    project_id: input.projectId ?? null,
    number: input.number,
    supplier_id: input.supplierId ?? null,
    status: 'draft',
    total_ht: input.totalHt,
    total_ttc: input.totalTtc,
    payload: input.payload ?? {},
    created_by: input.userId ?? null,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) return sbInsert<DbPurchaseOrder>('purchase_orders', row);
  localSaasDb.purchaseOrders.save([row, ...localSaasDb.purchaseOrders.list()]);
  return row;
}

export async function deletePurchaseOrder(id: string): Promise<void> {
  if (isSupabaseConfigured) await sbDelete('purchase_orders', id);
  else localSaasDb.purchaseOrders.save(localSaasDb.purchaseOrders.list().filter((p) => p.id !== id));
}

// ——— Technical sheets ———

export async function listTechnicalSheets(): Promise<DbTechnicalSheet[]> {
  if (isSupabaseConfigured) return sbSelect<DbTechnicalSheet>('technical_sheets');
  return localSaasDb.technicalSheets.list();
}

// ——— Dashboard ———

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const [projects, quotations, purchaseOrders, suppliers] = await Promise.all([
    listProjects(),
    listQuotations(),
    listPurchaseOrders(),
    listSuppliers(),
  ]);

  const active = projects.filter((p) => p.status === 'active').length;
  const delayed = projects.filter((p) => p.status === 'delayed').length;
  const atRisk = projects.filter((p) => Number(p.budget_consumed) > Number(p.budget_planned) * 0.95).length;
  const totalBudgetPlanned = projects.reduce((s, p) => s + Number(p.budget_planned), 0);
  const totalBudgetConsumed = projects.reduce((s, p) => s + Number(p.budget_consumed), 0);
  const totals = quotations.map((q) => Number(q.total_ttc)).filter((n) => n > 0);
  const avgQuotationTtc = totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  const expensiveQuotations = quotations.filter((q) => avgQuotationTtc > 0 && Number(q.total_ttc) > avgQuotationTtc * 1.25).length;

  return {
    activeProjects: active,
    delayedProjects: delayed,
    atRiskProjects: atRisk,
    totalBudgetPlanned,
    totalBudgetConsumed,
    quotationsCount: quotations.length,
    purchaseOrdersCount: purchaseOrders.length,
    suppliersCount: suppliers.length,
    openTasks: 0,
    expensiveQuotations,
    avgQuotationTtc,
    dataSource: isSupabaseConfigured ? 'supabase' : 'local',
  };
}

export type ExpensiveQuotationAlert = {
  quotation: DbQuotation;
  percentAboveAvg: number;
  cheaperAlternativeHint: string;
};

export async function detectExpensiveQuotations(): Promise<ExpensiveQuotationAlert[]> {
  const quotations = await listQuotations();
  const totals = quotations.map((q) => Number(q.total_ttc)).filter((n) => n > 0);
  if (!totals.length) return [];
  const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
  return quotations
    .filter((q) => Number(q.total_ttc) > avg * 1.2)
    .map((q) => ({
      quotation: q,
      percentAboveAvg: Math.round(((Number(q.total_ttc) - avg) / avg) * 100),
      cheaperAlternativeHint:
        'Comparez via Assistant Achat IA — recherche fournisseurs et alternatives économiques.',
    }))
    .sort((a, b) => Number(b.quotation.total_ttc) - Number(a.quotation.total_ttc));
}
