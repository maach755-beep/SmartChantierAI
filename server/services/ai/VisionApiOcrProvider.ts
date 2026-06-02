import fs from 'node:fs';
import { env, isVisionApiConfigured } from '../../config/env.js';
import type { IOcrEngine, OcrExtractionInput, OcrExtractionOutput } from './interfaces.js';
import { HeuristicTextExtractor } from './HeuristicTextExtractor.js';

/** Delegates to external Vision/OCR API when configured; falls back to heuristic text layer only. */
export class VisionApiOcrProvider implements IOcrEngine {
  readonly name = 'vision_api';
  private fallback = new HeuristicTextExtractor();

  async extract(input: OcrExtractionInput): Promise<OcrExtractionOutput> {
    const base = await this.fallback.extract(input);
    if (!isVisionApiConfigured()) {
      return { ...base, needsVisionApi: base.rawText.length < 20 };
    }

    const buffer = fs.readFileSync(input.filePath);
    const body = {
      fileName: input.fileName,
      mimeType: input.mimeType,
      imageBase64: buffer.toString('base64'),
    };

    const res = await fetch(env.ai.visionApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.visionApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return { ...base, needsVisionApi: true };
    }

    const data = (await res.json()) as Partial<OcrExtractionOutput>;
    return {
      ...base,
      ...data,
      provider: this.name,
      needsVisionApi: false,
      rawText: data.rawText ?? base.rawText,
      roomLines: data.roomLines ?? base.roomLines,
      materialLines: data.materialLines ?? base.materialLines,
      coloredZones: data.coloredZones ?? base.coloredZones,
      legends: data.legends ?? base.legends,
      symbols: data.symbols ?? base.symbols,
      technicalNotes: data.technicalNotes ?? base.technicalNotes,
    };
  }
}
