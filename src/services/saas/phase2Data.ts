import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { dataStore } from '@/services/dataStore';
import { computeChantierHealth } from '@/utils/healthScore';
import { seedLocalFromDemoIfEmpty, listProjects, isSaasDatabaseLive } from './platform';
import { localSaasDb } from './localStore';
import {
  dbAlbumToPhotoAlbum,
  dbAttendanceToRecord,
  dbEmployeeToTeamMember,
  dbMaterialToItem,
  dbNotificationToApp,
  dbPhotoToSitePhoto,
  dbProjectToChantier,
  dbTaskToTask,
  taskToDbTask,
} from './mappers';
import { uploadDocument } from './storage';
import type {
  DashboardMetrics,
  DbAttendance,
  DbEmployee,
  DbMaterial,
  DbNotification,
  DbPhotoAlbum,
  DbSitePhoto,
  DbTask,
  SiteManagerInsight,
} from './types';
import type {
  AppNotification,
  AttendanceRecord,
  Chantier,
  MaterialItem,
  PhotoAlbum,
  Risk,
  SitePhoto,
  Task,
  TeamMember,
} from '@/types';

export const LOCAL_USER_ID = '00000000-0000-4000-8000-000000000001';

function newId(): string {
  return crypto.randomUUID();
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
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

function projectNameMap(projects: Awaited<ReturnType<typeof listProjects>>): Record<string, string> {
  return Object.fromEntries(projects.map((p) => [p.id, p.name]));
}

export function seedPhase2FromDemoIfEmpty(): void {
  if (isSupabaseConfigured) return;
  seedLocalFromDemoIfEmpty();
  if (localSaasDb.isPhase2Seeded() && localSaasDb.tasks.list().length > 0) return;
  dataStore.init();

  const tasks: DbTask[] = dataStore.getTasks().map((t) => ({
    id: t.id,
    project_id: t.chantierId,
    title: t.title,
    description: null,
    assignee_id: null,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate,
    payload: {
      assignee_name: t.assignee,
      room_name: t.roomName,
      lot: t.lot,
      estimated_cost_ht: t.estimatedCostHt,
      chantier_name: t.chantierName,
    },
    created_at: new Date().toISOString(),
  }));

  const employees: DbEmployee[] = dataStore.getTeam().map((m) => ({
    id: m.id,
    name: m.name,
    trade: m.trade,
    role_type: m.roleType,
    team: m.team,
    project_id: m.chantierId || null,
    phone: m.phone,
    email: m.email ?? null,
    active: m.active,
    hours_this_week: m.hoursThisWeek,
    created_at: new Date().toISOString(),
  }));

  const attendance: DbAttendance[] = dataStore.getAttendance().map((a) => ({
    id: a.id,
    employee_id: a.workerId,
    project_id: a.chantierId || null,
    work_date: a.date,
    check_in: a.present ? `${a.date}T07:30:00` : null,
    check_out: a.present ? `${a.date}T16:30:00` : null,
    present: a.present,
    absent: a.absent,
    sick: a.sick,
    leave: a.leave,
    hours_worked: a.hoursWorked,
    payload: { worker_name: a.workerName, chantier_name: a.chantierName },
    created_at: new Date().toISOString(),
  }));

  const photos: DbSitePhoto[] = dataStore.getPhotos().map((p) => ({
    id: p.id,
    project_id: p.chantierId,
    album_id: p.albumId ?? null,
    room: p.room,
    storage_path: null,
    url: p.url,
    caption: p.caption ?? null,
    phase: p.phase,
    uploaded_by: p.uploadedBy,
    file_size: p.fileSize ?? null,
    tags: p.tags,
    created_at: p.date,
  }));

  const albums: DbPhotoAlbum[] = dataStore.getPhotoAlbums().map((a) => ({
    id: a.id,
    project_id: a.chantierId,
    name: a.name,
    description: a.description,
    cover_photo_id: a.coverPhotoId ?? null,
    photo_ids: a.photoIds,
    created_at: a.createdAt,
  }));

  const materials: DbMaterial[] = dataStore.getMaterials().map((m) => ({
    id: m.id,
    project_id: m.chantierId,
    name: m.name,
    reference: null,
    brand: m.category,
    unit: m.unit,
    quantity: m.quantityRequired,
    unit_price_ht: null,
    supplier_id: null,
    payload: {
      quantity_on_site: m.quantityOnSite,
      quantity_ordered: m.quantityOrdered,
      status: m.status,
      supplier_name: m.supplierName,
      category: m.category,
    },
    created_at: new Date().toISOString(),
  }));

  localSaasDb.tasks.save(tasks);
  localSaasDb.employees.save(employees);
  localSaasDb.attendance.save(attendance);
  localSaasDb.photos.save(photos);
  localSaasDb.albums.save(albums);
  localSaasDb.materials.save(materials);
  localSaasDb.markPhase2Seeded();
}

// ——— Tasks ———

export async function listTasks(): Promise<Task[]> {
  const projects = await listProjects();
  const names = projectNameMap(projects);
  if (isSupabaseConfigured) {
    const rows = await sbSelect<DbTask>('tasks');
    return rows.map((r) => dbTaskToTask(r, names[r.project_id]));
  }
  seedPhase2FromDemoIfEmpty();
  return localSaasDb.tasks.list().map((r) => dbTaskToTask(r, names[r.project_id]));
}

export async function createTask(input: Partial<Task> & { title: string; chantierId: string }): Promise<Task> {
  const row: DbTask = {
    id: newId(),
    project_id: input.chantierId,
    title: input.title,
    description: null,
    assignee_id: null,
    status: input.status ?? 'todo',
    priority: input.priority ?? 'medium',
    due_date: input.dueDate ?? today(),
    payload: (taskToDbTask(input).payload as Record<string, unknown>) ?? {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbTask>('tasks', row);
    const names = projectNameMap(await listProjects());
    return dbTaskToTask(created, names[created.project_id]);
  }
  localSaasDb.tasks.save([row, ...localSaasDb.tasks.list()]);
  const names = projectNameMap(await listProjects());
  return dbTaskToTask(row, names[row.project_id]);
}

export async function updateTask(id: string, input: Partial<Task>): Promise<Task> {
  const patch = taskToDbTask({ ...input, title: input.title ?? '', chantierId: input.chantierId ?? '' });
  if (isSupabaseConfigured) {
    await sbUpdate('tasks', id, { ...patch, updated_at: new Date().toISOString() });
    const found = (await sbSelect<DbTask>('tasks')).find((t) => t.id === id);
    if (!found) throw new Error('Tâche introuvable');
    const names = projectNameMap(await listProjects());
    return dbTaskToTask({ ...found, ...patch } as DbTask, names[found.project_id]);
  }
  const list = localSaasDb.tasks.list().map((t) =>
    t.id === id
      ? ({
          ...t,
          ...patch,
          payload: { ...t.payload, ...patch.payload },
          updated_at: new Date().toISOString(),
        } as DbTask)
      : t
  );
  localSaasDb.tasks.save(list);
  const found = list.find((t) => t.id === id)!;
  const names = projectNameMap(await listProjects());
  return dbTaskToTask(found, names[found.project_id]);
}

export async function deleteTask(id: string): Promise<void> {
  if (isSupabaseConfigured) await sbDelete('tasks', id);
  else localSaasDb.tasks.save(localSaasDb.tasks.list().filter((t) => t.id !== id));
}

// ——— Team ———

export async function listTeam(): Promise<TeamMember[]> {
  const names = projectNameMap(await listProjects());
  if (isSupabaseConfigured) {
    const rows = await sbSelect<DbEmployee>('employees');
    return rows.map((r) => dbEmployeeToTeamMember(r, names[r.project_id ?? '']));
  }
  seedPhase2FromDemoIfEmpty();
  return localSaasDb.employees.list().map((r) => dbEmployeeToTeamMember(r, names[r.project_id ?? '']));
}

export async function createEmployee(input: {
  name: string;
  trade?: string;
  roleType?: string;
  team?: string;
  projectId?: string;
  phone?: string;
}): Promise<TeamMember> {
  const row: DbEmployee = {
    id: newId(),
    name: input.name,
    trade: input.trade ?? null,
    role_type: input.roleType ?? 'worker',
    team: input.team ?? null,
    project_id: input.projectId ?? null,
    phone: input.phone ?? null,
    email: null,
    active: true,
    hours_this_week: 40,
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbEmployee>('employees', row);
    const names = projectNameMap(await listProjects());
    return dbEmployeeToTeamMember(created, names[created.project_id ?? '']);
  }
  localSaasDb.employees.save([row, ...localSaasDb.employees.list()]);
  const names = projectNameMap(await listProjects());
  return dbEmployeeToTeamMember(row, names[row.project_id ?? '']);
}

// ——— Attendance ———

export async function listAttendance(date?: string): Promise<AttendanceRecord[]> {
  const d = date ?? today();
  const employees = await listTeam();
  const empById = Object.fromEntries(employees.map((e) => [e.id, e]));
  const names = projectNameMap(await listProjects());

  let rows: DbAttendance[];
  if (isSupabaseConfigured) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('work_date', d)
      .order('created_at', { ascending: false });
    if (error) throw error;
    rows = (data ?? []) as DbAttendance[];
  } else {
    seedPhase2FromDemoIfEmpty();
    rows = localSaasDb.attendance.list().filter((r) => r.work_date === d);
  }

  return rows.map((r) =>
    dbAttendanceToRecord(
      r,
      empById[r.employee_id ?? '']?.name,
      names[r.project_id ?? '']
    )
  );
}

export async function employeeCheckIn(employeeId: string, projectId: string): Promise<AttendanceRecord> {
  const now = new Date().toISOString();
  const emp = (await listTeam()).find((e) => e.id === employeeId);
  const row: DbAttendance = {
    id: newId(),
    employee_id: employeeId,
    project_id: projectId,
    work_date: today(),
    check_in: now,
    check_out: null,
    present: true,
    absent: false,
    sick: false,
    leave: false,
    hours_worked: 0,
    payload: { worker_name: emp?.name, chantier_name: emp?.chantierName },
    created_at: now,
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbAttendance>('attendance_records', row);
    return dbAttendanceToRecord(created, emp?.name);
  }
  localSaasDb.attendance.save([row, ...localSaasDb.attendance.list()]);
  return dbAttendanceToRecord(row, emp?.name);
}

export async function employeeCheckOut(attendanceId: string): Promise<AttendanceRecord> {
  const now = new Date().toISOString();
  if (isSupabaseConfigured) {
    const rows = await sbSelect<DbAttendance>('attendance_records');
    const rec = rows.find((r) => r.id === attendanceId);
    if (!rec?.check_in) throw new Error('Pointage introuvable');
    const hours =
      Math.round(((new Date(now).getTime() - new Date(rec.check_in).getTime()) / 3600000) * 10) / 10;
    await sbUpdate('attendance_records', attendanceId, { check_out: now, hours_worked: hours });
    const updated = { ...rec, check_out: now, hours_worked: hours };
    return dbAttendanceToRecord(updated);
  }
  const list = localSaasDb.attendance.list();
  const rec = list.find((r) => r.id === attendanceId);
  if (!rec?.check_in) throw new Error('Pointage introuvable');
  const hours =
    Math.round(((new Date(now).getTime() - new Date(rec.check_in).getTime()) / 3600000) * 10) / 10;
  const updated = { ...rec, check_out: now, hours_worked: hours };
  localSaasDb.attendance.save(list.map((r) => (r.id === attendanceId ? updated : r)));
  return dbAttendanceToRecord(updated);
}

export async function getDailyAttendanceReport(date?: string): Promise<{
  date: string;
  present: number;
  absent: number;
  sick: number;
  leave: number;
  records: AttendanceRecord[];
}> {
  const records = await listAttendance(date);
  return {
    date: date ?? today(),
    present: records.filter((r) => r.present).length,
    absent: records.filter((r) => r.absent).length,
    sick: records.filter((r) => r.sick).length,
    leave: records.filter((r) => r.leave).length,
    records,
  };
}

// ——— Photos ———

export async function listPhotos(projectId?: string): Promise<SitePhoto[]> {
  const names = projectNameMap(await listProjects());
  let rows: DbSitePhoto[];
  if (isSupabaseConfigured) {
    rows = await sbSelect<DbSitePhoto>('site_photos');
  } else {
    seedPhase2FromDemoIfEmpty();
    rows = localSaasDb.photos.list();
  }
  if (projectId) rows = rows.filter((r) => r.project_id === projectId);
  return rows.map((r) => dbPhotoToSitePhoto(r, names[r.project_id]));
}

export async function listPhotoAlbums(projectId?: string): Promise<PhotoAlbum[]> {
  const names = projectNameMap(await listProjects());
  let rows: DbPhotoAlbum[];
  if (isSupabaseConfigured) {
    rows = await sbSelect<DbPhotoAlbum>('photo_albums');
  } else {
    seedPhase2FromDemoIfEmpty();
    rows = localSaasDb.albums.list();
  }
  if (projectId) rows = rows.filter((r) => r.project_id === projectId);
  return rows.map((r) => dbAlbumToPhotoAlbum(r, names[r.project_id]));
}

export async function createPhotoAlbum(input: {
  projectId: string;
  name: string;
  description?: string;
  projectName?: string;
}): Promise<PhotoAlbum> {
  const row: DbPhotoAlbum = {
    id: newId(),
    project_id: input.projectId,
    name: input.name,
    description: input.description ?? '',
    cover_photo_id: null,
    photo_ids: [],
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbPhotoAlbum>('photo_albums', row);
    return dbAlbumToPhotoAlbum(created, input.projectName);
  }
  localSaasDb.albums.save([row, ...localSaasDb.albums.list()]);
  return dbAlbumToPhotoAlbum(row, input.projectName);
}

export async function uploadSitePhoto(input: {
  projectId: string;
  projectName: string;
  file: File;
  room?: string;
  phase?: SitePhoto['phase'];
  albumId?: string;
  uploadedBy?: string;
  userId?: string;
}): Promise<SitePhoto> {
  let url = URL.createObjectURL(input.file);
  let storagePath: string | null = null;
  if (isSupabaseConfigured) {
    try {
      const path = `photos/${input.projectId}/${newId()}-${input.file.name}`;
      const up = await uploadDocument(path, input.file, input.userId);
      storagePath = up.path;
      url = up.publicUrl ?? url;
    } catch {
      /* fallback blob url */
    }
  }
  const row: DbSitePhoto = {
    id: newId(),
    project_id: input.projectId,
    album_id: input.albumId ?? null,
    room: input.room ?? '',
    storage_path: storagePath,
    url,
    caption: input.file.name,
    phase: input.phase ?? 'progress',
    uploaded_by: input.uploadedBy ?? '—',
    file_size: `${Math.round(input.file.size / 1024)} Ko`,
    tags: ['upload', input.phase ?? 'progress'],
    created_at: new Date().toISOString(),
  };
  if (isSupabaseConfigured) {
    const created = await sbInsert<DbSitePhoto>('site_photos', row);
    if (input.albumId) await addPhotoToAlbum(input.albumId, created.id);
    return dbPhotoToSitePhoto(created, input.projectName);
  }
  localSaasDb.photos.save([row, ...localSaasDb.photos.list()]);
  if (input.albumId) await addPhotoToAlbum(input.albumId, row.id);
  return dbPhotoToSitePhoto(row, input.projectName);
}

export async function addPhotoToAlbum(albumId: string, photoId: string): Promise<void> {
  if (isSupabaseConfigured) {
    const albums = await sbSelect<DbPhotoAlbum>('photo_albums');
    const a = albums.find((x) => x.id === albumId);
    if (!a) return;
    const photoIds = [...(a.photo_ids ?? []), photoId];
    await sbUpdate('photo_albums', albumId, {
      photo_ids: photoIds,
      cover_photo_id: a.cover_photo_id ?? photoId,
    });
    await sbUpdate('site_photos', photoId, { album_id: albumId });
    return;
  }
  const albums = localSaasDb.albums.list().map((a) =>
    a.id === albumId
      ? {
          ...a,
          photo_ids: a.photo_ids.includes(photoId) ? a.photo_ids : [...a.photo_ids, photoId],
          cover_photo_id: a.cover_photo_id ?? photoId,
        }
      : a
  );
  localSaasDb.albums.save(albums);
  localSaasDb.photos.save(
    localSaasDb.photos.list().map((p) => (p.id === photoId ? { ...p, album_id: albumId } : p))
  );
}

// ——— Materials ———

export async function listMaterials(): Promise<MaterialItem[]> {
  const names = projectNameMap(await listProjects());
  if (isSupabaseConfigured) {
    const rows = await sbSelect<DbMaterial>('materials');
    return rows.map((r) => dbMaterialToItem(r, names[r.project_id ?? '']));
  }
  seedPhase2FromDemoIfEmpty();
  return localSaasDb.materials.list().map((r) => dbMaterialToItem(r, names[r.project_id ?? '']));
}

// ——— Notifications ———

export async function listNotifications(userId: string = LOCAL_USER_ID): Promise<AppNotification[]> {
  if (isSupabaseConfigured) {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as DbNotification[]).map(dbNotificationToApp);
  }
  return localSaasDb.notifications
    .list()
    .filter((n) => n.user_id === userId)
    .map(dbNotificationToApp);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isSupabaseConfigured) {
    await sbUpdate('notifications', id, { read: true });
    return;
  }
  localSaasDb.notifications.save(
    localSaasDb.notifications.list().map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

export async function markAllNotificationsRead(userId: string = LOCAL_USER_ID): Promise<void> {
  if (isSupabaseConfigured) {
    if (!supabase) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
    return;
  }
  localSaasDb.notifications.save(
    localSaasDb.notifications.list().map((n) => (n.user_id === userId ? { ...n, read: true } : n))
  );
}

function persistNotifications(rows: DbNotification[]): void {
  if (isSupabaseConfigured) return;
  const existing = localSaasDb.notifications.list().filter((n) => !(n.metadata as { auto?: boolean })?.auto);
  localSaasDb.notifications.save([...rows, ...existing]);
}

export async function syncSystemNotifications(userId: string = LOCAL_USER_ID): Promise<void> {
  const [chantiers, tasks, materials] = await Promise.all([
    listProjects().then((ps) => ps.map(dbProjectToChantier)),
    listTasks(),
    listMaterials(),
  ]);
  const risks = computeDerivedRisks(chantiers, tasks, materials);
  const alerts: Omit<DbNotification, 'id' | 'created_at'>[] = [];
  const now = new Date().toISOString();

  for (const ch of chantiers) {
    if (ch.status === 'delayed' || ch.delayDays > 3) {
      alerts.push({
        user_id: userId,
        title: 'Retard chantier',
        body: `${ch.name} — ${ch.delayDays} j de retard`,
        type: 'delay',
        read: false,
        href: `/suivi/${ch.id}`,
        metadata: { chantierId: ch.id, chantierName: ch.name, level: 'orange', auto: true },
      });
    }
    if (ch.budgetConsumed > ch.budgetPlanned * 0.95) {
      alerts.push({
        user_id: userId,
        title: 'Alerte budget',
        body: `${ch.name} — budget à ${Math.round((ch.budgetConsumed / ch.budgetPlanned) * 100)}%`,
        type: 'project',
        read: false,
        href: `/finances`,
        metadata: { chantierId: ch.id, chantierName: ch.name, level: 'red', auto: true },
      });
    }
  }

  const criticalMats = materials.filter((m) => m.status === 'critical');
  if (criticalMats.length) {
    alerts.push({
      user_id: userId,
      title: 'Pénurie matériaux',
      body: `${criticalMats.length} référence(s) en rupture / critique`,
      type: 'material',
      read: false,
      href: '/materiaux',
      metadata: { level: 'red', auto: true },
    });
  }

  const overdue = tasks.filter((t) => t.status !== 'done' && t.status !== 'validated' && t.dueDate < today());
  for (const t of overdue.slice(0, 5)) {
    alerts.push({
      user_id: userId,
      title: 'Rappel tâche',
      body: `${t.title} — échéance ${t.dueDate}`,
      type: 'system',
      read: false,
      href: '/taches',
      metadata: { chantierId: t.chantierId, chantierName: t.chantierName, level: 'orange', auto: true },
    });
  }

  for (const r of risks.filter((x) => x.level === 'red').slice(0, 3)) {
    alerts.push({
      user_id: userId,
      title: 'Risque critique',
      body: r.description,
      type: 'risk',
      read: false,
      href: `/risques`,
      metadata: { chantierId: r.chantierId, chantierName: r.chantierName, level: 'red', auto: true },
    });
  }

  const withIds: DbNotification[] = alerts.map((a) => ({
    ...a,
    id: newId(),
    created_at: now,
  }));

  if (isSupabaseConfigured && supabase) {
    const { data: existing } = await supabase.from('notifications').select('id, metadata').eq('user_id', userId);
    const autoIds = (existing ?? [])
      .filter((n) => (n.metadata as { auto?: boolean })?.auto)
      .map((n) => n.id as string);
    if (autoIds.length) await supabase.from('notifications').delete().in('id', autoIds);
    if (withIds.length) await supabase.from('notifications').insert(withIds);
    return;
  }

  persistNotifications(withIds);
}

// ——— Risks (computed) ———

export function computeDerivedRisks(chantiers: Chantier[], tasks: Task[], materials: MaterialItem[]): Risk[] {
  const risks: Risk[] = [];
  for (const ch of chantiers) {
    const siteTasks = tasks.filter((t) => t.chantierId === ch.id);
    const blocked = siteTasks.filter((t) => t.status === 'blocked').length;
    if (blocked > 0) {
      risks.push({
        id: `risk-block-${ch.id}`,
        chantierId: ch.id,
        chantierName: ch.name,
        type: 'blocked_tasks',
        description: `${blocked} tâche(s) bloquée(s)`,
        level: 'orange',
        score: 65,
        detectedAt: new Date().toISOString(),
      });
    }
    const crit = materials.filter((m) => m.chantierId === ch.id && m.status === 'critical');
    for (const m of crit) {
      risks.push({
        id: `risk-mat-${m.id}`,
        chantierId: ch.id,
        chantierName: ch.name,
        type: 'material',
        description: `Matériau critique : ${m.name}`,
        level: 'red',
        score: 80,
        detectedAt: new Date().toISOString(),
      });
    }
    if (ch.budgetConsumed > ch.budgetPlanned) {
      risks.push({
        id: `risk-budget-${ch.id}`,
        chantierId: ch.id,
        chantierName: ch.name,
        type: 'budget',
        description: 'Budget dépassé',
        level: 'red',
        score: 90,
        detectedAt: new Date().toISOString(),
      });
    }
  }
  return risks;
}

// ——— Site manager AI ———

export async function runSiteManagerAnalysis(): Promise<SiteManagerInsight[]> {
  const chantiers = (await listProjects()).map(dbProjectToChantier);
  const [tasks, materials] = await Promise.all([listTasks(), listMaterials()]);
  const risks = computeDerivedRisks(chantiers, tasks, materials);

  return chantiers.map((ch) => {
    const siteRisks = risks.filter((r) => r.chantierId === ch.id);
    const health = computeChantierHealth(ch, siteRisks);
    const budgetRatio = ch.budgetPlanned > 0 ? ch.budgetConsumed / ch.budgetPlanned : 0;
    const predictedOverrunPercent =
      budgetRatio > 1 ? Math.round((budgetRatio - 1) * 100) : Math.round(Math.max(0, budgetRatio - 0.85) * 100);
    const delayRisk = ch.status === 'delayed' || ch.delayDays > 3;
    const budgetOverrunRisk = budgetRatio > 0.92;
    const actions: string[] = [];
    if (delayRisk) actions.push('Replanifier les jalons critiques cette semaine');
    if (budgetOverrunRisk) actions.push('Geler les commandes non essentielles — validation direction');
    if (siteRisks.some((r) => r.level === 'red')) actions.push('Réunion chantier urgence — chef de projet');
    const openTasks = tasks.filter((t) => t.chantierId === ch.id && t.status !== 'done').length;
    if (openTasks > 8) actions.push(`Prioriser ${openTasks} tâches ouvertes — affectation renfort`);
    if (actions.length === 0) actions.push('Continuer le suivi standard — chantier sous contrôle');

    return {
      chantierId: ch.id,
      chantierName: ch.name,
      healthScore: health.score,
      healthLevel: health.level,
      delayRisk,
      budgetOverrunRisk,
      predictedOverrunPercent,
      delayDays: ch.delayDays,
      actions,
    };
  });
}

export async function fetchPhase2DashboardExtras(
  base: Omit<DashboardMetrics, 'openTasks' | 'completedTasks' | 'overdueTasks' | 'presentToday' | 'absentToday' | 'workforceTotal' | 'avgHealthScore' | 'materialShortages' | 'unreadNotifications'>
): Promise<DashboardMetrics> {
  const [tasks, team, report, materials, insights] = await Promise.all([
    listTasks(),
    listTeam(),
    getDailyAttendanceReport(),
    listMaterials(),
    runSiteManagerAnalysis(),
  ]);
  await syncSystemNotifications(LOCAL_USER_ID);
  const notifications = await listNotifications(LOCAL_USER_ID);

  const openTasks = tasks.filter((t) => t.status !== 'done' && t.status !== 'validated').length;
  const completedTasks = tasks.filter((t) => t.status === 'done' || t.status === 'validated').length;
  const overdueTasks = tasks.filter(
    (t) => t.status !== 'done' && t.status !== 'validated' && t.dueDate < today()
  ).length;

  return {
    ...base,
    openTasks,
    completedTasks,
    overdueTasks,
    presentToday: report.present,
    absentToday: report.absent,
    workforceTotal: team.filter((e) => e.active).length,
    avgHealthScore: insights.length
      ? Math.round(insights.reduce((s, i) => s + i.healthScore, 0) / insights.length)
      : 100,
    materialShortages: materials.filter((m) => m.status === 'critical' || m.status === 'low').length,
    unreadNotifications: notifications.filter((n) => !n.read).length,
    dataSource: isSaasDatabaseLive() ? 'supabase' : 'local',
  };
}
