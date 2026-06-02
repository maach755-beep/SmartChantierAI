export interface DevisLineItem {
  id: string;
  room: string;
  material: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface DevisAssistantResult {
  id: string;
  chantierId: string;
  chantierName: string;
  createdAt: string;
  materialsList: DevisLineItem[];
  labourEstimate: number;
  materialsCost: number;
  totalCost: number;
  marginPercent: number;
  marginAmount: number;
  draftQuotation: string;
  quantityBreakdown: { label: string; value: string }[];
  costBreakdown: { label: string; amount: number }[];
}
