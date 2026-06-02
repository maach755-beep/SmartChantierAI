import type { PurchaseQuality } from '@/types/purchaseAssistant';
import type { ProcurementScoreBreakdown, ProcurementStockStatus } from '@/types/procurementSearch';

const QUALITY_BASE: Record<PurchaseQuality, number> = {
  economique: 68,
  standard: 82,
  premium: 94,
};

export function scorePrice(price: number, budget: number): number {
  if (budget <= 0) {
    return Math.max(40, 100 - price * 0.8);
  }
  if (price <= budget) return 100;
  const overrun = (price - budget) / budget;
  return Math.max(0, Math.round(100 - overrun * 120));
}

export function scoreQuality(level: PurchaseQuality, recommendationBoost: number): number {
  const base = QUALITY_BASE[level];
  return Math.min(100, Math.round(base * 0.7 + recommendationBoost * 0.3));
}

export function scoreAvailability(status: ProcurementStockStatus): number {
  if (status === 'en_stock') return 100;
  if (status === 'stock_faible') return 62;
  return 30;
}

export function scoreDelivery(days: number): number {
  if (days <= 2) return 100;
  if (days <= 4) return 88;
  if (days <= 7) return 72;
  if (days <= 10) return 58;
  return Math.max(35, 100 - days * 4);
}

/** Score achat : Prix 40 % · Qualité 30 % · Disponibilité 20 % · Délai 10 % */
export function computeCompositeScore(
  price: number,
  budget: number,
  qualityLevel: PurchaseQuality,
  recommendationScore: number,
  deliveryDays: number,
  stockStatus: ProcurementStockStatus
): ProcurementScoreBreakdown {
  const priceS = scorePrice(price, budget);
  const qualityS = scoreQuality(qualityLevel, recommendationScore);
  const availabilityS = scoreAvailability(stockStatus);
  const deliveryS = scoreDelivery(deliveryDays);

  const composite = Math.round(
    priceS * 0.4 + qualityS * 0.3 + availabilityS * 0.2 + deliveryS * 0.1
  );

  return {
    price: priceS,
    quality: qualityS,
    availability: availabilityS,
    delivery: deliveryS,
    composite,
  };
}
