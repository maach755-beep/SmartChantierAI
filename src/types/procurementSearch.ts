import type { ProductCategory, PurchaseQuality } from '@/types/purchaseAssistant';

export type ProcurementStockStatus = 'en_stock' | 'stock_faible' | 'sur_commande';

export type ProcurementDataSource = 'demo' | 'web' | 'openai' | 'supabase' | 'supplier_api';

export type ProcurementResultOrigin = 'real_web' | 'demo';

export type ProcurementProjectType =
  | 'terrasse'
  | 'facade'
  | 'interieur'
  | 'renovation'
  | 'neuf'
  | 'piscine'
  | 'autre';

export interface ParsedProcurementQuery {
  rawQuery: string;
  productTerms: string;
  materialType: string;
  location: string;
  maxBudgetPerUnit: number;
  unit: string;
  category: ProductCategory | '';
  formatHint: string;
  dimensions: string;
  quantity: number;
  projectType: ProcurementProjectType;
  usageHint: string;
  parsedByAi: boolean;
}

export interface ProcurementScoreBreakdown {
  price: number;
  quality: number;
  availability: number;
  delivery: number;
  composite: number;
}

export interface ProcurementProductResult {
  id: string;
  productName: string;
  brand: string;
  model: string;
  supplier: string;
  priceEurHt: number;
  unit: string;
  estimatedLineTotalHt: number;
  stockStatus: ProcurementStockStatus;
  stockLabel: string;
  deliveryDays: number;
  deliveryLabel: string;
  distanceKm: number;
  distanceLabel: string;
  technicalSpecs: string[];
  qualityLevel: PurchaseQuality;
  scores: ProcurementScoreBreakdown;
  isBestProduct: boolean;
  isBestPrice: boolean;
  isBestValue: boolean;
  alternativeTo?: string;
  cheaperAlternative?: string;
  betterQualityAlternative?: string;
  resultOrigin: ProcurementResultOrigin;
  sourceLabel: string;
  url?: string;
  summary?: string;
  confidence?: number;
}

export interface SupplierRanking {
  supplier: string;
  rank: number;
  averageScore: number;
  productCount: number;
  bestPriceEur: number;
  avgDeliveryDays: number;
}

export interface ProcurementCostEstimate {
  quantity: number;
  unit: string;
  unitPriceHt: number;
  totalMaterialsHt: number;
  budgetTotalHt: number;
  varianceHt: number;
  withinBudget: boolean;
}

export interface ProcurementDeliveryEstimate {
  minDays: number;
  maxDays: number;
  label: string;
}

export interface ProcurementSearchInsight {
  bestProduct: ProcurementProductResult | null;
  bestPrice: ProcurementProductResult | null;
  bestValue: ProcurementProductResult | null;
  alternatives: ProcurementProductResult[];
}

export interface ProcurementSearchResponse {
  id: string;
  generatedAt: string;
  parsed: ParsedProcurementQuery;
  source: ProcurementDataSource;
  resultOrigin: ProcurementResultOrigin;
  providerNote: string;
  webQuery?: string;
  results: ProcurementProductResult[];
  insight: ProcurementSearchInsight;
  supplierRankings: SupplierRanking[];
  costEstimate: ProcurementCostEstimate;
  deliveryEstimate: ProcurementDeliveryEstimate;
  aiSummary: string;
}
