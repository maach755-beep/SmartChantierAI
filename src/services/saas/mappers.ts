import type { Chantier, Supplier } from '@/types';
import type { DbProject, DbSupplier } from './types';

export function dbProjectToChantier(row: DbProject): Chantier {
  const status =
    row.status === 'delayed' || row.status === 'at_risk' || row.status === 'active' || row.status === 'completed'
      ? row.status
      : row.progress < 100 && row.budget_consumed > row.budget_planned * 0.95
        ? 'at_risk'
        : 'active';

  return {
    id: row.id,
    name: row.name,
    client: row.client_name ?? '—',
    address: row.address ?? '',
    manager: row.manager_id ?? '—',
    engineer: '',
    startDate: row.start_date ?? new Date().toISOString().slice(0, 10),
    endDate: row.end_date ?? new Date().toISOString().slice(0, 10),
    budgetPlanned: Number(row.budget_planned) || 0,
    budgetConsumed: Number(row.budget_consumed) || 0,
    progress: Number(row.progress) || 0,
    delayDays: status === 'delayed' ? 7 : 0,
    riskLevel:
      row.budget_consumed > row.budget_planned
        ? 'red'
        : row.budget_consumed > row.budget_planned * 0.9
          ? 'orange'
          : 'green',
    status: status as Chantier['status'],
  };
}

export function chantierToDbProject(input: Partial<Chantier> & { name: string }, userId?: string): Partial<DbProject> {
  return {
    name: input.name,
    client_name: input.client,
    address: input.address,
    city: '',
    budget_planned: input.budgetPlanned ?? 0,
    budget_consumed: input.budgetConsumed ?? 0,
    progress: input.progress ?? 0,
    status: input.status ?? 'active',
    start_date: input.startDate,
    end_date: input.endDate,
    created_by: userId,
  };
}

export function dbSupplierToSupplier(row: DbSupplier): Supplier {
  return {
    id: row.id,
    name: row.name,
    contact: row.category ?? '—',
    phone: row.phone ?? '',
    email: row.email ?? '',
    address: row.city ?? '',
    materials: row.category ? [row.category] : [],
    ordersCount: 0,
    lateDeliveries: 0,
    pendingMaterials: 0,
    performanceScore: row.rating ?? 75,
  };
}
