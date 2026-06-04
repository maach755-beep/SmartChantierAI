import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Sparkles, FileDown, FileText, Save, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { ProcurementResultCard } from '@/components/procurement/ProcurementResultCard';
import { ProcurementComparisonTable } from '@/components/procurement/ProcurementComparisonTable';
import { FRENCH_SUPPLIER_NETWORK } from '@/config/france';
import { procurementConfig } from '@/services/procurement/config';
import { getOllamaStatus } from '@/services/ai/ollamaClient';
import {
  getRealWebSearchStatusLabel,
  isRealWebSearchEnabled,
  TAVILY_UNCONFIGURED_MESSAGE,
} from '@/services/realSearch/config';
import { runProcurementSearch } from '@/services/procurement/procurementSearchEngine';
import { safeRenderValue } from '@/utils/safeRenderValue';
import { detectExpensiveQuotations, type ExpensiveQuotationAlert } from '@/services/saas/platform';
import {
  exportProcurementComparison,
  exportProcurementPurchaseOrder,
  exportProcurementPurchaseOrderForItem,
  exportProcurementReport,
  exportProcurementToDevis,
} from '@/services/procurement/actions';
import { saveProcurementReport } from '@/services/procurement/storage';
import { preloadPdfFonts } from '@/services/pdf/pdfFonts';
import { useToast } from '@/contexts/ToastContext';
import { formatCurrency } from '@/utils/format';
import type { ProcurementSearchResponse } from '@/types/procurementSearch';

const DEFAULT_EXAMPLE =
  'Carrelage extérieur 60x60 pour terrasse 80m² budget 35€/m² Nice';

type ActionKey = 'compare' | 'purchaseOrder' | 'devis' | 'saveReport' | 'purchaseOrderItem';

interface ProcurementAssistantPanelProps {
  exampleQuery?: string;
  showNetworkBanner?: boolean;
}

