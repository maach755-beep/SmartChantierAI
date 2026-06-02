import { isVisionApiConfigured, env } from '../../config/env.js';
import type { IVisionComparisonService } from './interfaces.js';

export class PlanPhotoComparisonService implements IVisionComparisonService {
  async comparePlanToPhoto(input: {
    planStoragePath: string;
    photoStoragePath: string;
    projectId: string;
  }) {
    return this.compare(input);
  }

  async compare(input: {
    planStoragePath: string;
    photoStoragePath: string;
    projectId: string;
  }) {
    if (isVisionApiConfigured()) {
      try {
        const res = await fetch(`${env.ai.visionApiUrl}/compare`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.ai.visionApiKey}`,
          },
          body: JSON.stringify(input),
        });
        if (res.ok) return (await res.json()) as Awaited<ReturnType<IVisionComparisonService['comparePlanToPhoto']>>;
      } catch {
        /* structural fallback below */
      }
    }

    return {
      completionPercent: 0,
      differencePercent: 0,
      riskScore: 0,
      missingWork: [],
      wrongMaterials: [],
      delays: [],
      finishedZones: [],
      alerts: [
        'Vision API not configured — set VISION_API_URL and VISION_API_KEY for automated plan vs site comparison.',
      ],
    };
  }
}
