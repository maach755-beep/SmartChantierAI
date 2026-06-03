import type {
  AppNotification,
  AttendanceRecord,
  Chantier,
  MaterialItem,
  SitePhoto,
  PhotoAlbum,
  Supplier,
  Task,
  TeamMember,
} from '@/types';
import type {
  DbAttendance,
  DbEmployee,
  DbMaterial,
  DbNotification,
  DbPhotoAlbum,
  DbProject,
  DbSitePhoto,
  DbSupplier,
  DbTask,
} from './types';

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

const defaultLot = 'carrelage' as Task['lot'];

export function dbTaskToTask(row: DbTask, projectName?: string): Task {
  const p = row.payload ?? {};
  return {
    id: row.id,
    chantierId: row.project_id,
    chantierName: (p.chantier_name as string) ?? projectName,
    roomId: (p.room_id as string) ?? '',
    roomName: (p.room_name as string) ?? '',
    title: row.title,
    lot: (p.lot as Task['lot']) ?? defaultLot,
    status: row.status as Task['status'],
    assignee: (p.assignee_name as string) ?? '—',
    priority: row.priority as Task['priority'],
    dueDate: row.due_date ?? new Date().toISOString().slice(0, 10),
    estimatedCostHt: Number(p.estimated_cost_ht) || 0,
  };
}

export function taskToDbTask(input: Partial<Task> & { title: string; chantierId: string }): Partial<DbTask> {
  return {
    project_id: input.chantierId,
    title: input.title,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    due_date: input.dueDate ?? null,
    payload: {
      assignee_name: input.assignee,
      room_name: input.roomName,
      lot: input.lot,
      estimated_cost_ht: input.estimatedCostHt,
      chantier_name: input.chantierName,
    },
  };
}

export function dbEmployeeToTeamMember(row: DbEmployee, projectName?: string): TeamMember {
  return {
    id: row.id,
    name: row.name,
    trade: row.trade ?? '—',
    role: row.role_type ?? 'worker',
    roleType: (row.role_type as TeamMember['roleType']) ?? 'worker',
    team: row.team ?? '—',
    chantierId: row.project_id ?? '',
    chantierName: projectName ?? '—',
    phone: row.phone ?? '',
    email: row.email ?? undefined,
    active: row.active,
    hoursThisWeek: row.hours_this_week,
  };
}

export function dbAttendanceToRecord(
  row: DbAttendance,
  employeeName?: string,
  projectName?: string
): AttendanceRecord {
  const p = row.payload ?? {};
  return {
    id: row.id,
    workerId: row.employee_id ?? '',
    workerName: (p.worker_name as string) ?? employeeName ?? '—',
    chantierId: row.project_id ?? '',
    chantierName: (p.chantier_name as string) ?? projectName ?? '—',
    date: row.work_date,
    present: row.present,
    absent: row.absent,
    sick: row.sick,
    leave: row.leave,
    hoursWorked: Number(row.hours_worked) || 0,
  };
}

export function dbPhotoToSitePhoto(row: DbSitePhoto, projectName?: string): SitePhoto {
  return {
    id: row.id,
    chantierId: row.project_id,
    chantierName: projectName ?? '—',
    albumId: row.album_id ?? undefined,
    room: row.room ?? '',
    url: row.url ?? row.storage_path ?? '',
    caption: row.caption ?? undefined,
    phase: (row.phase as SitePhoto['phase']) ?? 'progress',
    uploadedBy: row.uploaded_by ?? '—',
    date: row.created_at ?? new Date().toISOString(),
    tags: row.tags ?? [],
    fileSize: row.file_size ?? undefined,
  };
}

export function dbAlbumToPhotoAlbum(row: DbPhotoAlbum, projectName?: string): PhotoAlbum {
  return {
    id: row.id,
    name: row.name,
    chantierId: row.project_id,
    chantierName: projectName ?? '—',
    description: row.description ?? '',
    coverPhotoId: row.cover_photo_id ?? undefined,
    photoIds: row.photo_ids ?? [],
    createdAt: row.created_at ?? new Date().toISOString(),
  };
}

export function dbMaterialToItem(row: DbMaterial, projectName?: string): MaterialItem {
  const p = row.payload ?? {};
  const qty = Number(row.quantity) || 0;
  const onSite = Number(p.quantity_on_site) || 0;
  const ordered = Number(p.quantity_ordered) || 0;
  const status = (p.status as MaterialItem['status']) ?? (onSite < qty * 0.3 ? 'critical' : 'ok');
  return {
    id: row.id,
    name: row.name,
    category: (p.category as string) ?? row.brand ?? 'BTP',
    unit: row.unit ?? 'm²',
    quantityRequired: qty,
    quantityOnSite: onSite,
    quantityOrdered: ordered,
    chantierId: row.project_id ?? '',
    chantierName: projectName ?? '—',
    supplierName: (p.supplier_name as string) ?? '—',
    status,
  };
}

export function dbNotificationToApp(row: DbNotification): AppNotification {
  const m = row.metadata ?? {};
  return {
    id: row.id,
    type: (row.type as AppNotification['type']) ?? 'system',
    title: row.title,
    message: row.body ?? '',
    chantierId: m.chantierId as string | undefined,
    chantierName: m.chantierName as string | undefined,
    date: row.created_at ?? new Date().toISOString(),
    read: row.read,
    level: (m.level as AppNotification['level']) ?? 'orange',
  };
}

export function appNotificationToDb(
  n: Omit<AppNotification, 'id' | 'date' | 'read'> & { read?: boolean },
  userId: string
): Omit<DbNotification, 'id' | 'created_at'> {
  return {
    user_id: userId,
    title: n.title,
    body: n.message,
    type: n.type,
    read: n.read ?? false,
    href: n.chantierId ? `/suivi/${n.chantierId}` : null,
    metadata: {
      chantierId: n.chantierId,
      chantierName: n.chantierName,
      level: n.level,
      auto: true,
    },
  };
}
