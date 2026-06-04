import { useCallback, useEffect, useState } from 'react';
import {
  fetchDashboardMetrics,
  listChantiers,
  listPurchaseOrders,
  listQuotations,
  listSuppliers,
  isSaasDatabaseLive,
} from '@/services/saas/platform';
import {
  listTasks,
  listTeam,
  listAttendance,
  listPhotos,
  listPhotoAlbums,
  listMaterials,
  computeDerivedRisks,
  runSiteManagerAnalysis,
  seedPhase2FromDemoIfEmpty,
  LOCAL_USER_ID,
} from '@/services/saas/phase2Data';
import type { DashboardMetrics, DbPurchaseOrder, DbQuotation, SiteManagerInsight } from '@/services/saas/types';
import type {
  Chantier,
  Supplier,
  Task,
  TeamMember,
  AttendanceRecord,
  SitePhoto,
  PhotoAlbum,
  MaterialItem,
  Risk,
  Modification,
  MaterialRequest,
  PhotoComparisonRecord,
  Document,
  PhotoTimelineEntry,
  PlanRoom,
  FlooringRow,
  FieldUpdate,
  PlanningTask,
  Room,
} from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export type PlatformData = {
  chantiers: Chantier[];
  suppliers: Supplier[];
  quotations: DbQuotation[];
  purchaseOrders: DbPurchaseOrder[];
  tasks: Task[];
  team: TeamMember[];
  attendance: AttendanceRecord[];
  photos: SitePhoto[];
  albums: PhotoAlbum[];
  materials: MaterialItem[];
  risks: Risk[];
  siteInsights: SiteManagerInsight[];
  metrics: DashboardMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  version: number;
  isLiveDb: boolean;
  userId: string;
  modifications: Modification[];
  materialRequests: MaterialRequest[];
  photoComparisons: PhotoComparisonRecord[];
  documents: Document[];
  timeline: PhotoTimelineEntry[];
  planRooms: PlanRoom[];
  flooring: FlooringRow[];
  fieldUpdates: FieldUpdate[];
  planning: PlanningTask[];
  rooms: Room[];
};

export function usePlatformData(): PlatformData {
  const { user } = useAuth();
  const userId = user?.id ?? LOCAL_USER_ID;
  const [version, setVersion] = useState(0);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotations, setQuotations] = useState<DbQuotation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<DbPurchaseOrder[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [photos, setPhotos] = useState<SitePhoto[]>([]);
  const [albums, setAlbums] = useState<PhotoAlbum[]>([]);
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [siteInsights, setSiteInsights] = useState<SiteManagerInsight[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!isSaasDatabaseLive()) seedPhase2FromDemoIfEmpty();
      const [p, s, q, po, t, tm, att, ph, al, mat, m, insights] = await Promise.all([
        listChantiers(),
        listSuppliers(),
        listQuotations(),
        listPurchaseOrders(),
        listTasks(),
        listTeam(),
        listAttendance(),
        listPhotos(),
        listPhotoAlbums(),
        listMaterials(),
        fetchDashboardMetrics(),
        runSiteManagerAnalysis(),
      ]);
      setChantiers(p);
      setSuppliers(s);
      setQuotations(q);
      setPurchaseOrders(po);
      setTasks(t);
      setTeam(tm);
      setAttendance(att);
      setPhotos(ph);
      setAlbums(al);
      setMaterials(mat);
      setRisks(computeDerivedRisks(p, t, mat));
      setMetrics(m);
      setSiteInsights(insights);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement données');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t0 = window.setTimeout(() => void refresh(), 0);
    return () => clearTimeout(t0);
  }, [refresh]);

  return {
    chantiers,
    suppliers,
    quotations,
    purchaseOrders,
    tasks,
    team,
    attendance,
    photos,
    albums,
    materials,
    risks,
    siteInsights,
    metrics,
    loading,
    error,
    refresh,
    version,
    isLiveDb: isSaasDatabaseLive(),
    userId,
    modifications: [],
    materialRequests: [],
    photoComparisons: [],
    documents: [],
    timeline: [],
    planRooms: [],
    flooring: [],
    fieldUpdates: [],
    planning: [],
    rooms: [],
  };
}
