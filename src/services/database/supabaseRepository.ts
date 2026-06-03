import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export type DbTable =
  | 'projects'
  | 'tasks'
  | 'suppliers'
  | 'materials'
  | 'quotations'
  | 'purchase_orders'
  | 'invoices'
  | 'users'
  | 'notifications';

async function selectAll<T>(table: DbTable, limit = 100): Promise<T[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.from(table).select('*').limit(limit);
  if (error) throw error;
  return (data ?? []) as T[];
}

async function insertRow<T extends Record<string, unknown>>(table: DbTable, row: T): Promise<T | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from(table).insert(row).select().single();
  if (error) throw error;
  return data as T;
}

export const db = {
  isEnabled: isSupabaseConfigured,
  projects: {
    list: () => selectAll<Record<string, unknown>>('projects'),
    create: (row: Record<string, unknown>) => insertRow('projects', row),
  },
  tasks: {
    list: () => selectAll<Record<string, unknown>>('tasks'),
    create: (row: Record<string, unknown>) => insertRow('tasks', row),
  },
  suppliers: {
    list: () => selectAll<Record<string, unknown>>('suppliers'),
  },
  materials: {
    list: () => selectAll<Record<string, unknown>>('materials'),
  },
  quotations: {
    list: () => selectAll<Record<string, unknown>>('quotations'),
    create: (row: Record<string, unknown>) => insertRow('quotations', row),
  },
  purchaseOrders: {
    list: () => selectAll<Record<string, unknown>>('purchase_orders'),
    create: (row: Record<string, unknown>) => insertRow('purchase_orders', row),
  },
  invoices: {
    list: () => selectAll<Record<string, unknown>>('invoices'),
    create: (row: Record<string, unknown>) => insertRow('invoices', row),
  },
  notifications: {
    listForUser: async (userId: string) => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  },
};
