export type AiConfidence = 'confirme' | 'a_verifier' | 'estime';

export interface OcrDocumentResult {
  provider: string;
  rawText: string;
  fields: Record<string, string | number>;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
  confidence: AiConfidence;
  needsReview: boolean;
}

export interface TechnicalSheetExtractionResult {
  productName: string;
  reference: string;
  brand: string;
  specifications: Record<string, string>;
  confidence: AiConfidence;
  source: string;
}

export interface MaterialRecommendation {
  materialName: string;
  reason: string;
  score: number;
  supplierHint?: string;
}

export interface SupplierComparisonRow {
  supplier: string;
  product: string;
  priceLabel: string;
  score: number;
  decision: string;
}

export interface RiskDetectionResult {
  risks: { title: string; severity: 'low' | 'medium' | 'high'; mitigation: string }[];
  overallScore: number;
}
