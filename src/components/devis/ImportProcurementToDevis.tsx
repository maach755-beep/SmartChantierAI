import { useTranslation } from 'react-i18next';
import { Package, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/format';
import { getProcurementReports } from '@/services/procurement/storage';
import type { ProcurementProductResult } from '@/types/procurementSearch';
import type { ProfessionalDevisLine } from '@/types/professionalDevis';

interface ImportProcurementToDevisProps {
  onImport: (line: ProfessionalDevisLine) => void;
}

export function ImportProcurementToDevis({ onImport }: ImportProcurementToDevisProps) {
  const { t } = useTranslation();
  const reports = getProcurementReports();
  const latest = reports[0];

  if (!latest || latest.results.length === 0) {
    return (
      <Card className="border-amber-600/25 bg-amber-950/10">
        <p className="text-sm text-slate-400">{t('devis.importEmpty')}</p>
        <p className="text-xs text-slate-500 mt-2">
          <a href="/recherche" className="text-cyan-400 hover:underline">
            {t('nav.search')}
          </a>
          {' · '}
          <a href="/assistant-achat" className="text-cyan-400 hover:underline">
            {t('nav.purchaseAssistant')}
          </a>
        </p>
      </Card>
    );
  }

  const qty = latest.costEstimate.quantity > 0 ? latest.costEstimate.quantity : 1;

  const handleImport = (product: ProcurementProductResult) => {
    onImport({
      id: crypto.randomUUID(),
      workLot: t('devis.lotMaterials'),
      description: product.productName,
      productName: product.productName,
      supplier: product.supplier,
      productUrl: product.url,
      quantity: qty,
      unit: (['m²', 'ml', 'm³', 'unité'].includes(product.unit)
        ? product.unit
        : 'unité') as ProfessionalDevisLine['unit'],
      unitPriceHt: product.priceEurHt > 0 ? product.priceEurHt : 0,
      tvaPercent: 20,
    });
  };

  return (
    <Card title={t('devis.importTitle')} className="border-cyan-500/20">
      <p className="text-xs text-slate-500 mb-3">
        {t('devis.importHint')} — {latest.parsed.rawQuery.slice(0, 80)}
      </p>
      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {latest.results.slice(0, 10).map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-btp-600/30 bg-btp-900/40 px-3 py-2"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white font-medium truncate">{p.productName}</p>
              <p className="text-xs text-slate-500">
                {p.supplier}
                {p.priceEurHt > 0 ? ` · ${formatCurrency(p.priceEurHt)} HT/${p.unit}` : ''}
              </p>
              {p.url && (
                <p className="text-[10px] text-cyan-500/80 truncate mt-0.5">{p.url}</p>
              )}
            </div>
            <Button size="sm" variant="secondary" onClick={() => handleImport(p)}>
              <Plus className="w-3.5 h-3.5" />
              {t('devis.importAdd')}
            </Button>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
        <Package className="w-3 h-3" />
        {latest.resultOrigin === 'real_web' ? t('devis.importWeb') : t('devis.importDemo')}
      </p>
    </Card>
  );
}
