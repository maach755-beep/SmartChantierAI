import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';
import { OLLAMA_SERVER_OFFLINE, OLLAMA_SERVER_VISION_MISSING } from '../../config/ollama.js';
import type { IOcrEngine, OcrExtractionInput, OcrExtractionOutput } from './interfaces.js';
import { HeuristicTextExtractor } from './HeuristicTextExtractor.js';
import { getServerOllamaStatus, ollamaTextEnrich, ollamaVisionAnalyze } from './ollamaClient.js';

const VISION_PROMPT =
  'Tu analyses un plan de construction BTP (France). Liste les pièces, surfaces en m², matériaux, ' +
  'légendes couleur (S1, S2…), symboles WC/SDB. Réponds en texte structuré français.';

/**
 * OCR plans via Ollama llava (images) + llama3.1/qwen2.5 (enrichissement texte PDF).
 * OpenAI non requis.
 */
export class OllamaOcrProvider implements IOcrEngine {
  readonly name = 'ollama';
  private heuristic = new HeuristicTextExtractor();

  async extract(input: OcrExtractionInput): Promise<OcrExtractionOutput> {
    const base = await this.heuristic.extract(input);
    const status = await getServerOllamaStatus();

    if (!status.online) {
      return {
        ...base,
        provider: this.name,
        needsVisionApi: true,
        technicalNotes: [...base.technicalNotes, OLLAMA_SERVER_OFFLINE],
      };
    }

    let extra = '';
    const isImage = input.mimeType.startsWith('image/');

    if (isImage) {
      if (!status.visionModel) {
        return {
          ...base,
          provider: this.name,
          needsVisionApi: true,
          technicalNotes: [...base.technicalNotes, OLLAMA_SERVER_VISION_MISSING],
        };
      }
      const buffer = fs.readFileSync(input.filePath);
      extra = (await ollamaVisionAnalyze(buffer.toString('base64'), VISION_PROMPT)) ?? '';
    } else if (status.textModel && base.rawText.trim().length > 0) {
      extra =
        (await ollamaTextEnrich(
          'Extrais pièces, surfaces m², matériaux et zones colorées de ce texte de plan BTP.',
          base.rawText
        )) ?? '';
    } else if (!status.textModel) {
      return {
        ...base,
        provider: this.name,
        needsVisionApi: base.rawText.length < 20,
        technicalNotes: [
          ...base.technicalNotes,
          'Modèle texte Ollama manquant — `ollama pull llama3.1` ou `qwen2.5`.',
        ],
      };
    }

    if (!extra.trim()) {
      return {
        ...base,
        provider: this.name,
        needsVisionApi: base.rawText.length < 20 && isImage,
        technicalNotes: [
          ...base.technicalNotes,
          isImage ? OLLAMA_SERVER_VISION_MISSING : 'Texte insuffisant — uploadez un scan ou activez llava.',
        ],
      };
    }

    fs.mkdirSync(env.upload.dir, { recursive: true });
    const tmpPath = path.join(env.upload.dir, `ollama-ocr-${Date.now()}.txt`);
    const merged = `${base.rawText}\n\n--- Analyse Ollama ---\n${extra}`;
    fs.writeFileSync(tmpPath, merged, 'utf-8');

    try {
      const enriched = await this.heuristic.extract({
        ...input,
        filePath: tmpPath,
        mimeType: 'text/plain',
        fileName: 'ollama-enriched.txt',
      });
      return {
        ...enriched,
        provider: this.name,
        rawText: merged,
        needsVisionApi: enriched.roomLines.length === 0 && enriched.materialLines.length === 0,
        technicalNotes: [
          ...enriched.technicalNotes,
          `Ollama — texte: ${status.textModel ?? 'n/a'}, vision: ${status.visionModel ?? 'n/a'}`,
        ],
      };
    } finally {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        /* ignore */
      }
    }
  }
}
