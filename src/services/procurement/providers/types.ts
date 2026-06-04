import type {
  ParsedProcurementQuery,
  ProcurementDataSource,
  ProcurementResultOrigin,
  SupplierUnavailableNotice,
} from '@/types/procurementSearch';
import type { PurchaseQuality } from '@/types/purchaseAssistant';

/** Entrée catalogue normalisée — tous les providers doivent mapper vers ce format. */
export interface CatalogItemDTO {
  id: string;
  productName: string;
  brand: string;
  model: string;
  supplier: string;
  priceEurHt: number;
  unit: string;
  deliveryDays: number;
  qualityLevel: PurchaseQuality;
  recommendationScore: number;
  technicalSpecs: string[];
  stockStatus: 'en_stock' | 'stock_faible' | 'sur_commande';
  stockQuantityLabel: string;
  cheaperAlternative?: string;
  betterQualityAlternative?: string;
  keywords: string[];
  url?: string;
  summary?: string;
  confidence?: number;
  resultOrigin?: ProcurementResultOrigin;
  sourceLabel?: string;
}

export interface ProcurementProviderResult {
  source: ProcurementDataSource;
  items: CatalogItemDTO[];
  note: string;
  resultOrigin: ProcurementResultOrigin;
  webQuery?: string;
  tavilyAnswer?: string;
  unavailableSuppliers?: SupplierUnavailableNotice[];
}

export interface ProcurementCatalogProvider {
  readonly source: ProcurementDataSource;
  isAvailable(): boolean;
  search(parsed: ParsedProcurementQuery): Promise<ProcurementProviderResult | null>;
}
