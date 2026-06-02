import { computeDevisTotals } from './calculator';
import {
  formatDevisPdfValidationError,
  getBillableDevisLines,
  validateDevisForPdf,
} from './validateDevisForPdf';
import {
  generateAndSaveDevisPdf,
  type DevisPdfLineInput,
} from '@/services/pdf/devisPdfGenerator';
import type { ProfessionalDevisDocument, ProfessionalDevisLine } from '@/types/professionalDevis';

export interface DevisPdfLabels {
  title: string;
  devisNumber: string;
  date: string;
  client: string;
  site: string;
  city: string;
  projectType: string;
  colLot: string;
  colDescription: string;
  colQty: string;
  colUnit: string;
  colUnitPrice: string;
  colLineTotal: string;
  colTva: string;
  labour: string;
  subtotalHt: string;
  tvaTotal: string;
  totalTtc: string;
  margin: string;
  clientBudget: string;
  budgetVariance: string;
  observations: string;
  conditionsTitle: string;
  conditions1: string;
  conditions2: string;
  signature: string;
  signatureClient: string;
  currencyNote: string;
}

function toPdfLine(line: ProfessionalDevisLine): DevisPdfLineInput {
  let description = line.description || line.productName || '—';
  if (line.productUrl) {
    const url =
      line.productUrl.length > 60 ? `${line.productUrl.slice(0, 60)}…` : line.productUrl;
    description += ` (${url})`;
  }
  return {
    workLot: line.workLot,
    description,
    supplier: line.supplier,
    quantity: line.quantity,
    unit: line.unit,
    unitPriceHt: line.unitPriceHt,
    tvaPercent: line.tvaPercent,
  };
}

/** PDF binaire via jsPDF — téléchargement uniquement par doc.save(). */
export async function exportProfessionalDevisPdf(
  doc: ProfessionalDevisDocument,
  labels: DevisPdfLabels
): Promise<void> {
  const invalidField = validateDevisForPdf(doc);
  if (invalidField) {
    throw new Error(formatDevisPdfValidationError(invalidField));
  }

  const billableLines = getBillableDevisLines(doc);
  const exportDoc: ProfessionalDevisDocument = { ...doc, lines: billableLines };
  const totals = computeDevisTotals(exportDoc);
  const lines = billableLines.map(toPdfLine);

  await generateAndSaveDevisPdf({
    devisNumber: doc.devisNumber,
    date: doc.createdAt,
    clientName: doc.clientName.trim(),
    siteAddress: doc.siteAddress.trim(),
    city: doc.city.trim() || undefined,
    lines,
    labourHt: totals.labourHt,
    conditions: [
      labels.conditions1,
      labels.conditions2,
      doc.observations.trim() || undefined,
    ].filter((c): c is string => Boolean(c)),
  });
}
