import { isVisionApiConfigured, env } from '../../config/env.js';
import type { IColorDetectionService, OcrExtractionInput, OcrExtractionOutput } from './interfaces.js';
import type { ColoredZone } from '../../../shared/plan-extraction/types.js';

export class ColorDetectionService implements IColorDetectionService {
  readonly name = 'color_detection';

  async detect(input: OcrExtractionInput, ocr: OcrExtractionOutput): Promise<ColoredZone[]> {
    if (isVisionApiConfigured() && env.ai.colorApiUrl) {
      try {
        const res = await fetch(env.ai.colorApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${env.ai.visionApiKey}` },
          body: JSON.stringify({ filePath: input.filePath, ocrZones: ocr.coloredZones }),
        });
        if (res.ok) {
          const data = (await res.json()) as { zones?: ColoredZone[] };
          if (data.zones?.length) return data.zones;
        }
      } catch {
        /* use OCR-derived zones */
      }
    }
    return ocr.coloredZones;
  }
}
