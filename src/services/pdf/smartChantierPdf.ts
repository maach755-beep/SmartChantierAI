export {
  DEVIS_FALLBACK_LINE,
  generateAndSaveComparisonPdf,
  generateAndSaveDevisPdf,
  generateAndSaveDocumentPdf,
  generateAndSavePurchaseOrderPdf,
  generateAndSaveReportPdf,
  generateAndSaveSectionsPdf,
  generatePdfDevisNumber,
  generatePdfDocumentNumber,
  type ComparisonPdfRow,
  type DevisPdfLineInput,
  type GenerateDocumentPdfInput,
  type PdfClientMeta,
  type PdfDocumentKind,
} from './devisPdfGenerator';

export { preloadPdfFonts } from './pdfFonts';

export interface PdfClientInfo {
  clientName?: string;
  siteAddress?: string;
  city?: string;
  projectType?: string;
  observations?: string;
}

export async function exportSectionsToPdf(
  title: string,
  sections: { heading: string; lines: string[] }[],
  client?: PdfClientInfo
): Promise<void> {
  const { generateAndSaveReportPdf } = await import('./devisPdfGenerator');
  await generateAndSaveReportPdf(title, sections, client);
}

export async function exportDevisLinesToPdf(
  title: string,
  lines: import('./devisPdfGenerator').DevisPdfLineInput[],
  client?: PdfClientInfo
): Promise<void> {
  const { generateAndSaveDevisPdf, generatePdfDocumentNumber } = await import('./devisPdfGenerator');
  await generateAndSaveDevisPdf({
    devisNumber: generatePdfDocumentNumber('devis'),
    date: new Date(),
    clientName: client?.clientName ?? '—',
    siteAddress: client?.siteAddress ?? 'France',
    city: client?.city,
    lines,
    conditions: [`${title} — SmartChantier AI`],
  });
}
