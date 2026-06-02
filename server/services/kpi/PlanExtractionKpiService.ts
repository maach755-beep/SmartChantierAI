import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import type { PlanExtractionKpis } from '../../../shared/plan-extraction/types.js';

export class PlanExtractionKpiService {
  compute(projectId: string): PlanExtractionKpis {
    const project = planRepo.getProject(projectId);
    const rooms = planRepo.getRooms(projectId);
    const materials = planRepo.getMaterials(projectId);
    const comparisons = planRepo.listComparisons(projectId);

    const totalSurfaceSqm = rooms.reduce((s, r) => s + r.surfaceSqm, 0);
    const materialsInstalled = rooms.filter((r) => r.floorMaterialId).length;
    const alertCount = comparisons.reduce((s, c) => s + c.alerts.length, 0);
    const riskCount = comparisons.filter((c) => c.riskScore > 50).length;

    return {
      totalSurfaceSqm: round2(totalSurfaceSqm),
      materialsOrdered: materials.filter((m) => m.stock > 0).length,
      materialsInstalled,
      progressPercent: project?.progressPercent ?? 0,
      budgetPercent: project?.budgetPercent ?? 0,
      delayPercent: project?.delayPercent ?? 0,
      riskCount,
      alertCount,
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export const planKpiService = new PlanExtractionKpiService();
