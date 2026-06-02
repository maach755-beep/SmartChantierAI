import type { ProfessionalDevisDocument, ProfessionalDevisLine } from '@/types/professionalDevis';

export const DEVIS_PDF_FIELD_LABELS = {
  clientName: 'Nom client',
  siteAddress: 'Adresse chantier',
  lineDescription: 'Description',
  lineQuantity: 'Qté',
  lineUnit: 'Unité',
  lineUnitPrice: 'Prix unit. HT',
  lines: 'Lignes de devis',
} as const;

function lineDescription(line: ProfessionalDevisLine): string {
  return (line.description || line.productName || '').trim();
}

/** Ligne vide (modèle par défaut : qté=1 sans description ni prix). */
function isBlankLine(line: ProfessionalDevisLine): boolean {
  if (lineDescription(line)) return false;
  return !(Number.isFinite(line.unitPriceHt) && line.unitPriceHt > 0);
}

function validateLineForPdf(line: ProfessionalDevisLine, lineNo: number): string | null {
  if (isBlankLine(line)) return null;

  if (!lineDescription(line)) {
    return `Ligne ${lineNo} — ${DEVIS_PDF_FIELD_LABELS.lineDescription}`;
  }
  if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
    return `Ligne ${lineNo} — ${DEVIS_PDF_FIELD_LABELS.lineQuantity}`;
  }
  if (!line.unit?.trim()) {
    return `Ligne ${lineNo} — ${DEVIS_PDF_FIELD_LABELS.lineUnit}`;
  }
  if (!Number.isFinite(line.unitPriceHt) || line.unitPriceHt < 0) {
    return `Ligne ${lineNo} — ${DEVIS_PDF_FIELD_LABELS.lineUnitPrice}`;
  }
  return null;
}

function isExportableLine(line: ProfessionalDevisLine): boolean {
  return !isBlankLine(line) && validateLineForPdf(line, 0) === null;
}

/** Retourne le libellé du premier champ manquant/invalide, ou null si OK. */
export function validateDevisForPdf(doc: ProfessionalDevisDocument): string | null {
  if (!doc.clientName.trim()) {
    return DEVIS_PDF_FIELD_LABELS.clientName;
  }
  if (!doc.siteAddress.trim()) {
    return DEVIS_PDF_FIELD_LABELS.siteAddress;
  }

  const exportableLines = doc.lines.filter(isExportableLine);
  if (exportableLines.length > 0) {
    return null;
  }

  for (let i = 0; i < doc.lines.length; i += 1) {
    const lineError = validateLineForPdf(doc.lines[i], i + 1);
    if (lineError) return lineError;
  }

  if (doc.lines.length > 0 && !lineDescription(doc.lines[0])) {
    return `Ligne 1 — ${DEVIS_PDF_FIELD_LABELS.lineDescription}`;
  }

  return DEVIS_PDF_FIELD_LABELS.lines;
}

export function getBillableDevisLines(doc: ProfessionalDevisDocument): ProfessionalDevisLine[] {
  return doc.lines.filter(isExportableLine);
}

export function formatDevisPdfValidationError(fieldLabel: string): string {
  return `Champ obligatoire manquant ou invalide : ${fieldLabel}`;
}

export interface DevisLineValidationDiagnostic {
  lineNumber: number;
  isBlank: boolean;
  failures: string[];
  line: ProfessionalDevisLine;
}

export interface DevisPdfValidationDiagnostic {
  valid: boolean;
  failedField: string | null;
  failedLineNumber: number | null;
  requiredFields: typeof DEVIS_PDF_FIELD_LABELS;
  documentFields: {
    clientName: string;
    siteAddress: string;
    city: string;
    devisNumber: string;
    lineCount: number;
  };
  lines: DevisLineValidationDiagnostic[];
}

/** Rapport diagnostic complet — même règles que validateDevisForPdf. */
export function buildDevisPdfValidationDiagnostic(
  doc: ProfessionalDevisDocument
): DevisPdfValidationDiagnostic {
  const lines: DevisLineValidationDiagnostic[] = doc.lines.map((line, i) => {
    const blank = isBlankLine(line);
    const lineNo = i + 1;
    const fieldError = validateLineForPdf(line, lineNo);
    const failures = fieldError ? [fieldError.replace(/^Ligne \d+ — /, '')] : [];

    return { lineNumber: lineNo, isBlank: blank, failures, line };
  });

  const failedField = validateDevisForPdf(doc);
  let failedLineNumber: number | null = null;
  if (failedField?.startsWith('Ligne ')) {
    const match = /^Ligne (\d+)/.exec(failedField);
    failedLineNumber = match ? Number(match[1]) : null;
  }

  return {
    valid: failedField === null,
    failedField,
    failedLineNumber,
    requiredFields: DEVIS_PDF_FIELD_LABELS,
    documentFields: {
      clientName: doc.clientName,
      siteAddress: doc.siteAddress,
      city: doc.city,
      devisNumber: doc.devisNumber,
      lineCount: doc.lines.length,
    },
    lines,
  };
}
