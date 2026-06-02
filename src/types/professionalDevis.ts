export type DevisUnit = 'm²' | 'ml' | 'unité' | 'm³';

export interface ProfessionalDevisLine {
  id: string;
  workLot: string;
  description: string;
  productName?: string;
  supplier?: string;
  productUrl?: string;
  quantity: number;
  unit: DevisUnit;
  unitPriceHt: number;
  tvaPercent: number;
}

export interface ProfessionalDevisDocument {
  id: string;
  devisNumber: string;
  createdAt: string;
  updatedAt: string;
  clientName: string;
  siteAddress: string;
  city: string;
  projectType: string;
  observations: string;
  labourTotalHt: number;
  marginPercent: number;
  clientBudgetHt: number;
  lines: ProfessionalDevisLine[];
}

export interface DevisTotals {
  linesSubtotalHt: number;
  labourHt: number;
  subtotalHt: number;
  tvaAmount: number;
  totalTtc: number;
  marginAmountHt: number;
  marginPercent: number;
  clientBudgetHt: number;
  budgetVarianceHt: number;
  withinBudget: boolean;
}
