import { getStorage, setStorage } from '@/utils/storage';
import type { ProcurementSearchResponse } from '@/types/procurementSearch';

const KEY = 'procurement_reports_v1';

export function saveProcurementReport(report: ProcurementSearchResponse): void {
  const list = getStorage<ProcurementSearchResponse[]>(KEY, []);
  setStorage(KEY, [report, ...list].slice(0, 20));
}

export function getProcurementReports(): ProcurementSearchResponse[] {
  return getStorage(KEY, []);
}
