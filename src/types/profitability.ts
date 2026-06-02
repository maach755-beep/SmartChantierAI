export interface ProfitabilityKpis {
  chantierId: string;
  chantierName: string;
  estimatedProfit: number;
  actualCost: number;
  budgetPlanned: number;
  budgetConsumed: number;
  costOverrun: number;
  overrunPercent: number;
  savingsOpportunities: string[];
  mostExpensiveZone: string;
  mostExpensiveMaterial: string;
  profitMarginPercent: number;
  totalHt: number;
  totalTtc: number;
  tvaAmount: number;
}

export interface ZoneCost {
  zone: string;
  cost: number;
}
