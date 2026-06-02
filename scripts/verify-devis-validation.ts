/**
 * Valide la logique Assistant Devis IA (totaux + champs obligatoires).
 * Usage: npx tsx --tsconfig tsconfig.app.json scripts/verify-devis-validation.ts
 */
import { lineTotalHt, computeDevisTotals, createEmptyDevisDocument } from '../src/services/devisAssistant/calculator';
import {
  formatDevisPdfValidationError,
  validateDevisForPdf,
} from '../src/services/devisAssistant/validateDevisForPdf';
import { formatCurrencyPrecise } from '../src/utils/format';

const doc = createEmptyDevisDocument();
doc.clientName = 'Client Test';
doc.siteAddress = '12 rue Test';
doc.lines[0] = {
  ...doc.lines[0],
  description: 'Prestation test',
  quantity: 1,
  unit: 'unité',
  unitPriceHt: 0.05,
  tvaPercent: 20,
};

const total = lineTotalHt(doc.lines[0]);
if (total !== 0.05) {
  console.error('lineTotalHt expected 0.05 got', total);
  process.exit(1);
}

const display = formatCurrencyPrecise(total);
if (!display.includes('0,05') && !display.includes('0.05')) {
  console.error('formatCurrencyPrecise expected 0,05 got', display);
  process.exit(1);
}

const totals = computeDevisTotals(doc);
if (totals.subtotalHt !== 0.05 || totals.tvaAmount !== 0.01 || totals.totalTtc !== 0.06) {
  console.error('computeDevisTotals mismatch', totals);
  process.exit(1);
}

if (validateDevisForPdf(doc) !== null) {
  console.error('validate should pass', validateDevisForPdf(doc));
  process.exit(1);
}

const empty = createEmptyDevisDocument();
const clientErr = validateDevisForPdf(empty);
if (clientErr !== 'Nom client') {
  console.error('expected Nom client got', clientErr);
  process.exit(1);
}

empty.clientName = 'X';
const siteErr = validateDevisForPdf(empty);
if (siteErr !== 'Adresse chantier') {
  console.error('expected Adresse chantier got', siteErr);
  process.exit(1);
}

empty.siteAddress = 'Y';
empty.lines[0].description = '';
const lineErr = validateDevisForPdf(empty);
if (lineErr !== 'Ligne 1 — Description') {
  console.error('expected Ligne 1 — Description got', lineErr);
  process.exit(1);
}

console.log('OK — validation + totaux (qty=1, prix=0,05 €, TVA 20 %)');
console.log('  Total ligne HT:', formatCurrencyPrecise(total));
console.log('  Exemple erreur:', formatDevisPdfValidationError('Nom client'));
