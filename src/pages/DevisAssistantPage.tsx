import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileDown,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Building2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { ImportProcurementToDevis } from '@/components/devis/ImportProcurementToDevis';
import { usePlatformData } from '@/hooks/usePlatformData';
import { useToast } from '@/contexts/ToastContext';
import { APP_COUNTRY, APP_CURRENCY } from '@/config/france';
import {
  computeDevisTotals,
  createEmptyDevisDocument,
  createEmptyDevisLine,
  lineTotalHt,
} from '@/services/devisAssistant/calculator';
import { saveProfessionalDevis } from '@/services/devisAssistant/devisStorage';
import { exportProfessionalDevisPdf, type DevisPdfLabels } from '@/services/devisAssistant/exportDevisPdf';
import { fillDevisFromChantier } from '@/services/devisAssistant/fillFromChantier';
import type { DevisUnit, ProfessionalDevisDocument, ProfessionalDevisLine } from '@/types/professionalDevis';
import { formatCurrency, formatCurrencyPrecise, formatDate } from '@/utils/format';

const UNITS: DevisUnit[] = ['m²', 'ml', 'unité', 'm³'];
const PROJECT_TYPES = ['rénovation', 'neuf', 'extension', 'terrasse', 'piscine', 'autre'];

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500';

export function DevisAssistantPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();
  const { chantiers } = usePlatformData();
  const [doc, setDoc] = useState<ProfessionalDevisDocument>(() => createEmptyDevisDocument());
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? '');
  const [filling, setFilling] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const totals = useMemo(() => computeDevisTotals(doc), [doc]);

  const pdfLabels: DevisPdfLabels = useMemo(
    () => ({
      title: t('devis.pdfTitle'),
      devisNumber: t('devis.devisNumber'),
      date: t('devis.date'),
      client: t('devis.clientName'),
      site: t('devis.siteAddress'),
      city: t('devis.city'),
      projectType: t('devis.projectType'),
      colLot: t('devis.colLot'),
      colDescription: t('devis.colDescription'),
      colQty: t('devis.qty'),
      colUnit: t('devis.colUnit'),
      colUnitPrice: t('devis.colUnitPrice'),
      colLineTotal: t('devis.colLineTotal'),
      colTva: t('devis.colTva'),
      labour: t('devis.labour'),
      subtotalHt: t('devis.subtotalHt'),
      tvaTotal: t('devis.tvaTotal'),
      totalTtc: t('devis.totalTtc'),
      margin: t('devis.margin'),
      clientBudget: t('devis.clientBudget'),
      budgetVariance: t('devis.budgetVariance'),
      observations: t('devis.observations'),
      conditionsTitle: t('devis.conditionsTitle'),
      conditions1: t('devis.conditions1'),
      conditions2: t('devis.conditions2'),
      signature: t('devis.signature'),
      signatureClient: t('devis.signatureClient'),
      currencyNote: t('devis.currencyNote', { country: APP_COUNTRY, currency: APP_CURRENCY }),
    }),
    [t]
  );

  const patchDoc = (partial: Partial<ProfessionalDevisDocument>) => {
    setDoc((d) => ({ ...d, ...partial, updatedAt: new Date().toISOString() }));
  };

  const patchLine = (id: string, partial: Partial<ProfessionalDevisLine>) => {
    setDoc((d) => ({
      ...d,
      lines: d.lines.map((l) => (l.id === id ? { ...l, ...partial } : l)),
      updatedAt: new Date().toISOString(),
    }));
  };

  const addLine = () => {
    setDoc((d) => ({
      ...d,
      lines: [...d.lines, createEmptyDevisLine()],
      updatedAt: new Date().toISOString(),
    }));
  };

  const removeLine = (id: string) => {
    setDoc((d) => ({
      ...d,
      lines: d.lines.length > 1 ? d.lines.filter((l) => l.id !== id) : d.lines,
      updatedAt: new Date().toISOString(),
    }));
  };

  const importLine = (line: ProfessionalDevisLine) => {
    setDoc((d) => ({
      ...d,
      lines: [...d.lines, line],
      updatedAt: new Date().toISOString(),
    }));
    success(t('devis.importedLine'));
  };

  const handleSave = () => {
    saveProfessionalDevis(doc);
    success(t('notifications.saved'));
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportProfessionalDevisPdf(doc, pdfLabels);
      success(t('devis.pdfDownloaded'));
    } catch (e) {
      error(e instanceof Error ? e.message : t('devis.pdfFailed'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleFillChantier = async () => {
    if (!chantierId) return;
    setFilling(true);
    try {
      setDoc(await fillDevisFromChantier(doc, chantierId));
      success(t('devis.filledFromSite'));
    } finally {
      setFilling(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('devis.title')} subtitle={t('devis.subtitle')} />
      <PageQuickNav
        preset="full"
        extra={[
          { to: '/recherche', labelKey: 'nav.search' },
          { to: '/assistant-achat', labelKey: 'nav.purchaseAssistant' },
          { to: '/plan-extraction', labelKey: 'nav.planExtraction' },
        ]}
      />

      <p className="text-xs text-slate-500 mb-4">{t('devis.franceEurOnly')}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title={t('devis.subtotalHt')} value={formatCurrencyPrecise(totals.subtotalHt)} icon={FileText} />
        <StatCard title={t('devis.tvaTotal')} value={formatCurrencyPrecise(totals.tvaAmount)} icon={FileText} />
        <StatCard title={t('devis.totalTtc')} value={formatCurrencyPrecise(totals.totalTtc)} icon={FileText} variant="success" />
        <StatCard
          title={t('devis.margin')}
          value={`${totals.marginPercent} %`}
          trend={formatCurrency(totals.marginAmountHt)}
          icon={Building2}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <Card title={t('devis.formHeader')} className="lg:col-span-2">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.clientName')}</span>
              <input
                className={inputClass + ' mt-1'}
                value={doc.clientName}
                onChange={(e) => patchDoc({ clientName: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.city')}</span>
              <input
                className={inputClass + ' mt-1'}
                value={doc.city}
                onChange={(e) => patchDoc({ city: e.target.value })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-slate-500">{t('devis.siteAddress')}</span>
              <input
                className={inputClass + ' mt-1'}
                value={doc.siteAddress}
                onChange={(e) => patchDoc({ siteAddress: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.projectType')}</span>
              <select
                className={inputClass + ' mt-1'}
                value={doc.projectType}
                onChange={(e) => patchDoc({ projectType: e.target.value })}
              >
                {PROJECT_TYPES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.devisNumber')}</span>
              <input className={inputClass + ' mt-1'} readOnly value={doc.devisNumber} />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.labour')}</span>
              <input
                type="number"
                min={0}
                step={100}
                className={inputClass + ' mt-1'}
                value={doc.labourTotalHt || ''}
                onChange={(e) => patchDoc({ labourTotalHt: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.marginPercent')}</span>
              <input
                type="number"
                min={0}
                max={100}
                className={inputClass + ' mt-1'}
                value={doc.marginPercent}
                onChange={(e) => patchDoc({ marginPercent: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block">
              <span className="text-xs text-slate-500">{t('devis.clientBudget')}</span>
              <input
                type="number"
                min={0}
                className={inputClass + ' mt-1'}
                value={doc.clientBudgetHt || ''}
                onChange={(e) => patchDoc({ clientBudgetHt: Number(e.target.value) || 0 })}
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-slate-500">{t('devis.observations')}</span>
              <textarea
                rows={2}
                className={inputClass + ' mt-1'}
                value={doc.observations}
                onChange={(e) => patchDoc({ observations: e.target.value })}
              />
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            {t('devis.date')}: {formatDate(doc.createdAt)}
            {totals.clientBudgetHt > 0 && (
              <>
                {' · '}
                {t('devis.budgetVariance')}: {formatCurrency(totals.budgetVarianceHt)}{' '}
                {totals.withinBudget ? '✓' : '⚠'}
              </>
            )}
          </p>
        </Card>

        <div className="space-y-4">
          <ImportProcurementToDevis onImport={importLine} />
          <Card title={t('devis.fillFromSite')}>
            <select
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              className={inputClass + ' mb-2'}
            >
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button variant="secondary" className="w-full" onClick={() => void handleFillChantier()} disabled={filling}>
              {filling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              {t('devis.fillFromSiteBtn')}
            </Button>
            <p className="text-[10px] text-slate-600 mt-2">
              {t('devis.planHint')}{' '}
              <Link to="/plan-extraction" className="text-cyan-400 hover:underline">
                {t('nav.planExtraction')}
              </Link>
            </p>
          </Card>
        </div>
      </div>

      <Card title={t('devis.linesTitle')} className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="secondary" onClick={addLine}>
            <Plus className="w-4 h-4" />
            {t('devis.addLine')}
          </Button>
        </div>
        <div className="overflow-x-auto table-scroll space-y-4">
          {doc.lines.map((line) => (
            <div
              key={line.id}
              className="rounded-lg border border-btp-600/30 bg-btp-900/30 p-3 grid gap-2 lg:grid-cols-12 lg:items-end"
            >
              <label className="lg:col-span-2 block">
                <span className="text-[10px] text-slate-500">{t('devis.colLot')}</span>
                <input
                  className={inputClass + ' mt-0.5'}
                  value={line.workLot}
                  onChange={(e) => patchLine(line.id, { workLot: e.target.value })}
                />
              </label>
              <label className="lg:col-span-3 block">
                <span className="text-[10px] text-slate-500">{t('devis.colDescription')}</span>
                <input
                  className={inputClass + ' mt-0.5'}
                  value={line.description}
                  onChange={(e) => patchLine(line.id, { description: e.target.value })}
                />
              </label>
              <label className="lg:col-span-1 block">
                <span className="text-[10px] text-slate-500">{t('devis.qty')}</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={inputClass + ' mt-0.5'}
                  value={line.quantity === 0 ? '' : line.quantity}
                  onChange={(e) => {
                    const raw = e.target.value;
                    patchLine(line.id, { quantity: raw === '' ? 0 : Number(raw) });
                  }}
                />
              </label>
              <label className="lg:col-span-1 block">
                <span className="text-[10px] text-slate-500">{t('devis.colUnit')}</span>
                <select
                  className={inputClass + ' mt-0.5'}
                  value={line.unit}
                  onChange={(e) => patchLine(line.id, { unit: e.target.value as DevisUnit })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label className="lg:col-span-2 block">
                <span className="text-[10px] text-slate-500">{t('devis.colUnitPrice')}</span>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  className={inputClass + ' mt-0.5'}
                  value={line.unitPriceHt === 0 ? '' : line.unitPriceHt}
                  onChange={(e) => {
                    const raw = e.target.value;
                    patchLine(line.id, { unitPriceHt: raw === '' ? 0 : Number(raw) });
                  }}
                />
              </label>
              <label className="lg:col-span-1 block">
                <span className="text-[10px] text-slate-500">{t('devis.colTva')}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass + ' mt-0.5'}
                  value={line.tvaPercent}
                  onChange={(e) => patchLine(line.id, { tvaPercent: Number(e.target.value) || 0 })}
                />
              </label>
              <div className="lg:col-span-1 text-end">
                <p className="text-[10px] text-slate-500">{t('devis.colLineTotal')}</p>
                <p className="text-sm font-semibold text-cyan-400">{formatCurrencyPrecise(lineTotalHt(line))}</p>
              </div>
              <div className="lg:col-span-1 flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => removeLine(line.id)} aria-label={t('common.delete')}>
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
              {line.productUrl && (
                <p className="lg:col-span-12 text-[10px] text-cyan-500/80 truncate">
                  {line.supplier && `${line.supplier} · `}
                  {line.productUrl}
                </p>
              )}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void handleExportPdf()} disabled={exportingPdf}>
          {exportingPdf ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileDown className="w-4 h-4" />
          )}
          {exportingPdf ? t('devis.generatingPdf') : t('devis.generatePdf')}
        </Button>
        <Button variant="secondary" onClick={handleSave}>
          <Save className="w-4 h-4" />
          {t('common.save')}
        </Button>
      </div>

      {filling && <LoadingBlock label={t('devis.generating')} />}
    </div>
  );
}
