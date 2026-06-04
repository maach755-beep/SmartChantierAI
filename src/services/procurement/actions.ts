import {
  generateAndSaveComparisonPdf,
  generateAndSaveDevisPdf,
  generateAndSavePurchaseOrderPdf,
  generateAndSaveReportPdf,
  generatePdfDocumentNumber,
  type DevisPdfLineInput,
} from '@/services/pdf/devisPdfGenerator';
import { preloadPdfFonts } from '@/services/pdf/pdfFonts';
import { buildComparisonRowsFromProcurement } from '@/services/procurement/procurementComparison';
import { formatCurrency } from '@/utils/format';
import { coerceAiStringField } from '@/utils/safeRenderValue';
import { TVA_RATE } from '@/config/france';
import type { ProcurementProductResult, ProcurementSearchResponse } from '@/types/procurementSearch';

function procurementToDevisLines(
  proc: ProcurementSearchResponse,
  items: ProcurementProductResult[]
): DevisPdfLineInput[] {
  const tvaPercent = Math.round(TVA_RATE * 100);
  const qty = proc.costEstimate.quantity || 1;
  return items.map((item) => ({
    workLot: 'Matériaux',
    description: `${item.productName} — ${item.brand} ${item.model}`.trim(),
    supplier: item.supplier,
    quantity: qty,
    unit: item.unit,
    unitPriceHt: item.priceEurHt > 0 ? item.priceEurHt : 0,
    tvaPercent,
  }));
}

export async function exportProcurementComparison(proc: ProcurementSearchResponse): Promise<void> {
  const rows = buildComparisonRowsFromProcurement(proc);
  if (rows.length === 0) {
    throw new Error('Aucun produit à comparer. Effectuez une recherche avec des résultats.');
  }
  await preloadPdfFonts();
  await generateAndSaveComparisonPdf({
    client: {
      clientName: proc.parsed.location,
      siteAddress: proc.parsed.rawQuery.slice(0, 120),
      city: proc.parsed.location,
    },
    rows,
    recommendation: proc.aiSummary,
  });
}

export async function exportProcurementPurchaseOrderForItem(
  proc: ProcurementSearchResponse,
  item: ProcurementProductResult
): Promise<void> {
  const qty = proc.costEstimate.quantity || 1;
  const lines: DevisPdfLineInput[] = [
    {
      workLot: 'Commande',
      description: `${item.productName} — ${item.brand} ${item.model}`.trim(),
      supplier: item.supplier,
      quantity: qty,
      unit: item.unit,
      unitPriceHt: item.priceEurHt > 0 ? item.priceEurHt : 0,
      tvaPercent: Math.round(TVA_RATE * 100),
    },
  ];

  await preloadPdfFonts();
  await generateAndSavePurchaseOrderPdf({
    documentNumber: generatePdfDocumentNumber('purchase_order'),
    supplier: item.supplier,
    clientName: proc.parsed.location,
    siteAddress: `Zone : ${proc.parsed.location}`,
    city: proc.parsed.location,
    lines,
    conditions: [
      `Référence recherche : ${proc.parsed.rawQuery}`,
      `Délai : ${item.deliveryLabel}`,
      `Stock : ${item.stockLabel}`,
      'Marché France — devise EUR — TVA selon devis fournisseur.',
      'Document généré par SmartChantier AI — valider avec le compte pro fournisseur.',
    ],
  });
}

export async function exportProcurementPurchaseOrder(
  proc: ProcurementSearchResponse
): Promise<void> {
  const top = proc.insight.bestProduct ?? proc.results[0];
  if (!top) {
    throw new Error('Aucun produit sélectionné pour le bon de commande.');
  }
  await exportProcurementPurchaseOrderForItem(proc, top);
}

export async function exportProcurementReport(proc: ProcurementSearchResponse): Promise<void> {
  const p = proc.parsed;
  const productLines = proc.results.map(
    (r) =>
      `${r.productName} | ${r.supplier} | ${formatCurrency(r.priceEurHt)}/${r.unit} | Score ${r.scores.composite} | ${r.deliveryLabel}`
  );

  await generateAndSaveReportPdf(
    `Rapport achat IA — ${p.materialType}`,
    [
      { heading: 'Recherche', lines: [p.rawQuery] },
      {
        heading: 'Compréhension IA',
        lines: [
          `Matériau : ${p.materialType}`,
          `Dimensions : ${coerceAiStringField(p.dimensions, '—')}`,
          `Quantité : ${proc.costEstimate.quantity} ${proc.costEstimate.unit}`,
          `Budget : ${p.maxBudgetPerUnit > 0 ? `${p.maxBudgetPerUnit} € HT/${p.unit}` : '—'}`,
          `Ville : ${p.location}`,
          `Type projet : ${p.projectType}`,
          `Source : ${proc.source}`,
        ],
      },
      { heading: 'Synthèse', lines: [proc.aiSummary.replace(/\*\*/g, '')] },
      {
        heading: 'Estimation financière (EUR HT)',
        lines: [
          `Total matériaux estimé : ${formatCurrency(proc.costEstimate.totalMaterialsHt)} HT`,
          `Budget prévu : ${proc.costEstimate.budgetTotalHt > 0 ? formatCurrency(proc.costEstimate.budgetTotalHt) : '—'} HT`,
          `Écart : ${formatCurrency(proc.costEstimate.varianceHt)} HT`,
        ],
      },
      { heading: 'Livraison', lines: [proc.deliveryEstimate.label] },
      {
        heading: 'Classement fournisseurs',
        lines: proc.supplierRankings.map(
          (s) =>
            `#${s.rank} ${s.supplier} — score moy. ${s.averageScore} — ${s.productCount} produit(s) — dès ${formatCurrency(s.bestPriceEur)}/${p.unit}`
        ),
      },
      { heading: 'Produits analysés', lines: productLines.length > 0 ? productLines : ['—'] },
      {
        heading: 'Alternatives',
        lines:
          proc.insight.alternatives.length > 0
            ? proc.insight.alternatives.map((a) => `${a.productName} (${a.supplier})`)
            : ['—'],
      },
      {
        heading: 'Méthode de scoring',
        lines: ['Prix 40 % · Qualité 30 % · Disponibilité 20 % · Délai 10 % — France uniquement'],
      },
    ],
    { clientName: p.location, siteAddress: p.rawQuery.slice(0, 80), city: p.location }
  );
}

export async function exportProcurementToDevis(proc: ProcurementSearchResponse): Promise<void> {
  const lines = procurementToDevisLines(proc, proc.results);
  if (lines.length === 0) {
    throw new Error('Aucune ligne pour le devis. Lancez une recherche avec des produits.');
  }

  await preloadPdfFonts();
  await generateAndSaveDevisPdf({
    devisNumber: generatePdfDocumentNumber('devis'),
    date: new Date(),
    clientName: proc.parsed.location || 'À préciser',
    siteAddress: proc.parsed.rawQuery.slice(0, 120),
    city: proc.parsed.location,
    lines,
    conditions: [
      'Validité du devis : 30 jours à compter de la date d\'émission.',
      'Prix indicatifs à confirmer auprès des fournisseurs — France, EUR.',
      proc.aiSummary.replace(/\*\*/g, ''),
    ],
  });
}
