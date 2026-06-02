import { TVA_RATE } from '@/config/france';
import type { DevisTotals, ProfessionalDevisDocument, ProfessionalDevisLine } from '@/types/professionalDevis';

export function lineTotalHt(line: ProfessionalDevisLine): number {
  return Math.round(line.quantity * line.unitPriceHt * 100) / 100;
}

export function lineTvaAmount(line: ProfessionalDevisLine): number {
  const ht = lineTotalHt(line);
  const rate = line.tvaPercent / 100;
  return Math.round(ht * rate * 100) / 100;
}

export function computeDevisTotals(doc: ProfessionalDevisDocument): DevisTotals {
  const linesSubtotalHt = Math.round(
    doc.lines.reduce((s, l) => s + lineTotalHt(l), 0) * 100
  ) / 100;

  const labourHt = Math.round(doc.labourTotalHt * 100) / 100;
  const subtotalHt = Math.round((linesSubtotalHt + labourHt) * 100) / 100;

  const tvaAmount = Math.round(
    doc.lines.reduce((s, l) => s + lineTvaAmount(l), 0) * 100
  ) / 100;

  const totalTtc = Math.round((subtotalHt + tvaAmount) * 100) / 100;
  const marginPercent = doc.marginPercent;
  const marginAmountHt = Math.round(subtotalHt * (marginPercent / 100) * 100) / 100;
  const clientBudgetHt = doc.clientBudgetHt;
  const budgetVarianceHt =
    clientBudgetHt > 0 ? Math.round((totalTtc - clientBudgetHt) * 100) / 100 : 0;

  return {
    linesSubtotalHt,
    labourHt,
    subtotalHt,
    tvaAmount,
    totalTtc,
    marginAmountHt,
    marginPercent,
    clientBudgetHt,
    budgetVarianceHt,
    withinBudget: clientBudgetHt <= 0 || totalTtc <= clientBudgetHt,
  };
}

export function defaultTvaPercent(): number {
  return Math.round(TVA_RATE * 100);
}

export function createEmptyDevisLine(): ProfessionalDevisLine {
  return {
    id: crypto.randomUUID(),
    workLot: '',
    description: '',
    quantity: 1,
    unit: 'm²',
    unitPriceHt: 0,
    tvaPercent: defaultTvaPercent(),
  };
}

export function generateDevisNumber(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `DEV-${y}${m}${day}-${seq}`;
}

export function createEmptyDevisDocument(): ProfessionalDevisDocument {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    devisNumber: generateDevisNumber(),
    createdAt: now,
    updatedAt: now,
    clientName: '',
    siteAddress: '',
    city: '',
    projectType: 'rénovation',
    observations: '',
    labourTotalHt: 0,
    marginPercent: 12,
    clientBudgetHt: 0,
    lines: [createEmptyDevisLine()],
  };
}
