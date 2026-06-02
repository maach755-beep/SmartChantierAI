/**
 * Valide le générateur Assistant Devis IA : %PDF-, taille >= 20 Ko, champs requis.
 * Usage: npx tsx scripts/verify-devis-pdf.ts
 */
import pdfParse from 'pdf-parse';
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateDevisPdfBytes } from '../src/services/pdf/devisPdfGenerator';

const MIN_BYTES = 20_000;

const bytes = await generateDevisPdfBytes({
  devisNumber: 'DEV-20250531-9999',
  date: new Date('2025-05-31'),
  clientName: 'M. Dupont — Promoteur',
  siteAddress: '12 rue des Artisans, terrasse 80 m²',
  city: 'Nice',
  lines: [
    {
      workLot: 'Matériaux',
      description: 'Carrelage extérieur 60×60 grès cérame — 35 €/m²',
      supplier: 'Point P Nice',
      quantity: 80,
      unit: 'm²',
      unitPriceHt: 35,
      tvaPercent: 20,
    },
    {
      workLot: 'Matériaux',
      description: 'Colle flexible extérieur — sac 25 kg',
      supplier: 'Leroy Merlin',
      quantity: 8,
      unit: 'sac',
      unitPriceHt: 18.5,
      tvaPercent: 20,
    },
    {
      workLot: 'Main d\'œuvre',
      description: 'Pose carrelage terrasse — forfait',
      quantity: 1,
      unit: 'forfait',
      unitPriceHt: 2400,
      tvaPercent: 20,
    },
  ],
  labourHt: 0,
  conditions: [
    'Validité du devis : 30 jours à compter de la date d\'émission.',
    'Prix indicatifs à confirmer auprès des fournisseurs — France, EUR.',
    'Observations : chantier accès difficile — prévoir nacelle.',
  ],
});

const header = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
if (header !== '%PDF-') {
  console.error('Invalid PDF header:', header);
  process.exit(1);
}
if (bytes.length < MIN_BYTES) {
  console.error(`PDF too small: ${bytes.length} bytes (min ${MIN_BYTES})`);
  process.exit(1);
}

const text = (await pdfParse(Buffer.from(bytes))).text;
const required = [
  'SmartChantier',
  'DEVIS',
  'DEV-20250531-9999',
  'Total HT',
  'TVA',
  'Total TTC',
  'Conditions',
];
const missing = required.filter((s) => !text.includes(s));
if (missing.length > 0) {
  console.error('Missing PDF content:', missing.join(', '));
  process.exit(1);
}

const out = 'tmp/verify-devis-assistant.pdf';
mkdirSync('tmp', { recursive: true });
writeFileSync(out, bytes);
console.log(`OK — PDF valide, ${bytes.length} octets (>= 20 Ko), écrit ${out}`);
