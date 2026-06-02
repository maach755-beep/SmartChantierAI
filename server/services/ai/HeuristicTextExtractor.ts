import fs from 'node:fs';
import type { IOcrEngine, OcrExtractionInput, OcrExtractionOutput, ParsedMaterialLine, ParsedRoomLine } from './interfaces.js';
import type { ColoredZone, OcrLegend, OcrSymbol } from '../../../shared/plan-extraction/types.js';

const ROOM_NAMES = [
  'Salon', 'Cuisine', 'Chambre', 'Salle d\'eau', 'Salle de bain', 'WC', 'Garage',
  'Terrasse', 'Bureau', 'Dressing', 'Couloir', 'Escalier', 'Hall', 'Entrée',
];

const BRAND_PATTERNS = [
  /ALCAGRES\s+[\w\s]+/gi,
  /BROOKLYN\s+CEDAR/gi,
  /SAINT\s+AGOSTINO\s+[\w\s]+/gi,
  /WOODEN\s+FLOOR/gi,
  /B\d{2,3}/gi,
];

const LEGEND_PATTERN = /\bS[1-9]\d?\b/g;
const SURFACE_PATTERN = /(\d+[.,]\d+)\s*m[²2]/gi;
const ZONE_COLOR_PATTERN = /(pink|blue|red|green|rose|bleu|rouge|vert)\s*(zone|secteur)?\s*[:-]?\s*([^\n]+)/gi;

export class HeuristicTextExtractor implements IOcrEngine {
  readonly name = 'heuristic_text';

  async extract(input: OcrExtractionInput): Promise<OcrExtractionOutput> {
    let rawText = '';
    if (input.mimeType === 'application/pdf') {
      rawText = await this.extractPdfText(input.filePath);
    } else if (input.mimeType?.startsWith('text/')) {
      rawText = fs.readFileSync(input.filePath, 'utf-8');
    }

    const needsVisionApi = rawText.trim().length < 20 && input.fileKind !== 'technical_drawing';

    const legends = this.extractLegends(rawText);
    const symbols = this.extractSymbols(rawText);
    const technicalNotes = this.extractNotes(rawText);
    const roomLines = this.extractRooms(rawText);
    const materialLines = this.extractMaterials(rawText, legends);
    const coloredZones = this.extractColorZones(rawText);

    return {
      rawText,
      legends,
      symbols,
      technicalNotes,
      roomLines,
      materialLines,
      coloredZones,
      provider: this.name,
      needsVisionApi,
    };
  }

  private async extractPdfText(filePath: string): Promise<string> {
    try {
      const pdfParse = (await import('pdf-parse')).default;
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      return data.text ?? '';
    } catch {
      return '';
    }
  }

  private extractLegends(text: string): OcrLegend[] {
    const codes = [...new Set(text.match(LEGEND_PATTERN) ?? [])];
    return codes.map((code) => ({
      code,
      label: `Revêtement ${code}`,
      materialHint: text.includes('ALCAGRES') && code === 'S1' ? 'Carrelage effet marbre' : undefined,
    }));
  }

  private extractSymbols(text: string): OcrSymbol[] {
    const symbols: OcrSymbol[] = [];
    if (text.includes('WC')) symbols.push({ code: 'WC', meaning: 'Toilettes' });
    if (text.includes('SDB') || text.includes('Salle de bain')) symbols.push({ code: 'SDB', meaning: 'Salle de bain' });
    return symbols;
  }

  private extractNotes(text: string): string[] {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 10 && /note|obs|remarque|attention/i.test(l))
      .slice(0, 20);
  }

  private extractRooms(text: string): ParsedRoomLine[] {
    const rooms: ParsedRoomLine[] = [];
    for (const name of ROOM_NAMES) {
      const regex = new RegExp(`${name}[^\\n]*?(\\d+[.,]\\d+)\\s*m[²2]`, 'gi');
      let match: RegExpExecArray | null;
      while ((match = regex.exec(text)) !== null) {
        rooms.push({
          name,
          surfaceSqm: parseFloat(match[1].replace(',', '.')),
          notes: [],
        });
      }
      if (text.includes(name) && !rooms.some((r) => r.name === name)) {
        const surfaceMatch = text.match(new RegExp(`${name}[\\s\\S]{0,80}?(\\d+[.,]\\d+)`, 'i'));
        rooms.push({
          name,
          surfaceSqm: surfaceMatch ? parseFloat(surfaceMatch[1].replace(',', '.')) : 0,
          notes: [],
        });
      }
    }
    return rooms;
  }

  private extractMaterials(text: string, legends: OcrLegend[]): ParsedMaterialLine[] {
    const materials: ParsedMaterialLine[] = [];
    for (const pattern of BRAND_PATTERNS) {
      const matches = text.match(pattern) ?? [];
      for (const m of matches) {
        const legend = legends.find((l) => text.includes(l.code))?.code;
        materials.push({
          reference: m.trim().slice(0, 32),
          brand: m.split(/\s+/)[0] ?? 'N/A',
          model: m.trim(),
          unit: 'm²',
          legendCode: legend,
        });
      }
    }
    return materials;
  }

  private extractColorZones(text: string): ColoredZone[] {
    const zones: ColoredZone[] = [];
    let m: RegExpExecArray | null;
    const re = new RegExp(ZONE_COLOR_PATTERN.source, 'gi');
    while ((m = re.exec(text)) !== null) {
      const colorLabel = m[1];
      const rest = m[3] ?? '';
      const surfaceMatch = rest.match(/(\d+[.,]\d+)\s*m[²2]/i);
      zones.push({
        id: `zone_${zones.length}`,
        colorHex: colorLabelToHex(colorLabel),
        colorLabel,
        zoneName: rest.split(/\d/)[0]?.trim() || 'Zone',
        materialName: rest.replace(SURFACE_PATTERN, '').trim(),
        surfaceSqm: surfaceMatch ? parseFloat(surfaceMatch[1].replace(',', '.')) : 0,
      });
    }

    return zones;
  }
}

function colorLabelToHex(label: string): string {
  const map: Record<string, string> = {
    pink: '#f9a8d4', rose: '#f9a8d4', blue: '#60a5fa', bleu: '#60a5fa',
    red: '#f87171', rouge: '#f87171', green: '#4ade80', vert: '#4ade80',
  };
  return map[label.toLowerCase()] ?? '#94a3b8';
}
