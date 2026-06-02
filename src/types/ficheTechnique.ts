export type TechnicalSheetConfidence = 'confirme' | 'a_verifier' | 'estimee';

export interface FicheTechniqueSearchInput {
  productName: string;
  reference: string;
  supplierUrl: string;
  manufacturerUrl: string;
  brand: string;
  category: string;
  useCase: string;
  city: string;
}

export interface TechnicalSheetProduct {
  id: string;
  productName: string;
  reference: string;
  brand: string;
  manufacturer: string;
  supplier: string;
  category: string;
  description: string;
  useCase: string;
  dimensions: string;
  thickness: string;
  weight: string;
  material: string;
  color: string;
  finish: string;
  indoorOutdoorUse: string;
  resistance: string;
  fireClassification: string;
  thermalPerformance: string;
  acousticPerformance: string;
  slipResistance: string;
  waterResistance: string;
  uvResistance: string;
  loadResistance: string;
  certifications: string;
  ceStandards: string;
  normes: string;
  warranty: string;
  countryOfOrigin: string;
  environmentalSheet: string;
  safetySheet: string;
  productImage?: string;
  productUrl: string;
  supplierUrl: string;
  manufacturerUrl: string;
  sourceUrls: string[];
  confidence: TechnicalSheetConfidence;
  isProvisional: boolean;
  priceLabel?: string;
  availabilityLabel?: string;
  generatedAt: string;
  notes: string;
}

export interface TechnicalSheetComparison {
  products: TechnicalSheetProduct[];
  advantages: Record<string, string[]>;
  disadvantages: Record<string, string[]>;
  suitability: Record<string, string>;
  recommendedProductId: string;
  recommendationReason: string;
  generatedAt: string;
}

export interface FicheTechniquePdfLabels {
  title: string;
  comparisonTitle: string;
  productName: string;
  reference: string;
  brand: string;
  manufacturer: string;
  supplier: string;
  category: string;
  description: string;
  useCase: string;
  specifications: string;
  dimensions: string;
  thickness: string;
  weight: string;
  material: string;
  color: string;
  finish: string;
  indoorOutdoorUse: string;
  resistance: string;
  fireClassification: string;
  thermalPerformance: string;
  acousticPerformance: string;
  slipResistance: string;
  waterResistance: string;
  uvResistance: string;
  loadResistance: string;
  certifications: string;
  ceStandards: string;
  normes: string;
  warranty: string;
  countryOfOrigin: string;
  environmentalSheet: string;
  safetySheet: string;
  productImage: string;
  noImage: string;
  sources: string;
  notes: string;
  confidence: string;
  confidenceConfirme: string;
  confidenceAVerifier: string;
  confidenceEstimee: string;
  provisionalBanner: string;
  generatedAt: string;
  specLabel: string;
  specValue: string;
  usageRecommendations: string;
  footer: string;
  advantages: string;
  disadvantages: string;
  suitability: string;
  recommendedProduct: string;
  recommendationReason: string;
  price: string;
  availability: string;
}

export interface FicheTechniqueSearchResult {
  products: TechnicalSheetProduct[];
  providerNote: string;
  searchConfigured: boolean;
  queryUsed: string;
}
