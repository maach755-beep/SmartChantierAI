import { getStorage, setStorage } from '@/utils/storage';
import type {
  DbAttendance,
  DbEmployee,
  DbMaterial,
  DbNotification,
  DbPhotoAlbum,
  DbProject,
  DbPurchaseOrder,
  DbQuotation,
  DbSitePhoto,
  DbSupplier,
  DbTask,
  DbTechnicalSheet,
} from './types';

const KEYS = {
  projects: 'saas_db_projects_v1',
  suppliers: 'saas_db_suppliers_v1',
  quotations: 'saas_db_quotations_v1',
  purchaseOrders: 'saas_db_purchase_orders_v1',
  technicalSheets: 'saas_db_technical_sheets_v1',
  tasks: 'saas_db_tasks_v2',
  employees: 'saas_db_employees_v2',
  attendance: 'saas_db_attendance_v2',
  photos: 'saas_db_photos_v2',
  albums: 'saas_db_albums_v2',
  materials: 'saas_db_materials_v2',
  notifications: 'saas_db_notifications_v2',
  seeded: 'saas_db_seeded_v1',
  phase2Seeded: 'saas_db_phase2_seeded_v2',
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
  tasks: {
    list: () => read<DbTask>(KEYS.tasks),
    save: (rows: DbTask[]) => write(KEYS.tasks, rows),
  },
  employees: {
    list: () => read<DbEmployee>(KEYS.employees),
    save: (rows: DbEmployee[]) => write(KEYS.employees, rows),
  },
  attendance: {
    list: () => read<DbAttendance>(KEYS.attendance),
    save: (rows: DbAttendance[]) => write(KEYS.attendance, rows),
  },
  photos: {
    list: () => read<DbSitePhoto>(KEYS.photos),
    save: (rows: DbSitePhoto[]) => write(KEYS.photos, rows),
  },
  albums: {
    list: () => read<DbPhotoAlbum>(KEYS.albums),
    save: (rows: DbPhotoAlbum[]) => write(KEYS.albums, rows),
  },
  materials: {
    list: () => read<DbMaterial>(KEYS.materials),
    save: (rows: DbMaterial[]) => write(KEYS.materials, rows),
  },
  notifications: {
    list: () => read<DbNotification>(KEYS.notifications),
    save: (rows: DbNotification[]) => write(KEYS.notifications, rows),
  },
  isSeeded: () => getStorage<boolean>(KEYS.seeded, false),
  markSeeded: () => setStorage(KEYS.seeded, true),
  isPhase2Seeded: () => getStorage<boolean>(KEYS.phase2Seeded, false),
  markPhase2Seeded: () => setStorage(KEYS.phase2Seeded, true),
};
