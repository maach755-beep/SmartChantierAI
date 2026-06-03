import { getStorage, setStorage } from '@/utils/storage';
import type { DbProject, DbPurchaseOrder, DbQuotation, DbSupplier, DbTechnicalSheet } from './types';

const KEYS = {
  projects: 'saas_db_projects_v1',
  suppliers: 'saas_db_suppliers_v1',
  quotations: 'saas_db_quotations_v1',
  purchaseOrders: 'saas_db_purchase_orders_v1',
  technicalSheets: 'saas_db_technical_sheets_v1',
  seeded: 'saas_db_seeded_v1',
} as const;

function read<T>(key: string): T[] {
  return getStorage<T[]>(key, []);
}

function write<T>(key: string, rows: T[]): void {
  setStorage(key, rows);
}

export const localSaasDb = {
  projects: {
    list: () => read<DbProject>(KEYS.projects),
    save: (rows: DbProject[]) => write(KEYS.projects, rows),
  },
  suppliers: {
    list: () => read<DbSupplier>(KEYS.suppliers),
    save: (rows: DbSupplier[]) => write(KEYS.suppliers, rows),
  },
  quotations: {
    list: () => read<DbQuotation>(KEYS.quotations),
    save: (rows: DbQuotation[]) => write(KEYS.quotations, rows),
  },
  purchaseOrders: {
    list: () => read<DbPurchaseOrder>(KEYS.purchaseOrders),
    save: (rows: DbPurchaseOrder[]) => write(KEYS.purchaseOrders, rows),
  },
  technicalSheets: {
    list: () => read<DbTechnicalSheet>(KEYS.technicalSheets),
    save: (rows: DbTechnicalSheet[]) => write(KEYS.technicalSheets, rows),
  },
  isSeeded: () => getStorage<boolean>(KEYS.seeded, false),
  markSeeded: () => setStorage(KEYS.seeded, true),
};
