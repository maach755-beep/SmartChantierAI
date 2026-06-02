import type { ProfitabilityKpis, ZoneCost } from '@/types/profitability';
import { dataStore } from '@/services/dataStore';
import { TVA_RATE, amountTTC } from '@/config/france';

export function computeProfitability(chantierId?: string): ProfitabilityKpis[] {
  const chantiers = chantierId
    ? dataStore.getChantiers().filter((c) => c.id === chantierId)
    : dataStore.getChantiers();

  const materials = dataStore.getMaterials();
  const rooms = dataStore.getRooms();

  return chantiers.map((ch) => {
    const budgetRatio = ch.budgetPlanned > 0 ? ch.budgetConsumed / ch.budgetPlanned : 0;
    const overrun = Math.max(0, ch.budgetConsumed - ch.budgetPlanned);
    const estimatedProfit = Math.round(ch.budgetPlanned * 0.12 - overrun * 0.5);
    const chMaterials = materials.filter((m) => m.chantierId === ch.id);
    const topMat = [...chMaterials].sort(
      (a, b) => b.quantityRequired * 40 - a.quantityRequired * 40
    )[0];
    const chRooms = rooms.filter((r) => r.chantierId === ch.id);
    const zoneCosts: ZoneCost[] = chRooms.map((r, i) => ({
      zone: r.name,
      cost: Math.round((12 + i * 4) * 85),
    }));
    const topZone = zoneCosts.sort((a, b) => b.cost - a.cost)[0];

    const totalHt = ch.budgetConsumed;
    const tvaAmount = Math.round(totalHt * TVA_RATE);
    const totalTtc = amountTTC(totalHt, TVA_RATE);

    return {
      chantierId: ch.id,
      chantierName: ch.name,
      estimatedProfit,
      actualCost: ch.budgetConsumed,
      budgetPlanned: ch.budgetPlanned,
      budgetConsumed: ch.budgetConsumed,
      costOverrun: overrun,
      overrunPercent: ch.budgetPlanned > 0 ? Math.round((overrun / ch.budgetPlanned) * 100) : 0,
      savingsOpportunities: [
        'Mutualiser commandes carrelage — réseau Point P / BigMat',
        'Réduire reprises SDB — contrôle qualité amont (DTU)',
        ch.delayDays > 3 ? 'Renégocier pénalités fournisseur — délai France' : 'Optimiser planning équipe finitions',
      ],
      mostExpensiveZone: topZone?.zone ?? '—',
      mostExpensiveMaterial: topMat?.name ?? '—',
      profitMarginPercent: Math.max(0, Math.round(12 - budgetRatio * 5)),
      totalHt,
      totalTtc,
      tvaAmount,
    };
  });
}

export function getZoneCostsForChart(chantierId: string): ZoneCost[] {
  const rooms = dataStore.getRooms().filter((r) => r.chantierId === chantierId);
  return rooms.slice(0, 8).map((r, i) => ({
    zone: r.name.length > 12 ? `${r.name.slice(0, 12)}…` : r.name,
    cost: Math.round((14 + i * 5) * 82),
  }));
}
