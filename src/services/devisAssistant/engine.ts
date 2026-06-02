import type { DevisAssistantResult, DevisLineItem } from '@/types/devisAssistant';
import { dataStore } from '@/services/dataStore';
import { newId } from '@/utils/id';
import { delayMs } from '@/utils/format';
import { TVA_RATE, amountTTC, LABOR_RATES_EUR_HT } from '@/config/france';
import { formatCurrency, formatNumber } from '@/utils/format';

export async function runDevisAssistant(chantierId: string): Promise<DevisAssistantResult> {
  await delayMs(1100);
  const ch = dataStore.getChantiers().find((c) => c.id === chantierId) ?? dataStore.getChantiers()[0];
  const rooms = dataStore.getPlanRooms();
  const materials = dataStore.getMaterials().filter((m) => m.chantierId === ch.id).slice(0, 8);

  const lines: DevisLineItem[] = rooms.slice(0, 6).map((r, i) => {
    const unitPrice = 35 + (i % 3) * 12;
    const qty = r.surface ?? r.quantity ?? 20;
    return {
      id: newId('line'),
      room: r.piece,
      material: r.material || 'Carrelage grès cérame',
      quantity: qty,
      unit: 'm²',
      unitPrice,
      total: Math.round(qty * unitPrice),
    };
  });

  if (lines.length === 0 && materials.length) {
    materials.forEach((m) => {
      const qty = m.quantityRequired ?? 10;
      const unitPrice = 25;
      lines.push({
        id: newId('line'),
        room: m.chantierName,
        material: m.name,
        quantity: qty,
        unit: m.unit,
        unitPrice,
        total: Math.round(qty * unitPrice),
      });
    });
  }

  const materialsCost = lines.reduce((s, l) => s + l.total, 0);
  const laborHours = Math.max(40, Math.round(lines.reduce((s, l) => s + l.quantity, 0) * 1.2));
  const labourEstimate = Math.round(laborHours * LABOR_RATES_EUR_HT.carreleur);
  const totalHt = materialsCost + labourEstimate;
  const tvaAmount = Math.round(totalHt * TVA_RATE);
  const totalTtc = amountTTC(totalHt, TVA_RATE);
  const marginPercent = 12;
  const marginAmount = Math.round(totalHt * (marginPercent / 100));

  return {
    id: newId('devis'),
    chantierId: ch.id,
    chantierName: ch.name,
    createdAt: new Date().toISOString(),
    materialsList: lines,
    labourEstimate,
    materialsCost,
    totalCost: totalHt,
    marginPercent,
    marginAmount,
    draftQuotation: [
      `DEVIS PROVISOIRE — ${ch.name}`,
      `Conforme pratiques BTP France — montants en euros`,
      '',
      `Matériaux : ${formatCurrency(materialsCost)} HT`,
      `Main d'œuvre (${laborHours} h × ${LABOR_RATES_EUR_HT.carreleur} €/h) : ${formatCurrency(labourEstimate)} HT`,
      `Total HT : ${formatCurrency(totalHt)}`,
      `TVA ${Math.round(TVA_RATE * 100)} % : ${formatCurrency(tvaAmount)}`,
      `Total TTC : ${formatCurrency(totalTtc)}`,
      `Marge cible entreprise : ${marginPercent} % (${formatCurrency(marginAmount)} HT)`,
    ].join('\n'),
    quantityBreakdown: lines.map((l) => ({
      label: l.room,
      value: `${formatNumber(l.quantity)} ${l.unit} — ${l.material}`,
    })),
    costBreakdown: [
      { label: 'Matériaux HT', amount: materialsCost },
      { label: 'Main d\'œuvre HT', amount: labourEstimate },
      { label: `TVA ${Math.round(TVA_RATE * 100)} %`, amount: tvaAmount },
      { label: 'Total TTC', amount: totalTtc },
      { label: 'Marge HT estimée', amount: marginAmount },
    ],
  };
}
