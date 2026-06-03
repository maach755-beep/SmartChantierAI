import { useCallback, useEffect, useState } from 'react';
import {
  fetchDashboardMetrics,
  listChantiers,
  listPurchaseOrders,
  listQuotations,
  listSuppliers,
  isSaasDatabaseLive,
} from '@/services/saas/platform';
import type { DashboardMetrics, DbPurchaseOrder, DbQuotation } from '@/services/saas/types';
import type { Chantier, Supplier } from '@/types';
import { useDemoData } from './useDemoData';

export function usePlatformData() {
  const demo = useDemoData();
  const [version, setVersion] = useState(0);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [quotations, setQuotations] = useState<DbQuotation[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<DbPurchaseOrder[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [p, s, q, po, m] = await Promise.all([
        listChantiers(),
        listSuppliers(),
        listQuotations(),
        listPurchaseOrders(),
        fetchDashboardMetrics(),
      ]);
      setChantiers(p);
      setSuppliers(s);
      setQuotations(q);
      setPurchaseOrders(po);
      setMetrics(m);
      setVersion((v) => v + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement données');
      setChantiers(await listChantiers().catch(() => demo.chantiers));
    } finally {
      setLoading(false);
    }
  }, [demo.chantiers]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    chantiers,
    suppliers,
    quotations,
    purchaseOrders,
    metrics,
    loading,
    error,
    refresh,
    version,
    isLiveDb: isSaasDatabaseLive(),
    /** Secondary demo entities (tasks, photos…) until migrated */
    tasks: demo.tasks,
    modifications: demo.modifications,
    attendance: demo.attendance,
    risks: demo.risks,
    materials: demo.materials,
    photos: demo.photos,
  };
}
