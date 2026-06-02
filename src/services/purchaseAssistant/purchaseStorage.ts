import { getStorage, setStorage } from '@/utils/storage';
import type { PurchaseSearchResult } from '@/types/purchaseAssistant';

const KEY = 'purchase_assistant_searches';
const LIST_KEY = 'purchase_assistant_lists';

export function savePurchaseSearch(result: PurchaseSearchResult): void {
  const list = getStorage<PurchaseSearchResult[]>(KEY, []);
  setStorage(KEY, [result, ...list].slice(0, 20));
}

export function getRecentSearches(): PurchaseSearchResult[] {
  return getStorage<PurchaseSearchResult[]>(KEY, []);
}

export interface SavedPurchaseLine {
  id: string;
  chantierId: string;
  chantierName: string;
  productName: string;
  supplier: string;
  quantity: string;
  unit: string;
  price: number;
  addedAt: string;
}

export function getPurchaseList(): SavedPurchaseLine[] {
  return getStorage<SavedPurchaseLine[]>(LIST_KEY, []);
}

export function addToPurchaseList(line: Omit<SavedPurchaseLine, 'id' | 'addedAt'>): void {
  const list = getPurchaseList();
  list.push({
    ...line,
    id: `pl-${Date.now()}`,
    addedAt: new Date().toISOString(),
  });
  setStorage(LIST_KEY, list);
}
