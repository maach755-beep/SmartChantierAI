/** Résultat normalisé — fiche produit web Tavily (France · EUR). */

import type { ProcurementStockStatus } from '@/types/procurementSearch';

export type RealSearchResultOrigin = 'real_web' | 'demo';

export interface RealWebSearchHit {
  id: string;
  productTitle: string;
  supplierName: string;
  url: string;
  priceEurHt: number | null;
  priceLabel: string;
  unit: string;
  availability: ProcurementStockStatus;
  availabilityLabel: string;
  reference?: string;
  deliveryOrLocation: string;
  summary: string;
  confidence: number;
  productPageScore: number;
  sourceLabel: string;
  resultOrigin: RealSearchResultOrigin;
}

export interface SupplierUnavailableNotice {
  supplier: string;
  reason: string;
  message: string;
  loggedAt?: string;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: RealWebSearchHit[];
  resultOrigin: RealSearchResultOrigin;
  providerNote: string;
  unavailableSuppliers?: SupplierUnavailableNotice[];
}

export const WEB_PRODUCT_RESULTS_LIMIT = 10;
