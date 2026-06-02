import { randomUUID } from 'node:crypto';
import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import type { PlanPhotoComparison } from '../../../shared/plan-extraction/types.js';
import { PlanPhotoComparisonService } from '../ai/PlanPhotoComparisonService.js';

export class FieldPhotoSyncService {
  private comparison = new PlanPhotoComparisonService();

  async ingestFieldPhoto(input: {
    tenantId: string;
    projectId: string;
    photoId: string;
    photoStoragePath: string;
    planJobId?: string;
  }): Promise<PlanPhotoComparison> {
    const jobs = planRepo.listJobs(input.projectId);
    const planJob = input.planJobId
      ? planRepo.getJob(input.planJobId)
      : jobs.find((j) => j.status === 'completed' || j.status === 'needs_vision_api');

    if (!planJob) {
      throw new Error('No plan extraction job found for comparison');
    }

    const analysis = await this.comparison.compare({
      planStoragePath: planJob.storagePath,
      photoStoragePath: input.photoStoragePath,
      projectId: input.projectId,
    });

    const record: PlanPhotoComparison = {
      id: randomUUID(),
      tenantId: input.tenantId,
      projectId: input.projectId,
      planJobId: planJob.id,
      photoId: input.photoId,
      ...analysis,
      createdAt: new Date().toISOString(),
    };

    planRepo.saveComparison(record);

    if (analysis.alerts.length > 0) {
      planRepo.updateProjectKpis(input.projectId, {
        delayPercent: Math.min(100, (planRepo.getProject(input.projectId)?.delayPercent ?? 0) + 5),
      });
    }

    return record;
  }
}

export const fieldPhotoSync = new FieldPhotoSyncService();