export function ProcurementAssistantPanel({
  exampleQuery = DEFAULT_EXAMPLE,
  showNetworkBanner = true,
}: ProcurementAssistantPanelProps) {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<ActionKey | null>(null);
  const [procurement, setProcurement] = useState<ProcurementSearchResponse | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [ollamaLabel, setOllamaLabel] = useState('…');
  const [expensiveAlerts, setExpensiveAlerts] = useState<ExpensiveQuotationAlert[]>([]);

  useEffect(() => {
    void detectExpensiveQuotations().then(setExpensiveAlerts).catch(() => setExpensiveAlerts([]));
  }, []);

  useEffect(() => {
    void getOllamaStatus().then((s) => {
      setOllamaLabel(s.online && s.textModel ? 'ON' : 'OFF');
    });
  }, []);

  useEffect(() => {
    void preloadPdfFonts().catch(() => {
      /* police chargée au premier export si échec précoce */
    });
  }, []);

  const runSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setProcurement(null);
    setShowComparison(false);
    try {
      const result = await runProcurementSearch(q);
      setProcurement(result);
    } catch (e) {
      error(e instanceof Error ? e.message : t('purchase.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (key: ActionKey, fn: () => Promise<void>, successKey: string) => {
    if (!procurement) {
      error(t('purchase.noDataForAction'));
      return;
    }
    if (procurement.results.length === 0 && key !== 'saveReport') {
      error(t('purchase.noDataForAction'));
      return;
    }
    setActionLoading(key);
    try {
      await fn();
      success(t(successKey));
    } catch (e) {
      error(e instanceof Error ? e.message : t('purchase.actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleCompare = async (opts?: { scrollToTable?: boolean }) => {
    if (!procurement?.results.length) {
      error(t('purchase.compareNoData'));
      return;
    }
    setShowComparison(true);
    if (opts?.scrollToTable) {
      setTimeout(() => {
        document.getElementById('procurement-comparison')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    }
    setActionLoading('compare');
    try {
      await preloadPdfFonts();
      await exportProcurementComparison(procurement);
      success(t('purchase.comparePdfDone'));
    } catch (e) {
      error(e instanceof Error ? e.message : t('purchase.actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handlePurchaseOrder = () =>
    runAction(
      'purchaseOrder',
      () => exportProcurementPurchaseOrder(procurement!),
      'purchase.purchaseOrderPdfDone'
    );

  const handleDevis = () =>
    runAction('devis', () => exportProcurementToDevis(procurement!), 'purchase.devisPdfDone');

  const handleSaveReport = async () => {
    if (!procurement) {
      error(t('purchase.noDataForAction'));
      return;
    }
    setActionLoading('saveReport');
    try {
      saveProcurementReport(procurement);
      await exportProcurementReport(procurement);
      success(t('purchase.reportSaved'));
    } catch (e) {
      error(e instanceof Error ? e.message : t('purchase.actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const isBusy = (key: ActionKey) => actionLoading === key;
  const p = procurement?.parsed;

  return (
    <>
      {showNetworkBanner && (
        <Card className="mb-4 border-cyan-500/20 bg-cyan-950/20">
          <p className="text-sm text-slate-300 flex items-start gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            {t('purchase.aiIntro')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {t('search.supplierList')}: {FRENCH_SUPPLIER_NETWORK.join(' · ')}
          </p>
          <p
            className={`text-xs mt-2 ${
              isRealWebSearchEnabled() ? 'text-emerald-400/90' : 'text-amber-500/80'
            }`}
          >
            {t('settings.realSearchLabel')}: {getRealWebSearchStatusLabel(t)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {procurement?.providerNote ??
              (isRealWebSearchEnabled() ? t('search.providerWebReady') : TAVILY_UNCONFIGURED_MESSAGE)}
          </p>
        </Card>
      )}

      {expensiveAlerts.length > 0 && (
        <Card className="mb-4 border-amber-500/30">
          <p className="text-sm text-amber-300 font-medium mb-2">{t('saas.expensiveAlerts')}</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {expensiveAlerts.slice(0, 5).map((a) => (
              <li key={a.quotation.id}>
                {a.quotation.number} — +{a.percentAboveAvg}% — {a.cheaperAlternativeHint}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-2 mb-2">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && void runSearch()}
            placeholder={t('purchase.queryPlaceholder')}
            type="search"
            className="w-full ps-10 pe-4 py-3 rounded-xl bg-btp-900/60 border border-btp-600/30 text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
        <Button onClick={() => void runSearch()} disabled={loading || !query.trim()} className="shrink-0">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {t('purchase.search')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button
          type="button"
          onClick={() => setQuery(exampleQuery)}
          className="text-xs px-3 py-1.5 rounded-lg border border-btp-600/40 text-slate-400 hover:text-white hover:border-cyan-500/40"
        >
          {exampleQuery}
        </button>
      </div>

      {loading && <LoadingBlock label={t('search.searchingAi')} />}

      {procurement && !loading && (
        <div className="space-y-6">
          {(procurement.unavailableSuppliers?.length ?? 0) > 0 && (
            <div
              className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4"
              role="status"
            >
              <p className="text-sm font-medium text-amber-200">{t('search.supplierUnavailableTitle')}</p>
              <p className="text-xs text-slate-500 mt-1">{t('search.supplierUnavailableHint')}</p>
              <ul className="mt-2 space-y-1 text-xs text-amber-100/90">
                {procurement.unavailableSuppliers!.map((u) => (
                  <li key={u.supplier}>
                    <span className="font-medium">{u.supplier}</span> — {u.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-btp-600/25 bg-btp-900/40 p-4">
            <p className="text-sm text-slate-300 whitespace-pre-wrap">
              {procurement.aiSummary.replace(/\*\*/g, '')}
            </p>
            <p className="text-xs text-cyan-500/80 mt-2">
              {procurement.resultOrigin === 'real_web'
                ? t('purchase.sourceWebReal')
                : procurement.parsed.parsedByAi
                  ? procurement.source === 'ollama' || procurement.parsed.llmProvider === 'ollama'
                    ? t('purchase.sourceOllama')
                    : procurement.parsed.llmProvider === 'openai'
                      ? t('purchase.sourceOpenAi')
                      : t('purchase.sourceOllama')
                  : t('purchase.sourceLocal')}
            </p>
            {procurement.webQuery && (
              <p className="text-[10px] text-slate-600 mt-2 font-mono break-all">
                {t('search.webQuery')}: {procurement.webQuery}
              </p>
            )}
          </div>

          {p && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-sm">
              {[
                { label: t('purchase.understoodMaterial'), value: p.materialType },
                { label: t('purchase.understoodDimensions'), value: p.dimensions || p.formatHint || '—' },
                {
                  label: t('purchase.understoodQuantity'),
                  value: p.quantity > 0 ? `${p.quantity} ${p.unit}` : '—',
                },
                {
                  label: t('purchase.understoodBudget'),
                  value:
                    p.maxBudgetPerUnit > 0
                      ? `${p.maxBudgetPerUnit} € HT/${p.unit}`
                      : '—',
                },
                { label: t('purchase.understoodCity'), value: p.location },
                { label: t('purchase.understoodProject'), value: p.projectType },
              ].map((row) => (
                <div
                  key={row.label}
                  className="rounded-lg border border-btp-600/30 bg-btp-800/30 px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{row.label}</p>
                  <p className="text-white font-medium mt-0.5 truncate">{safeRenderValue(row.value)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
              <p className="text-xs text-emerald-400/90 uppercase">{t('purchase.estimatedTotal')}</p>
              <p className="text-lg font-semibold text-white mt-1">
                {formatCurrency(procurement.costEstimate.totalMaterialsHt)} HT
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {procurement.costEstimate.quantity} {procurement.costEstimate.unit}
                {procurement.costEstimate.budgetTotalHt > 0 &&
                  ` · ${procurement.costEstimate.withinBudget ? t('purchase.withinBudget') : t('purchase.overBudget')}`}
              </p>
            </div>
            <div className="rounded-lg border border-btp-600/30 bg-btp-800/30 p-3">
              <p className="text-xs text-slate-500 uppercase">{t('purchase.deliveryEstimate')}</p>
              <p className="text-sm font-medium text-white mt-1">{procurement.deliveryEstimate.label}</p>
            </div>
            <div className="rounded-lg border border-btp-600/30 bg-btp-800/30 p-3 sm:col-span-2">
              <p className="text-xs text-slate-500 uppercase mb-2">{t('purchase.supplierRanking')}</p>
              <ul className="text-xs text-slate-400 space-y-1">
                {procurement.supplierRankings.slice(0, 4).map((s) => (
                  <li key={s.supplier}>
                    #{s.rank} {s.supplier} — {t('search.score', { value: s.averageScore })} —{' '}
                    {formatCurrency(s.bestPriceEur)}/{procurement.costEstimate.unit}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            {[
              { key: 'bestProduct', item: procurement.insight.bestProduct, label: t('search.insightBestProduct') },
              { key: 'bestPrice', item: procurement.insight.bestPrice, label: t('search.insightBestPrice') },
              { key: 'bestValue', item: procurement.insight.bestValue, label: t('search.insightBestValue') },
            ].map(({ key, item, label }) =>
              item ? (
                <div key={key} className="rounded-lg border border-btp-600/30 bg-btp-800/30 p-3">
                  <p className="text-xs text-cyan-400/90 uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-medium text-white mt-1 truncate">{item.productName}</p>
                  <p className="text-xs text-slate-500">
                    {item.supplier} — {formatCurrency(item.priceEurHt)} HT/{item.unit}
                  </p>
                </div>
              ) : null
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => void handleCompare()}
              disabled={!!actionLoading || !procurement.results.length}
            >
              {isBusy('compare') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              {t('search.btnCompare')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handlePurchaseOrder()}
              disabled={!!actionLoading || !procurement.results.length}
            >
              {isBusy('purchaseOrder') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              {t('purchase.btnPurchaseOrder')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => void handleDevis()}
              disabled={!!actionLoading || !procurement.results.length}
            >
              {isBusy('devis') ? <Loader2 className="w-4 h-4 animate-spin" /> : t('purchase.btnAddDevis')}
            </Button>
            <Button onClick={() => void handleSaveReport()} disabled={!!actionLoading}>
              {isBusy('saveReport') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('purchase.btnSaveReport')}
            </Button>
          </div>

          {showComparison && (
            <div id="procurement-comparison">
              <ProcurementComparisonTable procurement={procurement} />
            </div>
          )}

          <p className="text-[10px] text-slate-600">{t('purchase.scoringMethod')}</p>

          <p className="text-sm text-slate-400">
            {t('search.resultsCount', { count: procurement.results.length })}
          </p>

          <div className="grid gap-4 lg:grid-cols-2">
            {procurement.results.map((item) => (
              <ProcurementResultCard
                key={item.id}
                item={item}
                quantity={procurement.costEstimate.quantity}
                unit={procurement.costEstimate.unit}
                onCompare={() => void handleCompare({ scrollToTable: true })}
                onPurchaseOrder={() =>
                  void runAction(
                    'purchaseOrderItem',
                    () => exportProcurementPurchaseOrderForItem(procurement, item),
                    'purchase.purchaseOrderPdfDone'
                  )
                }
                onAddToDevis={() => void handleDevis()}
                compareLoading={isBusy('compare')}
                purchaseOrderLoading={isBusy('purchaseOrderItem')}
              />
            ))}
          </div>

          {procurement.insight.alternatives.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
                {t('search.alternatives')}
              </h2>
              <ul className="text-sm text-slate-500 space-y-1">
                {procurement.insight.alternatives.map((a) => (
                  <li key={a.id}>
                    {a.productName} — {a.supplier} ({formatCurrency(a.priceEurHt)} HT) —{' '}
                    {t('search.score', { value: a.scores.composite })}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {!procurement && !loading && !query.trim() && (
        <p className="text-sm text-slate-600 text-center py-6">{t('purchase.emptyHint')}</p>
      )}

      {procurement && !loading && procurement.results.length === 0 && (
        <p className="text-slate-500 text-center py-8">{t('search.noResults')}</p>
      )}

      <p className="text-[10px] text-slate-600 mt-6 text-center">
        {t('search.architectureNote', {
          ollama: ollamaLabel,
          openai: procurementConfig.openai.enabled ? 'ON (opt.)' : 'OFF',
          supabase: procurementConfig.supabase.enabled ? 'ON' : 'OFF',
          api: procurementConfig.supplierApi.enabled ? 'ON' : 'OFF',
        })}
      </p>
    </>
  );
}
