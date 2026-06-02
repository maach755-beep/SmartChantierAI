import type {
  ColoredZone,
  OcrLegend,
  OcrSymbol,
  PlanFileKind,
} from '../../../shared/plan-extraction/types.js';

export interface OcrExtractionInput {
  filePath: string;
  mimeType: string;
  fileKind: PlanFileKind;
  fileName: string;
}

export interface OcrExtractionOutput {
  rawText: string;
  legends: OcrLegend[];
  symbols: OcrSymbol[];
  technicalNotes: string[];
  roomLines: ParsedRoomLine[];
  materialLines: ParsedMaterialLine[];
  coloredZones: ColoredZone[];
  provider: string;
  needsVisionApi: boolean;
}

export interface ParsedRoomLine {
  name: string;
  surfaceSqm: number;
  floorReference?: string;
  materialHint?: string;
  notes: string[];
}

export interface ParsedMaterialLine {
  reference: string;
  brand: string;
  model: string;
  color?: string;
  unit: string;
  legendCode?: string;
}

export interface IOcrEngine {
  readonly name: string;
  extract(input: OcrExtractionInput): Promise<OcrExtractionOutput>;
}

export interface IColorDetectionService {
  readonly name: string;
  detect(input: OcrExtractionInput, ocr: OcrExtractionOutput): Promise<ColoredZone[]>;
}

export interface IVisionComparisonService {
  comparePlanToPhoto(input: {
    planStoragePath: string;
    photoStoragePath: string;
    projectId: string;
  }): Promise<{
    completionPercent: number;
    differencePercent: number;
    riskScore: number;
    missingWork: string[];
    wrongMaterials: string[];
    delays: string[];
    finishedZones: string[];
    alerts: string[];
  }>;
}
