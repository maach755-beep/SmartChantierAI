import { randomUUID } from 'node:crypto';
import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import type { MaterialChangeRequest, MaterialRecord } from '../../../shared/plan-extraction/types.js';

export class ChangeImpactService {
  applyChange(input: {
    tenantId: string;
    projectId: string;
    roomId: string;
    oldMaterialId: string;
    newMaterialId: string;
    quantity: number;
  }): MaterialChangeRequest {
    const oldMat = planRepo.getMaterial(input.oldMaterialId);
    const newMat = planRepo.getMaterial(input.newMaterialId);
    if (!oldMat || !newMat) throw new Error('Material not found');

    const priceDelta = (newMat.unitPrice - oldMat.unitPrice) * input.quantity;
    const quantityDelta = input.quantity;

    const change: MaterialChangeRequest = {
      id: randomUUID(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      roomId: input.roomId,
      oldMaterialId: input.oldMaterialId,
      newMaterialId: input.newMaterialId,
      quantityDelta,
      priceDelta: round2(priceDelta),
      budgetImpact: round2(priceDelta),
      createdAt: new Date().toISOString(),
    };

    planRepo.saveChange(change);
    return change;
  }

  avenantPdfContent(change: MaterialChangeRequest, oldMat: MaterialRecord, newMat: MaterialRecord): string {
    return [
      'AVENANT — Changement matériau client',
      `Date: ${change.createdAt}`,
      '',
      `Ancien: ${oldMat.brand} ${oldMat.model} (${oldMat.reference})`,
      `Nouveau: ${newMat.brand} ${newMat.model} (${newMat.reference})`,
      `Delta quantité: ${change.quantityDelta}`,
      `Impact budget: ${change.budgetImpact} MAD`,
      `Delta prix unitaire: ${newMat.unitPrice - oldMat.unitPrice}`,
    ].join('\n');
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const changeImpactService = new ChangeImpactService();
