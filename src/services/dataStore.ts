import {
  demoAttendance,
  demoChantiers,
  demoFieldUpdates,
  demoFlooring,
  demoModifications,
  demoPlanRooms,
  demoPlanning,
  demoRisks,
  demoRooms,
  demoSuppliers,
  demoTasks,
  demoWorkers,
} from '@/data/demoData';
import {
  demoDocuments,
  demoMaterialRequests,
  demoNotifications,
  demoTimeline,
} from '@/data/demoExtended';
import { demoMaterials, demoTeamMembers } from '@/data/demoMaterials';
import {
  buildPhotoTimeline,
  demoPhotoAlbums,
  demoPhotoComparisons,
  demoPhotosEnriched,
} from '@/data/demoPhotos';
import type {
  AppNotification,
  AttendanceRecord,
  Chantier,
  ChantierInput,
  Document,
  FieldUpdate,
  FlooringRow,
  MaterialItem,
  MaterialRequest,
  Modification,
  PlanRoom,
  PlanningTask,
  Risk,
  Room,
  PhotoAlbum,
  PhotoComparisonRecord,
  PhotoTimelineEntry,
  SitePhoto,
  Supplier,
  Task,
  TeamMember,
  TimelineEvent,
  Worker,
} from '@/types';
import { uid } from '@/utils/format';
import { getStorage, setStorage } from '@/utils/storage';
import { repairDemoLinks } from '@/services/demoRepair';

export const DEMO_DATA_VERSION = 8;

const KEYS = {
  version: 'demo_version',
  chantiers: 'chantiers',
  rooms: 'rooms',
  tasks: 'tasks',
  workers: 'workers',
  team: 'team',
  materials: 'materials',
  photos: 'photos',
  photoAlbums: 'photoAlbums',
  photoComparisons: 'photoComparisons',
  documents: 'documents',
  materialRequests: 'materialRequests',
  notifications: 'notifications',
  timeline: 'timeline',
  risks: 'risks',
  modifications: 'modifications',
  suppliers: 'suppliers',
  planRooms: 'planRooms',
  flooring: 'flooring',
  attendance: 'attendance',
  fieldUpdates: 'fieldUpdates',
  planning: 'planning',
  initialized: 'initialized',
} as const;

function seedDemoData() {
  setStorage(KEYS.chantiers, demoChantiers);
  setStorage(KEYS.rooms, demoRooms);
  setStorage(KEYS.tasks, demoTasks);
  setStorage(KEYS.workers, demoWorkers);
  setStorage(KEYS.team, demoTeamMembers);
  setStorage(KEYS.materials, demoMaterials);
  setStorage(KEYS.photos, demoPhotosEnriched);
  setStorage(KEYS.photoAlbums, demoPhotoAlbums);
  setStorage(KEYS.photoComparisons, demoPhotoComparisons);
  setStorage(KEYS.documents, demoDocuments);
  setStorage(KEYS.materialRequests, demoMaterialRequests);
  setStorage(KEYS.notifications, demoNotifications);
  setStorage(KEYS.timeline, demoTimeline);
  setStorage(KEYS.risks, demoRisks);
  setStorage(KEYS.modifications, demoModifications);
  setStorage(KEYS.suppliers, demoSuppliers);
  setStorage(KEYS.planRooms, demoPlanRooms);
  setStorage(KEYS.flooring, demoFlooring);
  setStorage(KEYS.attendance, demoAttendance);
  setStorage(KEYS.fieldUpdates, demoFieldUpdates);
  setStorage(KEYS.planning, demoPlanning);
  setStorage(KEYS.version, DEMO_DATA_VERSION);
  setStorage(KEYS.initialized, true);
}

