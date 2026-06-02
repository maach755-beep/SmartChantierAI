import { useTranslation } from 'react-i18next';
import { MapPin, Package, Truck, Award, Globe, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ProductExternalLink } from '@/components/procurement/ProductExternalLink';
import { formatCurrency } from '@/utils/format';
import type { ProcurementProductResult } from '@/types/procurementSearch';

interface ProcurementResultCardProps {
  item: ProcurementProductResult;
  quantity?: number;
  unit?: string;
  onCompare: () => void;
  onPurchaseOrder: () => void;
  onAddToDevis: () => void;
  compareLoading?: boolean;
  purchaseOrderLoading?: boolean;
}

export function ProcurementResultCard({
  item,
  quantity,
  unit,
  onCompare,
  onPurchaseOrder,
  onAddToDevis,
  compareLoading = false,
  purchaseOrderLoading = false,
}: ProcurementResultCardProps) {
  const { t } = useTranslation();
  const isRealWeb = item.resultOrigin === 'real_web';
  const hasPrice = item.priceEurHt > 0;

  return (
    <article
      className={`rounded-xl border p-4 sm:p-5 flex flex-col gap-4 ${
        isRealWeb
          ? 'border-cyan-500/35 bg-cyan-950/15'
          : 'border-amber-600/25 bg-btp-900/50'
      }`}
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant={isRealWeb ? 'blue' : 'orange'}>{item.sourceLabel}</Badge>
        {item.isBestProduct && <Badge variant="blue">{t('search.badgeBestProduct')}</Badge>}
        {item.isBestPrice && <Badge variant="green">{t('search.badgeBestPrice')}</Badge>}
        {item.isBestValue && <Badge variant="orange">{t('search.badgeBestValue')}</Badge>}
        {item.confidence != null && isRealWeb && (
          <Badge variant="gray">
            {t('search.webConfidence', { value: item.confidence })}
          </Badge>
        )}
        <Badge variant="gray">{t('search.score', { value: item.scores.composite })}</Badge>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-white leading-snug">{item.productName}</h3>
        <p className="text-sm text-slate-400 mt-1">
          {item.brand} — {item.model}
        </p>
        {item.url && isRealWeb && <ProductExternalLink url={item.url} />}
      </div>

      {item.summary && isRealWeb && (
        <p className="text-xs text-slate-400 leading-relaxed border-l-2 border-cyan-500/40 pl-3">
          <Globe className="w-3.5 h-3.5 inline me-1 text-cyan-500/80" />
          {item.summary}
        </p>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500">{t('search.cardPrice')}</p>
          {hasPrice ? (
            <>
              <p className="text-cyan-400 font-semibold">
                {formatCurrency(item.priceEurHt)}{' '}
                <span className="text-slate-500 font-normal">HT/{item.unit}</span>
              </p>
              {quantity != null && quantity > 0 && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {t('purchase.lineTotal')}: {formatCurrency(item.estimatedLineTotalHt)} HT ({quantity}{' '}
                  {unit ?? item.unit})
                </p>
              )}
            </>
          ) : (
            <p className="text-amber-400/90 text-xs">{t('search.priceOnSite')}</p>
          )}
        </div>
        <div>
          <p className="text-xs text-slate-500">{t('search.cardSupplier')}</p>
          <p className="text-white font-medium">{item.supplier}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Package className="w-3 h-3" /> {t('search.cardStock')}
          </p>
          <p className="text-slate-300 text-xs">{item.stockLabel}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Truck className="w-3 h-3" /> {t('search.cardDelivery')}
          </p>
          <p className="text-slate-300 text-xs">{item.deliveryLabel}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1">
        <MapPin className="w-3.5 h-3.5 shrink-0" />
        {item.distanceLabel}
      </p>

      <div>
        <p className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
          <Award className="w-3.5 h-3.5" />
          {t('search.cardSpecs')}
        </p>
        <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
          {item.technicalSpecs.slice(0, 4).map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs text-slate-500 border-t border-btp-700/40 pt-3">
        <span>
          {t('search.scorePrice')}: {item.scores.price}
        </span>
        <span>
          {t('search.scoreQuality')}: {item.scores.quality}
        </span>
        <span>
          {t('search.scoreAvailability')}: {item.scores.availability}
        </span>
        <span>
          {t('search.scoreDelivery')}: {item.scores.delivery}
        </span>
      </div>

      {(item.cheaperAlternative || item.betterQualityAlternative) && !isRealWeb && (
        <p className="text-xs text-slate-500">
          {item.cheaperAlternative && (
            <span>
              {t('search.altCheaper')}: {item.cheaperAlternative}
              {item.betterQualityAlternative ? ' · ' : ''}
            </span>
          )}
          {item.betterQualityAlternative && (
            <span>
              {t('search.altPremium')}: {item.betterQualityAlternative}
            </span>
          )}
        </p>
      )}

      <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={onCompare}
          disabled={compareLoading || purchaseOrderLoading}
        >
          {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('search.btnCompare')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1 sm:flex-none"
          onClick={onPurchaseOrder}
          disabled={compareLoading || purchaseOrderLoading}
        >
          {purchaseOrderLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('purchase.btnPurchaseOrder')}
        </Button>
        <Button size="sm" className="flex-1 sm:flex-none" onClick={onAddToDevis}>
          {t('purchase.btnAddDevis')}
        </Button>
      </div>
    </article>
  );
}
