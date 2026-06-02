/**
 * Vérifie le PDF jsPDF : en-tête %PDF-, taille >= 20 Ko.
 * Usage: node scripts/verify-devis-pdf.mjs
 */
import jspdfModule from 'jspdf';
import autoTable from 'jspdf-autotable';

const MIN_BYTES = 20_000;
const LEGAL = `SmartChantier AI France EUR BTP. Validité 30 jours. Prix indicatifs fournisseurs. `.repeat(200);

const JsPDF =
  typeof jspdfModule === 'function'
    ? jspdfModule
    : jspdfModule.jsPDF || jspdfModule.default;

if (typeof JsPDF !== 'function') {
  console.error('jsPDF constructor not found');
  process.exit(1);
}

function build() {
  const doc = new JsPDF('p', 'mm', 'a4');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('DEVIS SMARTCHANTIER AI', 14, 20);
  doc.setFontSize(10);
  doc.text('N devis: DEV-20250531-9999', 14, 30);
  doc.text('Date: 31/05/2025', 14, 36);
  doc.text('Client: Test', 14, 42);

  autoTable(doc, {
    startY: 50,
    head: [['Lot', 'Description', 'Qte', 'Unite', 'Prix HT', 'TVA', 'Total HT']],
    body: [
      ['Matériaux', 'Ligne test carrelage', '10', 'm2', '45 EUR', '20 %', '450 EUR'],
      ['Matériaux', 'Ligne test colle', '5', 'sac', '12 EUR', '20 %', '60 EUR'],
    ],
  });

  const y = doc.lastAutoTable.finalY + 10;
  doc.text('Total HT: 510 EUR', 14, y);
  doc.text('TVA: 102 EUR', 14, y + 6);
  doc.text('Total TTC: 612 EUR', 14, y + 12);

  doc.addPage();
  doc.setFontSize(8);
  doc.text(doc.splitTextToSize(LEGAL, 180), 14, 14);

  return doc;
}

const doc = build();
const buf = Buffer.from(doc.output('arraybuffer'));
const header = buf.subarray(0, 5).toString('ascii');

if (header !== '%PDF-') {
  console.error('Invalid PDF header:', header);
  process.exit(1);
}
if (buf.length < MIN_BYTES) {
  console.error(`PDF too small: ${buf.length} bytes (min ${MIN_BYTES})`);
  process.exit(1);
}
console.log('OK — PDF valide, taille', buf.length, 'octets (>= 20 Ko)');
