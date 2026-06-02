export type PurchaseLanguage = 'fr' | 'ar' | 'mixed';
export type PurchaseQuality = 'economique' | 'standard' | 'premium';
export type PurchaseUrgency = 'normal' | 'urgent' | 'tres_urgent';
export type PurchaseSearchScope =
  | 'ile_de_france'
  | 'paca'
  | 'auvergne_rhone_alpes'
  | 'occitanie'
  | 'nouvelle_aquitaine'
  | 'hauts_de_france'
  | 'france'
  | 'online';

export type ProductCategory =
  | 'carrelage'
  | 'parquet'
  | 'lames_composites'
  | 'dalles_plots'
  | 'couvertines'
  | 'garde_corps'
  | 'inox'
  | 'peinture'
  | 'colle'
  | 'joint'
  | 'plinthes'
  | 'isolation'
  | 'outillage'
  | 'electricite'
  | 'plomberie'
  | 'menuiserie'
  | 'sanitaire'
  | 'revetement_sol'
  | 'revetement_mur'
  | 'autre';

export interface PurchaseSearchCriteria {
  query: string;
  detectedLanguage: PurchaseLanguage;
  productSearch: string;
  location: string;
  maxBudget: number;
  quality: PurchaseQuality;
  deliveryDeadline: string;
  chantierId: string;
  chantierName: string;
  technicalConstraints: string;
  estimatedQuantity: string;
  category: ProductCategory | '';
  scope: PurchaseSearchScope;
  urgency: PurchaseUrgency;
}

export interface ProductRecommendation {
  id: string;
  productName: string;
  category: ProductCategory;
  brand: string;
  model: string;
  supplier: string;
  supplierLocation: string;
  estimatedPrice: number;
  unit: string;
  estimatedDeliveryDays: number;
  advantages: string[];
  disadvantages: string[];
  qualityLevel: PurchaseQuality;
  siteCompatibility: string;
  recommendationScore: number;
  supplierLinkPlaceholder: string;
  cheaperAlternative?: string;
  betterQualityAlternative?: string;
  whySuitable: string;
  whyNotSuitable?: string;
  decisionHint: 'recommande' | 'alternative' | 'eviter';
}

export interface SupplierSuggestion {
  id: string;
  name: string;
  city: string;
  phonePlaceholder: string;
  emailPlaceholder: string;
  productTypes: string;
  averageDelayDays: number;
  supplierScore: number;
  reliability: 'haute' | 'moyenne' | 'a_surveiller';
  averagePriceLevel: 'bas' | 'moyen' | 'eleve';
  scope: 'local' | 'national' | 'online';
}

export interface BudgetOption {
  tier: 'economique' | 'equilibree' | 'premium';
  productId: string;
  productName: string;
  price: number;
  possibleSaving: number;
  qualityRisk: string;
  delayImpact: string;
  siteImpact: string;
  supplierType: 'local' | 'national' | 'online';
  deliveryRisk: 'faible' | 'moyen' | 'eleve';
  whyRecommended: string;
  whyAvoided?: string;
}

export interface ComparisonRow {
  id: string;
  product: string;
  brand: string;
  supplier: string;
  price: number;
  delayDays: number;
  quality: string;
  availability: string;
  siteFit: string;
  aiScore: number;
  decision: string;
}

export interface ContextualAdvice {
  whySuitable: string[];
  whyNotSuitable: string[];
  bestChoiceForSituation: string;
  productsToAvoid: string[];
  whereToSave: string[];
  whereNotToSave: string[];
}

export interface PurchaseSearchResult {
  id: string;
  generatedAt: string;
  criteria: PurchaseSearchCriteria;
  products: ProductRecommendation[];
  comparison: ComparisonRow[];
  suppliers: SupplierSuggestion[];
  budgetOptions: BudgetOption[];
  contextual: ContextualAdvice;
  finalRecommendation: string;
  supplierRequestText: string;
  productsToAvoid: string[];
  potentialSavingsEur: number;
}

export interface PurchaseDashboardSummary {
  recentSearches: number;
  recommendedProducts: number;
  potentialSavings: number;
  reliableSuppliers: number;
  productsToAvoid: number;
  topRecommendation: string;
}
