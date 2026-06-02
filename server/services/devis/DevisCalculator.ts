import { randomUUID } from 'node:crypto';
import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import type { DevisDocument, DevisLine, PlanExtractionResult, ProjectRecord } from '../../../shared/plan-extraction/types.js';

const DEFAULT_UNIT_PRICES: Record<string, number> = {
  'm²': 450,
  'unité': 1200,
  sac: 85,
};

export class DevisCalculator {
  generate(projectId: string, extractionId: string): DevisDocument {
    const project = planRepo.getProject(projectId);
    if (!project) throw new Error('Project not found');

    const extraction = planRepo.getExtraction(extractionId);
    if (!extraction) throw new Error('Extraction not found');

    const lines = this.buildLines(project, extraction);
    const subtotalHt = lines.reduce((s, l) => s + l.totalHt, 0);
    const marginAmount = subtotalHt * (project.marginRate / 100);
    const vatAmount = (subtotalHt + marginAmount) * (project.vatRate / 100);
    const totalTtc = subtotalHt + marginAmount + vatAmount;

    const devis: DevisDocument = {
      id: randomUUID(),
      tenantId: project.tenantId,
      projectId,
      extractionId,
      lines,
      subtotalHt: round2(subtotalHt),
      marginAmount: round2(marginAmount),
      vatAmount: round2(vatAmount),
      totalTtc: round2(totalTtc),
      currency: project.currency,
      createdAt: new Date().toISOString(),
    };

    planRepo.saveDevis(devis);
    return devis;
  }

  private buildLines(project: ProjectRecord, extraction: PlanExtractionResult): DevisLine[] {
    const lines: DevisLine[] = [];
    for (const room of extraction.rooms) {
      const mat = extraction.materials.find((m) => m.id === room.floorMaterialId);
      const unitPrice = mat?.unitPrice || DEFAULT_UNIT_PRICES[mat?.unit ?? 'm²'] || 400;
      const qty = room.surfaceSqm;
      lines.push({
        id: randomUUID(),
        zone: room.name,
        surfaceSqm: qty,
        material: mat?.name ?? 'Revêtement sol',
        brand: mat?.brand ?? '—',
        model: mat?.model ?? '—',
        quantity: qty,
        unit: mat?.unit ?? 'm²',
        unitPrice,
        totalHt: round2(qty * unitPrice),
      });
    }
    for (const zone of extraction.coloredZones) {
      if (lines.some((l) => l.zone === zone.zoneName)) continue;
      const unitPrice = DEFAULT_UNIT_PRICES['m²'];
      lines.push({
        id: randomUUID(),
        zone: zone.zoneName,
        surfaceSqm: zone.surfaceSqm,
        material: zone.materialName,
        brand: zone.colorLabel,
        model: zone.legendCode ?? '—',
        quantity: zone.surfaceSqm,
        unit: 'm²',
        unitPrice,
        totalHt: round2(zone.surfaceSqm * unitPrice),
      });
    }
    return lines;
  }

  purchaseList(devis: DevisDocument): { material: string; quantity: number; unit: string }[] {
    return devis.lines.map((l) => ({
      material: `${l.brand} ${l.model}`,
      quantity: l.quantity,
      unit: l.unit,
    }));
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const devisCalculator = new DevisCalculator();
