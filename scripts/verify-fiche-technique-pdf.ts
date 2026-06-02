/**
 * Valide le générateur Fiche Technique IA : %PDF-, taille >= 20 Ko.
 * Usage: npm run verify:fiche-technique-pdf
 */
import pdfParse from 'pdf-parse';
import { mkdirSync, writeFileSync } from 'node:fs';
import { generateFicheTechniquePdfBytes } from '../src/pdf/ficheTechniquePdfGenerator';
import type { FicheTechniquePdfLabels, TechnicalSheetProduct } from '../src/types/ficheTechnique';

const MIN_BYTES = 20_000;

const labels: FicheTechniquePdfLabels = {
  title: 'FICHE TECHNIQUE PRODUIT',
  comparisonTitle: 'COMPARATIF TECHNIQUE PRODUITS',
  productName: 'Nom du produit',
  reference: 'Référence',
  brand: 'Marque',
  manufacturer: 'Fabricant',
  supplier: 'Fournisseur',
  category: 'Catégorie',
  description: 'Description',
  useCase: 'Usage',
  specifications: 'Caractéristiques',
  dimensions: 'Dimensions',
  thickness: 'Épaisseur',
  weight: 'Poids',
  material: 'Matériau',
  color: 'Couleur',
  finish: 'Finition',
  indoorOutdoorUse: 'Usage',
  resistance: 'Résistance',
  fireClassification: 'Classement feu',
  thermalPerformance: 'Thermique',
  acousticPerformance: 'Acoustique',
  slipResistance: 'Antidérapance',
  waterResistance: 'Eau',
  uvResistance: 'UV',
  loadResistance: 'Charge',
  certifications: 'Certifications',
  ceStandards: 'CE',
  normes: 'Normes',
  warranty: 'Garantie',
  countryOfOrigin: 'Origine',
  environmentalSheet: 'Env.',
  safetySheet: 'Sécurité',
  productImage: 'Image',
  noImage: 'N/A',
  sources: 'Sources',
  notes: 'Notes',
  confidence: 'Confiance',
  confidenceConfirme: 'Confirmé',
  confidenceAVerifier: 'À vérifier',
  confidenceEstimee: 'Estimée',
  provisionalBanner: 'Fiche provisoire',
  generatedAt: 'Date',
  specLabel: 'Rubrique',
  specValue: 'Valeur',
  usageRecommendations: 'Recommandations',
  footer: 'SmartChantier AI — données à vérifier.',
  advantages: 'Avantages',
  disadvantages: 'Inconvénients',
  suitability: 'Adéquation',
  recommendedProduct: 'Recommandé',
  recommendationReason: 'Motif',
  price: 'Prix',
  availability: 'Dispo',
};

const sheet: TechnicalSheetProduct = {
  id: 'verify-test',
  productName: 'Carrelage extérieur 60x60 antidérapant',
  reference: 'TEST-60X60',
  brand: 'SmartTest',
  manufacturer: 'SmartTest',
  supplier: 'Test Supplier',
  category: 'Carrelage',
  description: 'Carrelage grès cérame antidérapant pour terrasse — test vérification PDF.',
  useCase: 'Extérieur terrasse',
  dimensions: '60x60 cm',
  thickness: '9 mm',
  weight: '—',
  material: 'Grès cérame',
  color: 'Gris',
  finish: 'Antidérapant',
  indoorOutdoorUse: 'Extérieur',
  resistance: '—',
  fireClassification: 'A2fl',
  thermalPerformance: '—',
  acousticPerformance: '—',
  slipResistance: 'R11',
  waterResistance: '—',
  uvResistance: '—',
  loadResistance: '—',
  certifications: 'CE',
  ceStandards: 'Marquage CE',
  normes: 'EN 14411',
  warranty: '2 ans',
  countryOfOrigin: '—',
  environmentalSheet: '—',
  safetySheet: '—',
  productUrl: 'https://example.com/product',
  supplierUrl: 'https://example.com/supplier',
  manufacturerUrl: '',
  sourceUrls: ['https://example.com/product'],
  confidence: 'confirme',
  isProvisional: false,
  generatedAt: new Date().toISOString(),
  notes: 'Test verify script',
};

const bytes = await generateFicheTechniquePdfBytes(sheet, labels);

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
const required = ['SmartChantier', 'FICHE TECHNIQUE', 'TEST-60X60', 'SmartTest', 'R11'];
const missing = required.filter((s) => !text.includes(s));
if (missing.length > 0) {
  console.error('Missing PDF content:', missing.join(', '));
  process.exit(1);
}

const out = 'tmp/verify-fiche-technique.pdf';
mkdirSync('tmp', { recursive: true });
writeFileSync(out, bytes);
console.log(`OK — PDF valide, ${bytes.length} octets (>= 20 Ko), écrit ${out}`);
