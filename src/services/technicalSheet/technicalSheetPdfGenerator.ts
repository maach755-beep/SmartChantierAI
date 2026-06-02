import { jsPDF } from '@/services/pdf/jsPdfInstance';
import type { jsPDF as JsPdfDoc } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyUnicodeFont, PDF_FONT_NAME, preloadPdfFonts } from '@/services/pdf/pdfFonts';
import { formatDate } from '@/utils/format';
import type { TechnicalSheetDocument, TechnicalSheetPdfLabels } from '@/types/technicalSheet';

const MARGIN = 14;
const BRAND_RGB: [number, number, number] = [8, 145, 178];
const TEXT_RGB: [number, number, number] = [30, 41, 59];
const MUTED_RGB: [number, number, number] = [100, 116, 139];

function safeFilename(sheetNumber: string): string {
  const id = sheetNumber.replace(/[^\w-]+/g, '_').replace(/_+/g, '_') || 'FT';
  return `Fiche_technique_${id}.pdf`;
}

function drawHeader(doc: JsPdfDoc, labels: TechnicalSheetPdfLabels, sheet: TechnicalSheetDocument): number {
  let y = MARGIN;
  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_RGB);
  doc.text('SmartChantier AI', MARGIN, y);
  y += 8;

  doc.setFontSize(15);
  doc.setTextColor(...TEXT_RGB);
  doc.text(labels.title, MARGIN, y);
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  doc.text(`${labels.sheetNumber} : ${sheet.sheetNumber}`, MARGIN, y);
  y += 5;
  doc.text(`${labels.generatedAt} : ${formatDate(sheet.generatedAt)}`, MARGIN, y);
  return y + 8;
}

function drawImageBlock(doc: JsPdfDoc, sheet: TechnicalSheetDocument, labels: TechnicalSheetPdfLabels, startY: number): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const boxW = 52;
  const boxH = 40;
  const x = pageWidth - MARGIN - boxW;
  const y = startY;

  if (sheet.imageDataUrl) {
    try {
      doc.addImage(sheet.imageDataUrl, 'JPEG', x, y, boxW, boxH, undefined, 'FAST');
      return y + boxH + 6;
    } catch {
      /* placeholder below */
    }
  }

  doc.setDrawColor(...MUTED_RGB);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, boxW, boxH, 2, 2, 'FD');
  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED_RGB);
  const lines = doc.splitTextToSize(labels.noImage, boxW - 4);
  doc.text(lines, x + boxW / 2, y + boxH / 2, { align: 'center' });
  return y + boxH + 6;
}

function buildTechnicalSheetPdf(doc: JsPdfDoc, sheet: TechnicalSheetDocument, labels: TechnicalSheetPdfLabels): void {
  let y = drawHeader(doc, labels, sheet);
  y = drawImageBlock(doc, sheet, labels, MARGIN + 4);

  const metaRows: [string, string][] = [
    [labels.productName, sheet.productName],
    [labels.reference, sheet.reference],
    [labels.brand, sheet.brand],
    [labels.supplier, sheet.supplier],
    [labels.supplierUrl, sheet.supplierUrl || '—'],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[labels.specLabel, labels.specValue]],
    body: metaRows,
    styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { font: PDF_FONT_NAME, fillColor: BRAND_RGB, textColor: [255, 255, 255], fontStyle: 'normal' },
    columnStyles: { 0: { cellWidth: 42, fontStyle: 'normal', textColor: MUTED_RGB } },
    didParseCell: (data) => {
      if (data.section === 'head' || data.section === 'body') {
        data.cell.styles.font = PDF_FONT_NAME;
      }
    },
  });

  y = (doc as JsPdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_RGB);
  doc.text(labels.description, MARGIN, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  const descLines = doc.splitTextToSize(sheet.description, doc.internal.pageSize.getWidth() - MARGIN * 2);
  doc.text(descLines, MARGIN, y);
  y += descLines.length * 4.5 + 6;

  const specBody: [string, string][] = sheet.specifications.map((s) => [s.label, s.value]);
  const detailRows: [string, string][] = [
    [labels.dimensions, sheet.dimensions],
    [labels.weight, sheet.weight],
    [labels.material, sheet.material],
    [labels.color, sheet.color],
    [labels.standards, sheet.standards],
    [labels.fireRating, sheet.fireRating],
    [labels.warranty, sheet.warranty],
    ...specBody,
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[labels.specifications, '']],
    body: detailRows.map(([a, b]) => [a, b]),
    styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { font: PDF_FONT_NAME, fillColor: BRAND_RGB, textColor: [255, 255, 255], fontStyle: 'normal' },
    columnStyles: { 0: { cellWidth: 48, fontStyle: 'normal', textColor: MUTED_RGB } },
    didParseCell: (data) => {
      if (data.section === 'head' || data.section === 'body') {
        data.cell.styles.font = PDF_FONT_NAME;
      }
    },
  });
}

function assertValidPdf(doc: JsPdfDoc): void {
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
  if (header !== '%PDF-' || bytes.length < 3000) {
    throw new Error('Le fichier généré n\'est pas un PDF valide.');
  }
}

export async function generateAndSaveTechnicalSheetPdf(
  sheet: TechnicalSheetDocument,
  labels: TechnicalSheetPdfLabels
): Promise<void> {
  await preloadPdfFonts();
  const doc = new jsPDF('p', 'mm', 'a4');
  applyUnicodeFont(doc, 'normal');
  buildTechnicalSheetPdf(doc, sheet, labels);
  assertValidPdf(doc);
  doc.save(safeFilename(sheet.sheetNumber));
}
