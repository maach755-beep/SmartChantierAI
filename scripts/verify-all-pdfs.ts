/**
 * Vérifie tous les générateurs PDF SmartChantierAI.
 * Usage: npx tsx --tsconfig tsconfig.app.json scripts/verify-all-pdfs.ts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  generateDevisPdfBytes,
  generateDocumentPdfBytes,
  MIN_PDF_BYTES,
} from '../src/services/pdf/devisPdfGenerator';
import { generateFicheTechniquePdfBytes, generateComparisonPdfBytes } from '../src/pdf/ficheTechniquePdfGenerator';
import { compareTechnicalSheets } from '../src/services/ficheTechnique/ficheTechniqueComparison';
import type { FicheTechniquePdfLabels, TechnicalSheetProduct } from '../src/types/ficheTechnique';

const MIN = MIN_PDF_BYTES;

function check(name: string, bytes: Uint8Array): void {
  const h = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
  if (h !== '%PDF-') throw new Error(`${name}: invalid header ${h}`);
  if (bytes.length < MIN) throw new Error(`${name}: too small (${bytes.length} bytes)`);
  console.log(`OK  ${name} — ${bytes.length} bytes`);
}

const ficheLabels: FicheTechniquePdfLabels = {
  title: 'FICHE TECHNIQUE PRODUIT',
  comparisonTitle: 'COMPARATIF TECHNIQUE PRODUITS',
  productName: 'Nom', reference: 'Réf', brand: 'Marque', manufacturer: 'Fabricant',
  supplier: 'Fournisseur', category: 'Cat', description: 'Desc', useCase: 'Usage',
  specifications: 'Specs', dimensions: 'Dim', thickness: 'Ep', weight: 'Poids',
  material: 'Mat', color: 'Couleur', finish: 'Fin', indoorOutdoorUse: 'IO',
  resistance: 'Res', fireClassification: 'Feu', thermalPerformance: 'Th',
  acousticPerformance: 'Ac', slipResistance: 'R11', waterResistance: 'Eau',
  uvResistance: 'UV', loadResistance: 'Charge', certifications: 'Cert',
  ceStandards: 'CE', normes: 'EN', warranty: 'Garantie', countryOfOrigin: 'FR',
  environmentalSheet: 'Env', safetySheet: 'Sec', productImage: 'Img', noImage: 'N/A',
  sources: 'Sources', notes: 'Notes', confidence: 'Conf', confidenceConfirme: 'OK',
  confidenceAVerifier: 'V', confidenceEstimee: 'E', provisionalBanner: 'Provisoire',
  generatedAt: 'Date', specLabel: 'Rubrique', specValue: 'Valeur',
  usageRecommendations: 'Usage', footer: 'SmartChantier AI', advantages: 'Avantages',
  disadvantages: 'Inconv', suitability: 'Adéq', recommendedProduct: 'Reco',
  recommendationReason: 'Motif', price: 'Prix', availability: 'Dispo',
};

const mkProduct = (id: string, name: string): TechnicalSheetProduct => ({
  id, productName: name, reference: 'REF-1', brand: 'Brand', manufacturer: 'Mfg',
  supplier: 'Supplier', category: 'Carrelage', description: 'Test product',
  useCase: 'Terrasse', dimensions: '60x60', thickness: '9 mm', weight: '28 kg/m²',
  material: 'Grès cérame', color: 'Gris', finish: 'Mat', indoorOutdoorUse: 'Extérieur',
  resistance: '—', fireClassification: 'A2fl', thermalPerformance: '—',
  acousticPerformance: '—', slipResistance: 'R11', waterResistance: 'OK',
  uvResistance: 'OK', loadResistance: '—', certifications: 'CE', ceStandards: 'CE',
  normes: 'EN 14411', warranty: '2 ans', countryOfOrigin: 'France',
  environmentalSheet: '—', safetySheet: '—', productUrl: 'https://example.com/p',
  supplierUrl: 'https://example.com/s', manufacturerUrl: '', sourceUrls: ['https://example.com/p'],
  confidence: 'confirme', isProvisional: false, generatedAt: new Date().toISOString(), notes: '',
});

mkdirSync('tmp', { recursive: true });

const devis = await generateDevisPdfBytes({
  devisNumber: 'DEV-TEST-001',
  date: new Date(),
  clientName: 'Client Test',
  siteAddress: '12 rue Test, Nice',
  city: 'Nice',
  lines: [{ workLot: 'Matériaux', description: 'Carrelage test', quantity: 10, unit: 'm²', unitPriceHt: 35, tvaPercent: 20 }],
  labourHt: 0,
  conditions: ['Validité 30 jours.'],
});
check('Devis IA', devis);
writeFileSync('tmp/verify-all-devis.pdf', devis);

const po = await generateDocumentPdfBytes({
  kind: 'purchase_order',
  documentNumber: 'BC-TEST-001',
  date: new Date(),
  client: { clientName: 'Client Test', siteAddress: '12 rue Test', city: 'Nice', supplier: 'Point P Nice' },
  lines: [{
    workLot: 'Commande',
    description: 'Carrelage 60x60 grès cérame',
    quantity: 100,
    unit: 'm²',
    unitPriceHt: 35,
    tvaPercent: 20,
  }],
  showTotals: true,
});
check('Bon de commande', po);
writeFileSync('tmp/verify-all-purchase-order.pdf', po);

const comp = await generateDocumentPdfBytes({
  kind: 'comparison',
  date: new Date(),
  client: { clientName: 'Nice', siteAddress: 'Terrasse 80m²', city: 'Nice' },
  comparisonRows: [
    { product: 'Carrelage A', brand: 'Keraben', supplier: 'Point P', priceLabel: '35 €/m²', delay: '3 j', score: 87, decision: 'Recommandé' },
    { product: 'Carrelage B', brand: 'Pamesa', supplier: 'Leroy Merlin', priceLabel: '32 €/m²', delay: '5 j', score: 82, decision: 'Alternative' },
  ],
  conditions: ['Recommandation: Produit A — meilleur score qualité/prix.'],
  showTotals: false,
});
check('Comparatif achat', comp);
writeFileSync('tmp/verify-all-comparison-procurement.pdf', comp);

const report = await generateDocumentPdfBytes({
  kind: 'report',
  date: new Date(),
  subtitle: 'Rapport hebdomadaire chantier',
  client: { clientName: 'SmartChantier Demo', city: 'Nice' },
  sections: [
    { heading: 'Avancement', lines: ['Résidence Les Pins: 65%', 'Villa Azur: 42%'] },
    { heading: 'Risques', lines: ['2 risques critiques', '1 retard fournisseur'] },
  ],
  showTotals: false,
});
check('Rapport', report);
writeFileSync('tmp/verify-all-report.pdf', report);

const sheet = mkProduct('ft-1', 'Carrelage extérieur 60x60 antidérapant');
const fiche = await generateFicheTechniquePdfBytes(sheet, ficheLabels);
check('Fiche technique IA', fiche);
writeFileSync('tmp/verify-all-fiche-technique.pdf', fiche);

const comparison = compareTechnicalSheets([mkProduct('c1', 'Produit A'), mkProduct('c2', 'Produit B')]);
const ficheComp = await generateComparisonPdfBytes(comparison, ficheLabels);
check('Comparatif fiche technique IA', ficheComp);
writeFileSync('tmp/verify-all-fiche-comparison.pdf', ficheComp);

console.log('\nAll 6 PDF generators verified successfully.');
