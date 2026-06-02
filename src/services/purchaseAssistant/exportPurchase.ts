import { TVA_RATE } from '@/config/france';
import { exportToExcel } from '@/services/exportService';
import {
  generateAndSaveComparisonPdf,
  generateAndSaveDevisPdf,
  generateAndSaveReportPdf,
  generatePdfDocumentNumber,
  type ComparisonPdfRow,
  type DevisPdfLineInput,
} from '@/services/pdf/devisPdfGenerator';
import type { PurchaseSearchResult } from '@/types/purchaseAssistant';

function buildComparisonRows(result: PurchaseSearchResult): ComparisonPdfRow[] {
  return result.comparison.map((c) => ({
    product: c.product,
    brand: c.brand,
    supplier: c.supplier,
    priceLabel: `${c.price} € HT`,
    delay: `${c.delayDays} j`,
    score: c.aiScore,
    decision: c.decision,
  }));
}

export async function exportComparisonPdf(result: PurchaseSearchResult): Promise<void> {
  const rows = buildComparisonRows(result);
  if (rows.length === 0) {
    throw new Error('Aucun produit à comparer.');
  }
  await generateAndSaveComparisonPdf({
    client: {
      clientName: result.criteria.chantierName,
      siteAddress: result.criteria.location,
    },
    rows,
    recommendation: result.finalRecommendation,
  });
}

export function exportPurchaseListExcel(result: PurchaseSearchResult): void {
  const headers = ['Produit', 'Marque', 'Fournisseur', 'Prix', 'Délai', 'Score', 'Décision'];
  const rows = result.comparison.map((c) => [
    c.product,
    c.brand,
    c.supplier,
    c.price,
    c.delayDays,
    c.aiScore,
    c.decision,
  ]);
  exportToExcel(`liste_achat_${Date.now()}`, headers, rows);
}

export async function exportSupplierRequest(result: PurchaseSearchResult): Promise<void> {
  await generateAndSaveReportPdf(
    'Demande de prix fournisseur',
    [{ heading: 'Corps du message', lines: result.supplierRequestText.split('\n') }],
    { clientName: result.criteria.chantierName }
  );
}

export async function exportRecommendationPdf(result: PurchaseSearchResult): Promise<void> {
  await generateAndSaveReportPdf(
    'Recommandation achat IA',
    [
      { heading: 'Recommandation finale', lines: [result.finalRecommendation] },
      {
        heading: 'Produits recommandés',
        lines: result.products
          .filter((p) => p.decisionHint === 'recommande')
          .map((p) => `${p.productName} — ${p.estimatedPrice} € HT/${p.unit} — ${p.supplier}`),
      },
      {
        heading: 'Économies',
        lines: [`Potentiel: ${result.potentialSavingsEur} € HT / unité vs option premium`],
      },
    ],
    { clientName: result.criteria.chantierName }
  );
}

export async function exportPreliminaryDevis(
  result: PurchaseSearchResult,
  quantity: string
): Promise<void> {
  const qty = parseFloat(quantity) || 1;
  const tvaPercent = Math.round(TVA_RATE * 100);

  const lines: DevisPdfLineInput[] = result.comparison.map((c) => ({
    workLot: 'Matériaux',
    description: `${c.product} — ${c.brand}`,
    supplier: c.supplier,
    quantity: qty,
    unit: 'unité',
    unitPriceHt: c.price,
    tvaPercent,
  }));

  if (lines.length === 0) {
    const top = result.products.find((p) => p.decisionHint === 'recommande') ?? result.products[0];
    if (top) {
      lines.push({
        workLot: 'Matériaux',
        description: `${top.productName} — ${top.brand}`,
        supplier: top.supplier,
        quantity: qty,
        unit: top.unit,
        unitPriceHt: top.estimatedPrice,
        tvaPercent,
      });
    }
  }

  if (lines.length === 0) {
    throw new Error('Aucune ligne pour le devis.');
  }

  await generateAndSaveDevisPdf({
    devisNumber: generatePdfDocumentNumber('devis'),
    date: new Date(),
    clientName: result.criteria.chantierName || 'À préciser',
    siteAddress: result.criteria.location || 'France',
    city: result.criteria.location,
    lines,
    conditions: [
      'Validité du devis : 30 jours à compter de la date d\'émission.',
      'Prix indicatifs à confirmer auprès des fournisseurs — France, EUR.',
      result.finalRecommendation,
    ],
  });
}

export function copyPurchaseToClipboard(result: PurchaseSearchResult): Promise<void> {
  const text = [
    result.finalRecommendation,
    '',
    '--- Comparaison ---',
    ...result.comparison.map((c) => `${c.product} — ${c.price}€ — ${c.decision}`),
    '',
    '--- Demande fournisseur ---',
    result.supplierRequestText,
  ].join('\n');
  return navigator.clipboard.writeText(text);
}