function syncOrphanRecords() {
  const chantiers = getStorage<Chantier[]>(KEYS.chantiers, demoChantiers);
  setStorage(KEYS.tasks, repairDemoLinks(getStorage(KEYS.tasks, demoTasks), chantiers));
  setStorage(KEYS.materials, repairDemoLinks(getStorage(KEYS.materials, demoMaterials), chantiers));
  setStorage(
    KEYS.materialRequests,
    repairDemoLinks(getStorage(KEYS.materialRequests, demoMaterialRequests), chantiers)
  );
  setStorage(KEYS.risks, repairDemoLinks(getStorage(KEYS.risks, demoRisks), chantiers));
  setStorage(KEYS.modifications, repairDemoLinks(getStorage(KEYS.modifications, demoModifications), chantiers));
  setStorage(KEYS.photos, repairDemoLinks(getStorage(KEYS.photos, demoPhotosEnriched), chantiers));
  setStorage(KEYS.team, repairDemoLinks(getStorage(KEYS.team, demoTeamMembers), chantiers));
}

function initIfNeeded() {
  const version = getStorage<number>(KEYS.version, 0);
  if (getStorage(KEYS.initialized, false) && version === DEMO_DATA_VERSION) {
    syncOrphanRecords();
    return;
  }
  seedDemoData();
}

function pushNotification(n: Omit<AppNotification, 'id' | 'date' | 'read'> & { read?: boolean }) {
  const list = getStorage<AppNotification[]>(KEYS.notifications, demoNotifications);
  const item: AppNotification = {
    ...n,
    id: uid('notif'),
    date: new Date().toISOString(),
    read: n.read ?? false,
  };
  setStorage(KEYS.notifications, [item, ...list].slice(0, 50));
}

