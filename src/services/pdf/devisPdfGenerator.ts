import { jsPDF } from './jsPdfInstance';
import type { jsPDF as JsPdfDoc } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { APP_COUNTRY, APP_CURRENCY, TVA_RATE } from '@/config/france';
import { formatCurrencyPrecise, formatDate, formatDateTime } from '@/utils/format';
import { applyUnicodeFont, PDF_FONT_NAME, preloadPdfFonts } from './pdfFonts';

const MARGIN = 14;
const BRAND_RGB: [number, number, number] = [8, 145, 178];
const TEXT_RGB: [number, number, number] = [30, 41, 59];
const MUTED_RGB: [number, number, number] = [100, 116, 139];

export type PdfDocumentKind = 'devis' | 'purchase_order' | 'comparison' | 'report';

const KIND_CONFIG: Record<
  PdfDocumentKind,
  { mainTitle: string; numberLabel: string; filePrefix: string; numberPrefix: string }
> = {
  devis: {
    mainTitle: 'DEVIS',
    numberLabel: 'N° devis',
    filePrefix: 'Devis',
    numberPrefix: 'DEV',
  },
  purchase_order: {
    mainTitle: 'BON DE COMMANDE',
    numberLabel: 'N° bon de commande',
    filePrefix: 'Bon_commande',
    numberPrefix: 'BC',
  },
  comparison: {
    mainTitle: 'COMPARAISON PRODUITS',
    numberLabel: 'N° comparaison',
    filePrefix: 'Comparaison',
    numberPrefix: 'CMP',
  },
  report: {
    mainTitle: 'RAPPORT ACHAT',
    numberLabel: 'N° rapport',
    filePrefix: 'Rapport',
    numberPrefix: 'RPT',
  },
};

export const DEVIS_FALLBACK_LINE = {
  workLot: 'Matériaux',
  description: 'Ligne à compléter — SmartChantier AI',
  quantity: 1,
  unit: 'unité' as const,
  unitPriceHt: 0,
  tvaPercent: 20,
  supplier: 'À définir',
};

export interface DevisPdfLineInput {
  workLot: string;
  description: string;
  quantity: number;
  unit: string;
  unitPriceHt: number;
  tvaPercent?: number;
  supplier?: string;
}

export interface ComparisonPdfRow {
  product: string;
  brand: string;
  supplier: string;
  priceLabel: string;
  delay: string;
  score: number;
  decision: string;
}

export interface PdfClientMeta {
  clientName?: string;
  siteAddress?: string;
  city?: string;
  supplier?: string;
}

export interface GenerateDocumentPdfInput {
  kind: PdfDocumentKind;
  documentNumber?: string;
  date?: Date | string;
  subtitle?: string;
  client?: PdfClientMeta;
  lines?: DevisPdfLineInput[];
  comparisonRows?: ComparisonPdfRow[];
  sections?: { heading: string; lines: string[] }[];
  conditions?: string[];
  labourHt?: number;
  showTotals?: boolean;
}

export function generatePdfDocumentNumber(kind: PdfDocumentKind): string {
  const cfg = KIND_CONFIG[kind];
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 9000) + 1000);
  return `${cfg.numberPrefix}-${y}${m}${day}-${seq}`;
}

/** @deprecated alias */
export function generatePdfDevisNumber(): string {
  return generatePdfDocumentNumber('devis');
}

function lineTotalHt(line: DevisPdfLineInput): number {
  return Math.round(line.quantity * line.unitPriceHt * 100) / 100;
}

function computeTotals(lines: DevisPdfLineInput[], labourHt = 0) {
  const linesHt = lines.reduce((s, l) => s + lineTotalHt(l), 0);
  const subtotalHt = Math.round((linesHt + labourHt) * 100) / 100;
  const tvaAmount = Math.round(
    lines.reduce((s, l) => {
      const ht = lineTotalHt(l);
      const rate = (l.tvaPercent ?? Math.round(TVA_RATE * 100)) / 100;
      return s + ht * rate;
    }, 0) * 100
  ) / 100;
  const totalTtc = Math.round((subtotalHt + tvaAmount) * 100) / 100;
  return { subtotalHt, tvaAmount, totalTtc, labourHt };
}

function safeFilename(prefix: string, docNumber: string): string {
  const id = docNumber.replace(/[^\w-]+/g, '_').replace(/_+/g, '_') || 'DOC';
  return `${prefix}_${id}.pdf`;
}

