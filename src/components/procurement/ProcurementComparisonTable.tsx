import { useTranslation } from 'react-i18next';
import { formatCurrency } from '@/utils/format';
import type { ProcurementSearchResponse } from '@/types/procurementSearch';

interface ProcurementComparisonTableProps {
  procurement: ProcurementSearchResponse;
}

export function ProcurementComparisonTable({ procurement }: ProcurementComparisonTableProps) {
  const { t } = useTranslation();

  if (procurement.results.length === 0) {
    return (
      <p className="text-sm text-amber-400/90 text-center py-4">{t('purchase.compareNoData')}</p>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/25 bg-btp-900/50 overflow-hidden">
      <div className="px-4 py-3 border-b border-btp-600/30 bg-cyan-950/30">
        <h2 className="text-sm font-semibold text-cyan-300">{t('purchase.compareTitle')}</h2>
        <p className="text-xs text-slate-500 mt-1">{t('purchase.compareSubtitle')}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-slate-400 bg-btp-800/60">
              <th className="px-3 py-2">{t('purchase.colProduct')}</th>
              <th className="px-3 py-2">{t('purchase.colSupplier')}</th>
              <th className="px-3 py-2 text-right">{t('purchase.colPrice')}</th>
              <th className="px-3 py-2">{t('purchase.colDelivery')}</th>
              <th className="px-3 py-2 text-center">{t('purchase.colScore')}</th>
              <th className="px-3 py-2">{t('purchase.colDecision')}</th>
            </tr>
          </thead>
          <tbody>
            {procurement.results.map((item) => (
              <tr
                key={item.id}
                className={`border-t border-btp-700/40 ${
                  item.isBestProduct ? 'bg-cyan-950/25' : 'hover:bg-btp-800/30'
                }`}
              >
                <td className="px-3 py-2 text-white">
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.brand}</p>
                </td>
                <td className="px-3 py-2 text-slate-300">{item.supplier}</td>
                <td className="px-3 py-2 text-right text-cyan-400 whitespace-nowrap">
                  {item.priceEurHt > 0
                    ? `${formatCurrency(item.priceEurHt)} HT/${item.unit}`
                    : t('search.priceOnSite')}
                </td>
                <td className="px-3 py-2 text-slate-400 text-xs">{item.deliveryLabel}</td>
                <td className="px-3 py-2 text-center font-medium text-white">
                  {item.scores.composite}
                </td>
                <td className="px-3 py-2 text-xs">
                  {item.isBestProduct && (
                    <span className="text-emerald-400">{t('search.badgeBestProduct')}</span>
                  )}
                  {item.isBestPrice && !item.isBestProduct && (
                    <span className="text-cyan-400">{t('search.badgeBestPrice')}</span>
                  )}
                  {item.isBestValue && !item.isBestProduct && !item.isBestPrice && (
                    <span className="text-amber-400">{t('search.badgeBestValue')}</span>
                  )}
                  {!item.isBestProduct && !item.isBestPrice && !item.isBestValue && (
                    <span className="text-slate-500">{t('purchase.colAlt')}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