export const dataStore = {
  init: initIfNeeded,
  resetDemo: () => {
    localStorage.clear();
    seedDemoData();
  },

  getChantiers: (): Chantier[] => {
    initIfNeeded();
    const stored = getStorage<Chantier[]>(KEYS.chantiers, demoChantiers);
    return stored.map((c) => ({
      ...c,
      delayDays: c.delayDays ?? (c.status === 'delayed' ? 10 : c.status === 'at_risk' ? 5 : 0),
      engineer: c.engineer ?? 'Ing. BTP',
    }));
  },
  setChantiers: (v: Chantier[]) => setStorage(KEYS.chantiers, v),

  createProject: (input: ChantierInput): Chantier => {
    initIfNeeded();
    const project: Chantier = {
      id: input.id ?? uid('ch'),
      name: input.name,
      client: input.client,
      address: input.address,
      manager: input.manager,
      engineer: input.engineer,
      startDate: input.startDate,
      endDate: input.endDate,
      budgetPlanned: input.budgetPlanned,
      budgetConsumed: input.budgetConsumed ?? 0,
      progress: input.progress ?? 0,
      delayDays: input.delayDays ?? 0,
      riskLevel: input.riskLevel ?? 'green',
      status: input.status ?? 'active',
      description: input.description,
    };
    dataStore.setChantiers([...dataStore.getChantiers(), project]);
    pushNotification({
      type: 'project',
      title: 'Nouveau projet',
      message: `${project.name} créé`,
      chantierId: project.id,
      chantierName: project.name,
      level: 'green',
    });
    return project;
  },

  updateProject: (id: string, patch: Partial<Chantier>): Chantier | null => {
    const list = dataStore.getChantiers();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    const updated = { ...list[idx], ...patch, id };
    list[idx] = updated;
    dataStore.setChantiers(list);
    pushNotification({
      type: 'project',
      title: 'Projet mis à jour',
      message: `${updated.name} — ${updated.progress}%`,
      chantierId: updated.id,
      chantierName: updated.name,
      level: updated.riskLevel,
      read: true,
    });
    return updated;
  },

  deleteProject: (id: string): boolean => {
    const list = dataStore.getChantiers().filter((c) => c.id !== id);
    if (list.length === dataStore.getChantiers().length) return false;
    dataStore.setChantiers(list);
    return true;
  },

  getRooms: (): Room[] => {
    initIfNeeded();
    return getStorage(KEYS.rooms, demoRooms);
  },
  getTasks: (): Task[] => {
    initIfNeeded();
    return getStorage(KEYS.tasks, demoTasks);
  },
  setTasks: (v: Task[]) => setStorage(KEYS.tasks, v),
  getWorkers: (): Worker[] => {
    initIfNeeded();
    return getStorage(KEYS.workers, demoWorkers);
  },
  getTeam: (): TeamMember[] => {
    initIfNeeded();
    return getStorage(KEYS.team, demoTeamMembers);
  },
  getMaterials: (): MaterialItem[] => {
    initIfNeeded();
    return getStorage(KEYS.materials, demoMaterials);
  },
  setMaterials: (v: MaterialItem[]) => setStorage(KEYS.materials, v),
  getMaterialRequests: (): MaterialRequest[] => {
    initIfNeeded();
    return getStorage(KEYS.materialRequests, demoMaterialRequests);
  },
  setMaterialRequests: (v: MaterialRequest[]) => setStorage(KEYS.materialRequests, v),
  getPhotos: (): SitePhoto[] => {
    initIfNeeded();
    return getStorage(KEYS.photos, demoPhotosEnriched).map((p) => ({
      ...p,
      phase: p.phase ?? 'progress',
    }));
  },
  setPhotos: (v: SitePhoto[]) => setStorage(KEYS.photos, v),
  addPhoto: (photo: Omit<SitePhoto, 'id'>): SitePhoto => {
    const item: SitePhoto = { ...photo, id: uid('photo'), phase: photo.phase ?? 'progress' };
    dataStore.setPhotos([item, ...dataStore.getPhotos()]);
    pushNotification({
      type: 'photo',
      title: 'Nouvelle photo chantier',
      message: `${photo.room} — ${photo.chantierName}`,
      chantierId: photo.chantierId,
      chantierName: photo.chantierName,
      level: 'green',
    });
    return item;
  },
  getPhotoAlbums: (): PhotoAlbum[] => {
    initIfNeeded();
    return getStorage(KEYS.photoAlbums, demoPhotoAlbums);
  },
  setPhotoAlbums: (v: PhotoAlbum[]) => setStorage(KEYS.photoAlbums, v),
  createPhotoAlbum: (input: Omit<PhotoAlbum, 'id' | 'photoIds' | 'createdAt'>): PhotoAlbum => {
    const album: PhotoAlbum = {
      ...input,
      id: uid('album'),
      photoIds: [],
      createdAt: new Date().toISOString(),
    };
    dataStore.setPhotoAlbums([album, ...dataStore.getPhotoAlbums()]);
    return album;
  },
  addPhotoToAlbum: (albumId: string, photoId: string) => {
    const albums = dataStore.getPhotoAlbums().map((a) => {
      if (a.id !== albumId) return a;
      const photoIds = a.photoIds.includes(photoId) ? a.photoIds : [...a.photoIds, photoId];
      return { ...a, photoIds, coverPhotoId: a.coverPhotoId ?? photoId };
    });
    dataStore.setPhotoAlbums(albums);
    const photos = dataStore.getPhotos().map((p) => (p.id === photoId ? { ...p, albumId } : p));
    dataStore.setPhotos(photos);
  },
  getPhotoComparisons: (): PhotoComparisonRecord[] => {
    initIfNeeded();
    return getStorage(KEYS.photoComparisons, demoPhotoComparisons);
  },
  setPhotoComparisons: (v: PhotoComparisonRecord[]) => setStorage(KEYS.photoComparisons, v),
  savePhotoComparison: (record: Omit<PhotoComparisonRecord, 'id' | 'date'>): PhotoComparisonRecord => {
    const item: PhotoComparisonRecord = {
      ...record,
      id: uid('pcmp'),
      date: new Date().toISOString(),
    };
    dataStore.setPhotoComparisons([item, ...dataStore.getPhotoComparisons()]);
    const hasAlerts = record.result.alerts.length > 0 || record.result.modificationsDetected.length > 0;
    if (hasAlerts) {
      pushNotification({
        type: 'photo',
        title: 'Différences détectées (IA)',
        message: record.result.alerts[0] ?? record.result.modificationsDetected[0] ?? 'Écart photo',
        chantierId: record.chantierId,
        chantierName: record.chantierName,
        level: record.result.differenceScore > 40 ? 'red' : 'orange',
      });
      if (record.result.modificationsDetected.length > 0) {
        pushNotification({
          type: 'risk',
          title: 'Modification détectée',
          message: record.result.modificationsDetected[0],
          chantierId: record.chantierId,
          chantierName: record.chantierName,
          level: 'orange',
        });
      }
    }
    return item;
  },
  getPhotoTimeline: (chantierId?: string): PhotoTimelineEntry[] => {
    const photos = dataStore.getPhotos();
    const filtered = chantierId ? photos.filter((p) => p.chantierId === chantierId) : photos;
    const fromPhotos = buildPhotoTimeline(filtered);
    const fromComparisons = dataStore
      .getPhotoComparisons()
      .filter((c) => !chantierId || c.chantierId === chantierId)
      .map(
        (c): PhotoTimelineEntry => ({
          id: `ptl_cmp_${c.id}`,
          chantierId: c.chantierId,
          date: c.date,
          title: `Comparaison avant/après — ${c.result.differenceScore}% écart`,
          photoId: c.newPhotoId,
          photoUrl: c.newPhotoUrl,
          phase: 'after',
          type: 'comparison',
        })
      );
    return [...fromPhotos, ...fromComparisons].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  },
  updateChantierProgressFromPhotos: (chantierId: string, delta = 1) => {
    const ch = dataStore.getChantiers().find((c) => c.id === chantierId);
    if (!ch) return;
    dataStore.updateProject(chantierId, { progress: Math.min(100, ch.progress + delta) });
  },
  getDocuments: (): Document[] => {
    initIfNeeded();
    return getStorage(KEYS.documents, demoDocuments);
  },
  setDocuments: (v: Document[]) => setStorage(KEYS.documents, v),
  addDocument: (doc: Omit<Document, 'id'>): Document => {
    const item: Document = { ...doc, id: uid('doc') };
    dataStore.setDocuments([item, ...dataStore.getDocuments()]);
    if (doc.type === 'photo') {
      pushNotification({
        type: 'photo',
        title: 'Nouvelle photo',
        message: doc.name,
        chantierId: doc.chantierId,
        chantierName: doc.chantierName,
        level: 'green',
      });
    }
    return item;
  },
  getNotifications: (): AppNotification[] => {
    initIfNeeded();
    return getStorage(KEYS.notifications, demoNotifications);
  },
  setNotifications: (v: AppNotification[]) => setStorage(KEYS.notifications, v),
  markNotificationRead: (id: string) => {
    const list = dataStore.getNotifications().map((n) => (n.id === id ? { ...n, read: true } : n));
    dataStore.setNotifications(list);
  },
  markAllNotificationsRead: () => {
    dataStore.setNotifications(dataStore.getNotifications().map((n) => ({ ...n, read: true })));
  },
  getTimeline: (): TimelineEvent[] => {
    initIfNeeded();
    return getStorage(KEYS.timeline, demoTimeline);
  },
  getRisks: (): Risk[] => {
    initIfNeeded();
    return getStorage(KEYS.risks, demoRisks);
  },
  getModifications: (): Modification[] => {
    initIfNeeded();
    return getStorage(KEYS.modifications, demoModifications);
  },
  setModifications: (v: Modification[]) => setStorage(KEYS.modifications, v),
  getSuppliers: (): Supplier[] => {
    initIfNeeded();
    return getStorage(KEYS.suppliers, demoSuppliers);
  },
  getPlanRooms: (): PlanRoom[] => {
    initIfNeeded();
    return getStorage(KEYS.planRooms, demoPlanRooms);
  },
  setPlanRooms: (v: PlanRoom[]) => setStorage(KEYS.planRooms, v),
  getFlooring: (): FlooringRow[] => {
    initIfNeeded();
    return getStorage(KEYS.flooring, demoFlooring);
  },
  setFlooring: (v: FlooringRow[]) => setStorage(KEYS.flooring, v),
  getAttendance: (): AttendanceRecord[] => {
    initIfNeeded();
    return getStorage(KEYS.attendance, demoAttendance);
  },
  setAttendance: (v: AttendanceRecord[]) => setStorage(KEYS.attendance, v),
  getFieldUpdates: (): FieldUpdate[] => {
    initIfNeeded();
    return getStorage(KEYS.fieldUpdates, demoFieldUpdates);
  },
  setFieldUpdates: (v: FieldUpdate[]) => setStorage(KEYS.fieldUpdates, v),
  getPlanning: (): PlanningTask[] => {
    initIfNeeded();
    return getStorage(KEYS.planning, demoPlanning);
  },
};