function drawHeader(doc: JsPdfDoc, kind: PdfDocumentKind, subtitle?: string): number {
  const cfg = KIND_CONFIG[kind];
  let y = MARGIN;

  applyUnicodeFont(doc, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_RGB);
  doc.text('SmartChantier AI', MARGIN, y);
  y += 8;

  applyUnicodeFont(doc, 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TEXT_RGB);
  doc.text(cfg.mainTitle, MARGIN, y);
  y += 7;

  if (subtitle) {
    applyUnicodeFont(doc, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...MUTED_RGB);
    const wrapped = doc.splitTextToSize(subtitle, doc.internal.pageSize.getWidth() - MARGIN * 2);
    doc.text(wrapped, MARGIN, y);
    y += wrapped.length * 4.5 + 2;
  }

  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  doc.text(`${APP_COUNTRY} · ${APP_CURRENCY}`, MARGIN, y);
  return y + 8;
}

function drawMetaGrid(
  doc: JsPdfDoc,
  kind: PdfDocumentKind,
  docNumber: string,
  dateLabel: string,
  client?: PdfClientMeta,
  subtitle?: string
): number {
  const cfg = KIND_CONFIG[kind];
  const pageWidth = doc.internal.pageSize.getWidth();
  const colWidth = (pageWidth - MARGIN * 2 - 8) / 2;
  let y = drawHeader(doc, kind, subtitle);

  const left: [string, string][] = [
    [cfg.numberLabel, docNumber],
    ['Date', dateLabel],
    ['Client', client?.clientName || '—'],
  ];
  const right: [string, string][] = [
    ['Chantier / adresse', client?.siteAddress || '—'],
    ['Ville', client?.city || '—'],
    ...(client?.supplier ? [['Fournisseur', client.supplier] as [string, string]] : []),
  ];

  const rows = Math.max(left.length, right.length);
  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(9);

  for (let r = 0; r < rows; r++) {
    const rowY = y + r * 14;
    const drawCell = (x: number, pair?: [string, string]) => {
      if (!pair) return;
      const [label, value] = pair;
      doc.setTextColor(...MUTED_RGB);
      doc.text(`${label}`, x, rowY);
      doc.setTextColor(...TEXT_RGB);
      applyUnicodeFont(doc, 'bold');
      const wrapped = doc.splitTextToSize(value, colWidth);
      doc.text(wrapped, x, rowY + 4);
      applyUnicodeFont(doc, 'normal');
    };
    drawCell(MARGIN, left[r]);
    drawCell(MARGIN + colWidth + 8, right[r]);
  }

  return y + rows * 14 + 6;
}

function drawTotalsBlock(
  doc: JsPdfDoc,
  startY: number,
  totals: { subtotalHt: number; tvaAmount: number; totalTtc: number }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;
  const rows: [string, string, boolean][] = [
    ['Total HT', formatCurrencyPrecise(totals.subtotalHt), false],
    ['TVA', formatCurrencyPrecise(totals.tvaAmount), false],
    ['Total TTC', formatCurrencyPrecise(totals.totalTtc), true],
  ];

  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(10);
  rows.forEach(([label, value, highlight]) => {
    if (highlight) {
      applyUnicodeFont(doc, 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...BRAND_RGB);
    } else {
      applyUnicodeFont(doc, 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_RGB);
    }
    doc.text(label, pageWidth - MARGIN - 72, y);
    doc.text(value, pageWidth - MARGIN, y, { align: 'right' });
    y += highlight ? 9 : 7;
  });
  return y + 4;
}

function drawConditions(doc: JsPdfDoc, startY: number, conditions: string[]): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = startY;
  applyUnicodeFont(doc, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...TEXT_RGB);
  doc.text('Conditions', MARGIN, y);
  y += 6;

  applyUnicodeFont(doc, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_RGB);
  conditions.forEach((c) => {
    const w = doc.splitTextToSize(c, pageWidth - MARGIN * 2);
    doc.text(w, MARGIN, y);
    y += w.length * 4.2 + 2;
  });
  return y;
}

