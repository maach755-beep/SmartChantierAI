import { jsPDF } from '@/services/pdf/jsPdfInstance';
import type { jsPDF as JsPdfDoc } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyUnicodeFont, PDF_FONT_NAME, preloadPdfFonts } from '@/services/pdf/pdfFonts';
import { formatDate } from '@/utils/format';
import type {
  FicheTechniquePdfLabels,
  TechnicalSheetComparison,
  TechnicalSheetProduct,
} from '@/types/ficheTechnique';

const MARGIN = 14;
const BRAND_RGB: [number, number, number] = [8, 145, 178];
const TEXT_RGB: [number, number, number] = [30, 41, 59];
const MUTED_RGB: [number, number, number] = [100, 116, 139];
const WARN_RGB: [number, number, number] = [180, 83, 9];

function safeFilename(name: string, prefix: string): string {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w-]+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 40) || 'Produit';
  const date = new Date().toISOString().slice(0, 10);
  return `${prefix}_${slug}_${date}.pdf`;
}

function confidenceLabel(sheet: TechnicalSheetProduct, labels: FicheTechniquePdfLabels): string {
  if (sheet.isProvisional) return labels.provisionalBanner;
  if (sheet.confidence === 'confirme') return labels.confidenceConfirme;
  if (sheet.confidence === 'a_verifier') return labels.confidenceAVerifier;
  return labels.confidenceEstimee;
}

function drawFooter(doc: JsPdfDoc, labels: FicheTechniquePdfLabels): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED_RGB);
  doc.text(labels.footer, pageWidth / 2, pageHeight - 8, { align: 'center' });
}

function drawHeader(doc: JsPdfDoc, title: string, subtitle: string): number {
  let y = MARGIN;
  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_RGB);
  doc.text('SmartChantier AI', MARGIN, y);
  y += 8;
  doc.setFontSize(15);
  doc.setTextColor(...TEXT_RGB);
  doc.text(title, MARGIN, y);
  y += 7;
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  doc.text(subtitle, MARGIN, y);
  return y + 10;
}

function drawProvisionalBanner(doc: JsPdfDoc, labels: FicheTechniquePdfLabels, y: number): number {
  applyUnicodeFont(doc, 'normal');
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(...WARN_RGB);
  doc.roundedRect(MARGIN, y, doc.internal.pageSize.getWidth() - MARGIN * 2, 10, 1, 1, 'FD');
  doc.setFontSize(8);
  doc.setTextColor(...WARN_RGB);
  doc.text(labels.provisionalBanner, MARGIN + 3, y + 6.5);
  return y + 14;
}

function specRows(sheet: TechnicalSheetProduct, labels: FicheTechniquePdfLabels): [string, string][] {
  const val = (v: string) => (v?.trim() && v !== '—' ? v : '—');
  return [
    [labels.productName, val(sheet.productName)],
    [labels.reference, val(sheet.reference)],
    [labels.brand, val(sheet.brand)],
    [labels.manufacturer, val(sheet.manufacturer)],
    [labels.supplier, val(sheet.supplier)],
    [labels.category, val(sheet.category)],
    [labels.dimensions, val(sheet.dimensions)],
    [labels.thickness, val(sheet.thickness)],
    [labels.weight, val(sheet.weight)],
    [labels.material, val(sheet.material)],
    [labels.color, val(sheet.color)],
    [labels.finish, val(sheet.finish)],
    [labels.indoorOutdoorUse, val(sheet.indoorOutdoorUse)],
    [labels.resistance, val(sheet.resistance)],
    [labels.fireClassification, val(sheet.fireClassification)],
    [labels.thermalPerformance, val(sheet.thermalPerformance)],
    [labels.acousticPerformance, val(sheet.acousticPerformance)],
    [labels.slipResistance, val(sheet.slipResistance)],
    [labels.waterResistance, val(sheet.waterResistance)],
    [labels.uvResistance, val(sheet.uvResistance)],
    [labels.loadResistance, val(sheet.loadResistance)],
    [labels.certifications, val(sheet.certifications)],
    [labels.ceStandards, val(sheet.ceStandards)],
    [labels.normes, val(sheet.normes)],
    [labels.warranty, val(sheet.warranty)],
    [labels.countryOfOrigin, val(sheet.countryOfOrigin)],
  ];
}

