import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.js';
import { planRepo } from '../../repositories/PlanExtractionRepository.js';
import type {
  CeilingRecord,
  FloorCoveringRecord,
  MaterialRecord,
  PlanExtractionResult,
  RoomRecord,
  WallCoveringRecord,
} from '../../../shared/plan-extraction/types.js';
import { HeuristicTextExtractor } from './HeuristicTextExtractor.js';
import { OllamaOcrProvider } from './OllamaOcrProvider.js';
import { VisionApiOcrProvider } from './VisionApiOcrProvider.js';
import { ColorDetectionService } from './ColorDetectionService.js';
import type { IOcrEngine, OcrExtractionInput } from './interfaces.js';
import { TableGeneratorService } from '../export/TableGeneratorService.js';

function createOcrEngine(): IOcrEngine {
  if (env.ai.ocrProvider === 'vision_api') return new VisionApiOcrProvider();
  if (env.ai.ocrProvider === 'heuristic') return new HeuristicTextExtractor();
  return new OllamaOcrProvider();
}

export class PlanExtractionPipeline {
  private ocr: IOcrEngine = createOcrEngine();
  private colors = new ColorDetectionService();
  private tables = new TableGeneratorService();

  async run(jobId: string): Promise<PlanExtractionResult> {
    const job = planRepo.getJob(jobId);
    if (!job) throw new Error('Job not found');

    planRepo.updateJob(jobId, { status: 'processing' });

    try {
      const input: OcrExtractionInput = {
        filePath: job.storagePath,
        mimeType: job.mimeType,
        fileKind: job.fileKind,
        fileName: job.fileName,
      };

      const ocr = await this.ocr.extract(input);
      const coloredZones = await this.colors.detect(input, ocr);

      const status = ocr.needsVisionApi ? 'needs_vision_api' : ocr.roomLines.length || ocr.materialLines.length ? 'completed' : 'needs_vision_api';

      const materials = this.buildMaterials(job.tenantId, job.projectId, ocr.materialLines, coloredZones);
      const rooms = this.buildRooms(job.tenantId, job.projectId, jobId, ocr.roomLines, materials, coloredZones);
      const { floorCoverings, wallCoverings, ceilings } = this.buildCoverings(job.tenantId, job.projectId, rooms);

      const tables = this.tables.generate({ rooms, materials, coloredZones });

      const result: PlanExtractionResult = {
        jobId,
        tenantId: job.tenantId,
        projectId: job.projectId,
        status,
        rooms,
        materials,
        floorCoverings,
        wallCoverings,
        ceilings,
        coloredZones,
        legends: ocr.legends,
        symbols: ocr.symbols,
        technicalNotes: ocr.technicalNotes,
        tables,
        rawOcrText: ocr.rawText,
      };

      planRepo.saveExtraction(result);
      planRepo.updateJob(jobId, {
        status,
        completedAt: new Date().toISOString(),
        provider: ocr.provider,
      });

      const totalSurface = rooms.reduce((s, r) => s + r.surfaceSqm, 0);
      planRepo.updateProjectKpis(job.projectId, {
        progressPercent: Math.min(100, Math.round(totalSurface / 10)),
      });

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Extraction failed';
      planRepo.updateJob(jobId, { status: 'failed', errorMessage: message });
      throw err;
    }
  }

  private buildMaterials(
    tenantId: string,
    projectId: string,
    lines: import('./interfaces.js').ParsedMaterialLine[],
    zones: import('../../../shared/plan-extraction/types.js').ColoredZone[]
  ): MaterialRecord[] {
    const mats: MaterialRecord[] = [];
    for (const line of lines) {
      mats.push({
        id: randomUUID(),
        tenantId,
        projectId,
        reference: line.reference,
        brand: line.brand,
        model: line.model,
        color: line.color ?? '',
        name: line.model,
        unit: line.unit,
        unitPrice: 0,
        stock: 0,
        legendCode: line.legendCode,
        createdAt: new Date().toISOString(),
      });
    }
    for (const z of zones) {
      if (!z.materialName) continue;
      mats.push({
        id: randomUUID(),
        tenantId,
        projectId,
        reference: `ZONE-${z.colorLabel}`,
        brand: z.colorLabel,
        model: z.materialName,
        color: z.colorHex,
        name: z.materialName,
        unit: 'm²',
        unitPrice: 0,
        stock: 0,
        createdAt: new Date().toISOString(),
      });
    }
    return mats;
  }

  private buildRooms(
    tenantId: string,
    projectId: string,
    extractionId: string,
    lines: import('./interfaces.js').ParsedRoomLine[],
    materials: MaterialRecord[],
    zones: import('../../../shared/plan-extraction/types.js').ColoredZone[]
  ): RoomRecord[] {
    return lines.map((line) => {
      const zoneMat = zones.find((z) => line.name.toLowerCase().includes(z.zoneName.toLowerCase()));
      const mat = materials.find((m) => m.name === zoneMat?.materialName || m.legendCode === line.floorReference);
      return {
        id: randomUUID(),
        tenantId,
        projectId,
        extractionId,
        name: line.name,
        surfaceSqm: line.surfaceSqm,
        floorReference: line.floorReference,
        floorMaterialId: mat?.id,
        technicalNotes: line.notes,
      };
    });
  }

  private buildCoverings(tenantId: string, projectId: string, rooms: RoomRecord[]): {
    floorCoverings: FloorCoveringRecord[];
    wallCoverings: WallCoveringRecord[];
    ceilings: CeilingRecord[];
  } {
    const floorCoverings: FloorCoveringRecord[] = [];
    const wallCoverings: WallCoveringRecord[] = [];
    const ceilings: CeilingRecord[] = [];

    for (const room of rooms) {
      if (room.floorMaterialId) {
        floorCoverings.push({
          id: randomUUID(),
          tenantId,
          projectId,
          roomId: room.id,
          materialId: room.floorMaterialId,
          surfaceSqm: room.surfaceSqm,
          quantity: room.surfaceSqm,
        });
      }
    }
    return { floorCoverings, wallCoverings, ceilings };
  }
}

export const extractionPipeline = new PlanExtractionPipeline();