function buildDocument(doc: JsPdfDoc, input: GenerateDocumentPdfInput): void {
  const docNumber = input.documentNumber ?? generatePdfDocumentNumber(input.kind);
  const dateLabel =
    typeof input.date === 'string'
      ? formatDate(input.date)
      : formatDate((input.date ?? new Date()).toISOString());

  let y = drawMetaGrid(doc, input.kind, docNumber, dateLabel, input.client, input.subtitle);

  if (input.comparisonRows && input.comparisonRows.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Produit', 'Marque', 'Fournisseur', 'Prix HT', 'Délai', 'Score', 'Décision']],
      body: input.comparisonRows.map((r) => [
        r.product,
        r.brand,
        r.supplier,
        r.priceLabel,
        r.delay,
        String(r.score),
        r.decision,
      ]),
      styles: {
        font: PDF_FONT_NAME,
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        font: PDF_FONT_NAME,
        fillColor: BRAND_RGB,
        textColor: [255, 255, 255],
        fontStyle: 'normal',
        halign: 'center',
      },
      didParseCell: (data) => {
        if (data.section === 'head' || data.section === 'body') {
          data.cell.styles.font = PDF_FONT_NAME;
        }
      },
      columnStyles: {
        0: { cellWidth: 32 },
        3: { halign: 'right', cellWidth: 22 },
        5: { halign: 'center', cellWidth: 14 },
        6: { cellWidth: 24 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as JsPdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else if (input.lines && input.lines.length > 0) {
    const lines = input.lines;
    const tableBody = lines.map((line) => {
      let desc = line.description;
      if (line.supplier) desc += `\n${line.supplier}`;
      return [
        line.workLot || '—',
        desc,
        String(line.quantity),
        line.unit,
        formatCurrencyPrecise(line.unitPriceHt),
        `${line.tvaPercent ?? Math.round(TVA_RATE * 100)} %`,
        formatCurrencyPrecise(lineTotalHt(line)),
      ];
    });

    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Lot', 'Description', 'Qté', 'Unité', 'Prix unit. HT', 'TVA', 'Total HT']],
      body: tableBody,
      styles: {
        font: PDF_FONT_NAME,
        fontSize: 8,
        cellPadding: 2.5,
        overflow: 'linebreak',
        valign: 'top',
      },
      headStyles: {
        font: PDF_FONT_NAME,
        fillColor: BRAND_RGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      didParseCell: (data) => {
        if (data.section === 'head' || data.section === 'body') {
          data.cell.styles.font = PDF_FONT_NAME;
        }
      },
      columnStyles: {
        0: { cellWidth: 18 },
        2: { halign: 'right', cellWidth: 12 },
        3: { cellWidth: 14 },
        4: { halign: 'right', cellWidth: 24 },
        5: { halign: 'center', cellWidth: 14 },
        6: { halign: 'right', cellWidth: 24 },
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    y = (doc as JsPdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    if (input.showTotals !== false && input.kind !== 'comparison') {
      const totals = computeTotals(lines, input.labourHt ?? 0);
      y = drawTotalsBlock(doc, y, totals);
    }
  } else if (input.sections && input.sections.length > 0) {
    const body: string[][] = [];
    for (const section of input.sections) {
      const lines = section.lines.length > 0 ? section.lines : ['—'];
      lines.forEach((line, idx) => {
        body.push([idx === 0 ? section.heading : '', line]);
      });
    }
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Rubrique', 'Détail']],
      body,
      styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 3, overflow: 'linebreak' },
      headStyles: { font: PDF_FONT_NAME, fillColor: BRAND_RGB, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' } },
    });
    y = (doc as JsPdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN },
      head: [['Information', 'Détail']],
      body: [['—', 'Aucune donnée — complétez le document dans SmartChantier AI']],
      styles: { font: PDF_FONT_NAME, fontSize: 9, cellPadding: 3 },
      headStyles: { font: PDF_FONT_NAME, fillColor: BRAND_RGB, textColor: [255, 255, 255], fontStyle: 'bold' },
    });
    y = (doc as JsPdfDoc & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  }

  const defaultConditions =
    input.kind === 'purchase_order'
      ? [
          'Bon de commande établi sous réserve de confirmation fournisseur.',
          'Marché France — prix en EUR HT — TVA selon régime applicable.',
          `Document généré le ${formatDateTime(new Date())} — SmartChantier AI.`,
        ]
      : input.kind === 'devis'
        ? [
            'Validité du devis : 30 jours à compter de la date d\'émission.',
            'Prix indicatifs à confirmer auprès des fournisseurs — France, EUR.',
          ]
        : [
            'Document indicatif SmartChantier AI — France · EUR.',
            'Informations à valider avant engagement.',
          ];

  drawConditions(doc, y, input.conditions ?? defaultConditions);
}

export const MIN_PDF_BYTES = 20_000;

function assertValidPdf(doc: JsPdfDoc, minBytes = MIN_PDF_BYTES): Uint8Array {
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
  if (header !== '%PDF-') {
    throw new Error('Le fichier généré n\'est pas un PDF valide.');
  }
  if (bytes.length < minBytes) {
    throw new Error(`Le PDF généré est trop petit (${bytes.length} octets, minimum ${minBytes}).`);
  }
  return bytes;
}

async function createDocumentPdf(input: GenerateDocumentPdfInput): Promise<{ doc: JsPdfDoc; docNumber: string }> {
  await preloadPdfFonts();
  const doc = new jsPDF('p', 'mm', 'a4');
  applyUnicodeFont(doc, 'normal');

  const docNumber = input.documentNumber ?? generatePdfDocumentNumber(input.kind);
  buildDocument(doc, { ...input, documentNumber: docNumber });
  assertValidPdf(doc);
  return { doc, docNumber };
}

export async function generateAndSaveDocumentPdf(input: GenerateDocumentPdfInput): Promise<void> {
  const { doc, docNumber } = await createDocumentPdf(input);
  const cfg = KIND_CONFIG[input.kind];
  doc.save(safeFilename(cfg.filePrefix, docNumber));
}

/** Génère un PDF binaire pour tout type de document (tests CI). */
export async function generateDocumentPdfBytes(input: GenerateDocumentPdfInput): Promise<Uint8Array> {
  const { doc } = await createDocumentPdf(input);
  return assertValidPdf(doc);
}

/** Génère un devis binaire (tests CI / validation sans doc.save). */
export async function generateDevisPdfBytes(
  input: Omit<GenerateDocumentPdfInput, 'kind'> & {
    devisNumber: string;
    clientName: string;
    siteAddress: string;
    city?: string;
    lines: DevisPdfLineInput[];
    labourHt?: number;
    conditions?: string[];
  }
): Promise<Uint8Array> {
  const { doc } = await createDocumentPdf({
    kind: 'devis',
    documentNumber: input.devisNumber,
    date: input.date,
    client: {
      clientName: input.clientName,
      siteAddress: input.siteAddress,
      city: input.city,
    },
    lines: input.lines.length > 0 ? input.lines : [{ ...DEVIS_FALLBACK_LINE }],
    labourHt: input.labourHt,
    conditions: input.conditions,
    showTotals: true,
  });
  return assertValidPdf(doc);
}

/** Devis uniquement */
export async function generateAndSaveDevisPdf(
  input: Omit<GenerateDocumentPdfInput, 'kind'> & {
    devisNumber: string;
    clientName: string;
    siteAddress: string;
    city?: string;
    lines: DevisPdfLineInput[];
    labourHt?: number;
    conditions?: string[];
  }
): Promise<void> {
  await generateAndSaveDocumentPdf({
    kind: 'devis',
    documentNumber: input.devisNumber,
    date: input.date,
    client: {
      clientName: input.clientName,
      siteAddress: input.siteAddress,
      city: input.city,
    },
    lines: input.lines.length > 0 ? input.lines : [{ ...DEVIS_FALLBACK_LINE }],
    labourHt: input.labourHt,
    conditions: input.conditions,
    showTotals: true,
  });
}

export async function generateAndSavePurchaseOrderPdf(params: {
  documentNumber?: string;
  supplier: string;
  clientName?: string;
  siteAddress?: string;
  city?: string;
  lines: DevisPdfLineInput[];
  conditions?: string[];
}): Promise<void> {
  await generateAndSaveDocumentPdf({
    kind: 'purchase_order',
    documentNumber: params.documentNumber,
    date: new Date(),
    subtitle: `Fournisseur : ${params.supplier}`,
    client: {
      clientName: params.clientName,
      siteAddress: params.siteAddress,
      city: params.city,
      supplier: params.supplier,
    },
    lines: params.lines.length > 0 ? params.lines : [{ ...DEVIS_FALLBACK_LINE }],
    conditions: params.conditions,
    showTotals: true,
  });
}

export async function generateAndSaveComparisonPdf(params: {
  documentNumber?: string;
  client?: PdfClientMeta;
  rows: ComparisonPdfRow[];
  recommendation?: string;
}): Promise<void> {
  if (params.rows.length === 0) {
    throw new Error('Aucun produit à comparer. Lancez d\'abord une recherche.');
  }
  await generateAndSaveDocumentPdf({
    kind: 'comparison',
    documentNumber: params.documentNumber,
    date: new Date(),
    client: params.client,
    comparisonRows: params.rows,
    conditions: params.recommendation
      ? [`Recommandation : ${params.recommendation.replace(/\*\*/g, '')}`]
      : undefined,
    showTotals: false,
  });
}

export async function generateAndSaveReportPdf(
  title: string,
  sections: { heading: string; lines: string[] }[],
  client?: PdfClientMeta
): Promise<void> {
  await generateAndSaveDocumentPdf({
    kind: 'report',
    date: new Date(),
    subtitle: title,
    client,
    sections,
    showTotals: false,
  });
}

/** @deprecated */
export async function generateAndSaveSectionsPdf(
  _devisNumber: string,
  documentTitle: string,
  sections: { heading: string; lines: string[] }[],
  client?: PdfClientMeta
): Promise<void> {
  await generateAndSaveReportPdf(documentTitle, sections, client);
}