function buildSheetPdf(doc: JsPdfDoc, sheet: TechnicalSheetProduct, labels: FicheTechniquePdfLabels): void {
  let y = drawHeader(
    doc,
    labels.title,
    `${labels.generatedAt} : ${formatDate(sheet.generatedAt)} · ${labels.confidence} : ${confidenceLabel(sheet, labels)}`
  );

  if (sheet.isProvisional) {
    y = drawProvisionalBanner(doc, labels, y);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [[labels.specLabel, labels.specValue]],
    body: specRows(sheet, labels),
    styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
    headStyles: { font: PDF_FONT_NAME, fillColor: BRAND_RGB, textColor: [255, 255, 255], fontStyle: 'normal' },
    columnStyles: { 0: { cellWidth: 52, textColor: MUTED_RGB } },
    didParseCell: (data) => {
      if (data.section === 'head' || data.section === 'body') data.cell.styles.font = PDF_FONT_NAME;
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
  const desc = doc.splitTextToSize(sheet.description || '—', doc.internal.pageSize.getWidth() - MARGIN * 2);
  doc.text(desc, MARGIN, y);
  y += desc.length * 4.5 + 6;

  doc.setFontSize(10);
  doc.setTextColor(...TEXT_RGB);
  doc.text(labels.usageRecommendations, MARGIN, y);
  y += 5;
  doc.setFontSize(9);
  const usage = doc.splitTextToSize(
    sheet.useCase !== '—' ? sheet.useCase : 'Usage à confirmer selon DTU et cahier des charges chantier.',
    doc.internal.pageSize.getWidth() - MARGIN * 2
  );
  doc.text(usage, MARGIN, y);
  y += usage.length * 4.5 + 6;

  const sources = sheet.sourceUrls.length > 0 ? sheet.sourceUrls : [sheet.productUrl, sheet.supplierUrl].filter(Boolean);
  if (sources.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_RGB);
    doc.text(labels.sources, MARGIN, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...BRAND_RGB);
    for (const url of sources.slice(0, 5)) {
      if (url && url !== '—') {
        const lines = doc.splitTextToSize(url, doc.internal.pageSize.getWidth() - MARGIN * 2);
        doc.text(lines, MARGIN, y);
        y += lines.length * 3.5 + 2;
      }
    }
  }

  if (sheet.notes?.trim()) {
    y += 4;
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_RGB);
    doc.text(labels.notes, MARGIN, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_RGB);
    const noteLines = doc.splitTextToSize(sheet.notes, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(noteLines, MARGIN, y);
  }

  drawFooter(doc, labels);
}

function buildComparisonPdf(doc: JsPdfDoc, comparison: TechnicalSheetComparison, labels: FicheTechniquePdfLabels): void {
  let y = drawHeader(
    doc,
    labels.comparisonTitle,
    `${labels.generatedAt} : ${formatDate(comparison.generatedAt)}`
  );

  const head = [labels.productName, ...comparison.products.map((p) => p.productName.slice(0, 28))];
  const rows: string[][] = [
    [labels.brand, ...comparison.products.map((p) => p.brand)],
    [labels.supplier, ...comparison.products.map((p) => p.supplier)],
    [labels.reference, ...comparison.products.map((p) => p.reference)],
    [labels.material, ...comparison.products.map((p) => p.material)],
    [labels.dimensions, ...comparison.products.map((p) => p.dimensions)],
    [labels.slipResistance, ...comparison.products.map((p) => p.slipResistance)],
    [labels.warranty, ...comparison.products.map((p) => p.warranty)],
    [labels.confidence, ...comparison.products.map((p) => confidenceLabel(p, labels))],
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [head],
    body: rows,
    styles: { font: PDF_FONT_NAME, fontSize: 8, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { font: PDF_FONT_NAME, fillColor: BRAND_RGB, textColor: [255, 255, 255], fontStyle: 'normal' },
    didParseCell: (data) => {
      if (data.section === 'head' || data.section === 'body') data.cell.styles.font = PDF_FONT_NAME;
    },
  });

  y = (doc as JsPdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

  for (const p of comparison.products) {
    applyUnicodeFont(doc, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_RGB);
    doc.text(p.productName.slice(0, 60), MARGIN, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(...MUTED_RGB);
    const adv = (comparison.advantages[p.id] ?? []).join(' · ') || '—';
    const dis = (comparison.disadvantages[p.id] ?? []).join(' · ') || '—';
    doc.text(`${labels.advantages} : ${adv}`, MARGIN, y);
    y += 4;
    doc.text(`${labels.disadvantages} : ${dis}`, MARGIN, y);
    y += 4;
    doc.text(`${labels.suitability} : ${comparison.suitability[p.id] ?? '—'}`, MARGIN, y);
    y += 8;
  }

  const recommended = comparison.products.find((p) => p.id === comparison.recommendedProductId);
  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_RGB);
  doc.text(`${labels.recommendedProduct} : ${recommended?.productName ?? '—'}`, MARGIN, y);
  y += 5;
  doc.setFontSize(9);
  doc.setTextColor(...TEXT_RGB);
  const reason = doc.splitTextToSize(comparison.recommendationReason, doc.internal.pageSize.getWidth() - MARGIN * 2);
  doc.text(reason, MARGIN, y);

  drawFooter(doc, labels);
}

function assertValidPdf(bytes: Uint8Array): void {
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
  if (header !== '%PDF-' || bytes.length < 3000) {
    throw new Error('Le fichier généré n\'est pas un PDF valide.');
  }
}

export async function generateFicheTechniquePdfBytes(
  sheet: TechnicalSheetProduct,
  labels: FicheTechniquePdfLabels
): Promise<Uint8Array> {
  await preloadPdfFonts();
  const doc = new jsPDF('p', 'mm', 'a4');
  applyUnicodeFont(doc, 'normal');
  buildSheetPdf(doc, sheet, labels);
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  assertValidPdf(bytes);
  return bytes;
}

export async function generateAndSaveFicheTechniquePdf(
  sheet: TechnicalSheetProduct,
  labels: FicheTechniquePdfLabels
): Promise<void> {
  await preloadPdfFonts();
  const doc = new jsPDF('p', 'mm', 'a4');
  applyUnicodeFont(doc, 'normal');
  buildSheetPdf(doc, sheet, labels);
  assertValidPdf(new Uint8Array(doc.output('arraybuffer')));
  doc.save(safeFilename(sheet.productName, 'Fiche_Technique'));
}

export async function generateComparisonPdfBytes(
  comparison: TechnicalSheetComparison,
  labels: FicheTechniquePdfLabels
): Promise<Uint8Array> {
  await preloadPdfFonts();
  const doc = new jsPDF('p', 'mm', 'a4');
  applyUnicodeFont(doc, 'normal');
  buildComparisonPdf(doc, comparison, labels);
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  assertValidPdf(bytes);
  return bytes;
}

export async function generateAndSaveComparisonPdf(
  comparison: TechnicalSheetComparison,
  labels: FicheTechniquePdfLabels
): Promise<void> {
  await preloadPdfFonts();
  const doc = new jsPDF('p', 'mm', 'a4');
  applyUnicodeFont(doc, 'normal');
  buildComparisonPdf(doc, comparison, labels);
  assertValidPdf(new Uint8Array(doc.output('arraybuffer')));
  doc.save(safeFilename('Comparatif', 'Comparatif_Technique'));
}
