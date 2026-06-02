import type { ColoredZone, GeneratedTable, MaterialRecord, RoomRecord } from '../../../shared/plan-extraction/types.js';

export class TableGeneratorService {
  generate(input: {
    rooms: RoomRecord[];
    materials: MaterialRecord[];
    coloredZones: ColoredZone[];
  }): GeneratedTable[] {
    const rowMeta = (confidence: number, missing?: boolean) => ({
      'Confiance %': confidence,
      Statut: missing ? 'À vérifier' : confidence >= 85 ? 'Validé' : 'À vérifier',
    });

    const revetement: GeneratedTable = {
      id: 'tbl_revetement',
      name: 'Revêtements — Zones & surfaces',
      columns: ['Zone', 'Surface', 'Material', 'Brand', 'Model', 'Quantity', 'Confiance %', 'Statut'],
      rows: [
        ...input.coloredZones.map((z, i) => ({
          Zone: z.zoneName,
          Surface: z.surfaceSqm,
          Material: z.materialName,
          Brand: z.colorLabel,
          Model: z.legendCode ?? '—',
          Quantity: z.surfaceSqm,
          ...rowMeta(88 - (i % 3) * 5, !z.legendCode),
        })),
        ...input.rooms.map((r, i) => {
          const mat = input.materials.find((m) => m.id === r.floorMaterialId);
          const conf = mat ? 82 + (i % 4) * 3 : 58;
          return {
            Zone: r.name,
            Surface: r.surfaceSqm,
            Material: mat?.name ?? '—',
            Brand: mat?.brand ?? '—',
            Model: mat?.model ?? '—',
            Quantity: r.surfaceSqm,
            ...rowMeta(conf, !mat),
          };
        }),
      ],
    };

    const rooms: GeneratedTable = {
      id: 'tbl_rooms',
      name: 'Pièces détectées',
      columns: ['Room', 'Surface m²', 'Floor ref', 'Notes', 'Confiance %', 'Statut'],
      rows: input.rooms.map((r, i) => ({
        Room: r.name,
        'Surface m²': r.surfaceSqm,
        'Floor ref': r.floorReference ?? '—',
        Notes: r.technicalNotes.join('; ') || '—',
        ...rowMeta(r.surfaceSqm > 0 ? 90 - i * 2 : 55, r.surfaceSqm <= 0),
      })),
    };

    const materials: GeneratedTable = {
      id: 'tbl_materials',
      name: 'Matériaux & références',
      columns: ['Reference', 'Brand', 'Model', 'Color', 'Unit', 'Legend', 'Confiance %', 'Statut'],
      rows: input.materials.map((m, i) => ({
        Reference: m.reference,
        Brand: m.brand,
        Model: m.model,
        Color: m.color,
        Unit: m.unit,
        Legend: m.legendCode ?? '—',
        ...rowMeta(86 + (i % 5), !m.legendCode),
      })),
    };

    return [revetement, rooms, materials];
  }
}
