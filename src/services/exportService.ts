import { generateAndSaveReportPdf, generatePdfDocumentNumber } from '@/services/pdf/devisPdfGenerator';
import type { PdfClientMeta } from '@/services/pdf/smartChantierPdf';

export type { PdfClientMeta };

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

export function exportToExcel(filename: string, headers: string[], rows: (string | number)[][]): void {
  exportToCsv(filename, headers, rows);
}

/** Export PDF rapport / bon de commande (titre = sous-titre du document). */
export async function exportToPdf(
  title: string,
  sections: { heading: string; lines: string[] }[],
  client?: PdfClientMeta,
  kind: 'report' | 'purchase_order' = 'report'
): Promise<void> {
  if (kind === 'purchase_order') {
    const { generateAndSavePurchaseOrderPdf } = await import('@/services/pdf/devisPdfGenerator');
    const supplier =
      sections.find((s) => s.heading.toLowerCase().includes('fournisseur'))?.lines[0] ?? 'Fournisseur';
    const lineSection = sections.find((s) => s.heading.toLowerCase().includes('ligne'));
    await generateAndSavePurchaseOrderPdf({
      documentNumber: generatePdfDocumentNumber('purchase_order'),
      supplier: supplier.split(',')[0].trim(),
      clientName: client?.clientName,
      siteAddress: client?.siteAddress,
      city: client?.city,
      lines: [
        {
          workLot: 'Commande',
          description: lineSection?.lines.join('\n') ?? title,
          quantity: 1,
          unit: 'unité',
          unitPriceHt: 0,
          tvaPercent: 20,
        },
      ],
      conditions: sections.find((s) => s.heading === 'Conditions')?.lines,
    });
    return;
  }
  await generateAndSaveReportPdf(title, sections, client);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function generateAvenantPdf(mod: {
  title: string;
  chantierName: string;
  budgetImpact: number;
}): Promise<void> {
  await exportToPdf(
    `Avenant - ${mod.title}`,
    [
      { heading: 'Chantier', lines: [mod.chantierName] },
      {
        heading: 'Impact budget (HT)',
        lines: [
          `${mod.budgetImpact.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })} HT`,
        ],
      },
      { heading: 'Statut', lines: ['Document généré — SmartChantier AI'] },
    ],
    { clientName: mod.chantierName }
  );
}
