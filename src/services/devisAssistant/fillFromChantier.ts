import { dataStore } from '@/services/dataStore';
import type { ProfessionalDevisDocument, ProfessionalDevisLine } from '@/types/professionalDevis';
import { createEmptyDevisLine, defaultTvaPercent } from './calculator';
import { runDevisAssistant } from './engine';

export async function fillDevisFromChantier(
  doc: ProfessionalDevisDocument,
  chantierId: string
): Promise<ProfessionalDevisDocument> {
  const ch = dataStore.getChantiers().find((c) => c.id === chantierId);
  const result = await runDevisAssistant(chantierId);

  const lines: ProfessionalDevisLine[] = result.materialsList.map((l) => ({
    id: crypto.randomUUID(),
    workLot: l.room || 'Lot',
    description: l.material,
    quantity: l.quantity,
    unit: (['m²', 'ml', 'm³', 'unité'].includes(l.unit) ? l.unit : 'unité') as ProfessionalDevisLine['unit'],
    unitPriceHt: l.unitPrice,
    tvaPercent: defaultTvaPercent(),
  }));

  return {
    ...doc,
    clientName: doc.clientName || ch?.client || '',
    siteAddress: doc.siteAddress || ch?.address || '',
    city: doc.city || ch?.address.split(',').pop()?.trim() || '',
    projectType: doc.projectType || 'rénovation',
    labourTotalHt: result.labourEstimate,
    marginPercent: result.marginPercent,
    clientBudgetHt: doc.clientBudgetHt || ch?.budgetPlanned || 0,
    lines: lines.length ? lines : [createEmptyDevisLine()],
    updatedAt: new Date().toISOString(),
  };
}
