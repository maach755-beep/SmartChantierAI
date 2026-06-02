import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileDown, FileText, Loader2, Sparkles, Link2, Package } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { useToast } from '@/contexts/ToastContext';
import { exportTechnicalSheetFromInput } from '@/services/technicalSheet/exportTechnicalSheetPdf';
import { generateTechnicalSheet } from '@/services/technicalSheet/engine';
import { preloadPdfFonts } from '@/services/pdf/pdfFonts';
import type { TechnicalSheetDocument, TechnicalSheetPdfLabels } from '@/types/technicalSheet';
import { formatDate } from '@/utils/format';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500';

export function TechnicalSheetAssistantPage() {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [productName, setProductName] = useState('');
  const [reference, setReference] = useState('');
  const [supplierUrl, setSupplierUrl] = useState('');
  const [preview, setPreview] = useState<TechnicalSheetDocument | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    void preloadPdfFonts().catch(() => undefined);
  }, []);

  const pdfLabels: TechnicalSheetPdfLabels = useMemo(
    () => ({
      title: t('techSheet.pdfTitle'),
      sheetNumber: t('techSheet.sheetNumber'),
      generatedAt: t('techSheet.generatedAt'),
      productName: t('techSheet.productName'),
      reference: t('techSheet.reference'),
      brand: t('techSheet.brand'),
      supplier: t('techSheet.supplier'),
      description: t('techSheet.description'),
      specifications: t('techSheet.specifications'),
      dimensions: t('techSheet.dimensions'),
      weight: t('techSheet.weight'),
      material: t('techSheet.material'),
      color: t('techSheet.color'),
      standards: t('techSheet.standards'),
      fireRating: t('techSheet.fireRating'),
      warranty: t('techSheet.warranty'),
      productImage: t('techSheet.productImage'),
      supplierUrl: t('techSheet.supplierUrl'),
      noImage: t('techSheet.noImage'),
      specLabel: t('techSheet.specLabel'),
      specValue: t('techSheet.specValue'),
    }),
    [t]
  );

  const handleAnalyze = async () => {
    if (!productName.trim()) {
      error(t('techSheet.errorProductName'));
      return;
    }
    setAnalyzing(true);
    try {
      const sheet = await generateTechnicalSheet({ productName, reference, supplierUrl });
      setPreview(sheet);
      success(t('techSheet.analyzed'));
    } catch (e) {
      error(e instanceof Error ? e.message : t('techSheet.errorAnalyze'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportPdf = async () => {
    setExporting(true);
    try {
      await exportTechnicalSheetFromInput({ productName, reference, supplierUrl }, pdfLabels);
      success(t('techSheet.pdfDownloaded'));
    } catch (e) {
      error(e instanceof Error ? e.message : t('techSheet.errorPdf'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('techSheet.title')} subtitle={t('techSheet.subtitle')} />
      <PageQuickNav
        preset="full"
        extra={[
          { to: '/assistant-devis-ia', labelKey: 'nav.devisAssistant' },
          { to: '/bibliotheque-materiaux', labelKey: 'nav.materialsLibrary' },
          { to: '/recherche', labelKey: 'nav.search' },
        ]}
      />

      <p className="text-xs text-slate-500 mb-4">{t('techSheet.intro')}</p>

      <div className="grid sm:grid-cols-3 gap-3 mb-6">
        <StatCard title={t('techSheet.productName')} value={productName || '—'} icon={Package} />
        <StatCard title={t('techSheet.reference')} value={reference || '—'} icon={FileText} />
        <StatCard
          title={t('techSheet.supplier')}
          value={preview?.supplier ?? '—'}
          icon={Link2}
          variant={preview ? 'success' : 'default'}
        />
      </div>

      <Card title={t('techSheet.formTitle')} className="mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-500">{t('techSheet.productName')} *</span>
            <input
              className={inputClass + ' mt-1'}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t('techSheet.productNamePlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.reference')}</span>
            <input
              className={inputClass + ' mt-1'}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder={t('techSheet.referencePlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.supplierUrl')}</span>
            <input
              type="url"
              className={inputClass + ' mt-1'}
              value={supplierUrl}
              onChange={(e) => setSupplierUrl(e.target.value)}
              placeholder="https://www.pointp.fr/..."
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Button variant="secondary" onClick={() => void handleAnalyze()} disabled={analyzing || !productName.trim()}>
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? t('techSheet.analyzing') : t('techSheet.analyze')}
          </Button>
          <Button onClick={() => void handleExportPdf()} disabled={exporting || !productName.trim()}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {exporting ? t('techSheet.generatingPdf') : t('techSheet.generatePdf')}
          </Button>
        </div>
      </Card>

      {analyzing && <LoadingBlock label={t('techSheet.analyzing')} />}

      {preview && !analyzing && (
        <Card title={t('techSheet.previewTitle')} className="mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { label: t('techSheet.brand'), value: preview.brand },
              { label: t('techSheet.material'), value: preview.material },
              { label: t('techSheet.dimensions'), value: preview.dimensions },
              { label: t('techSheet.weight'), value: preview.weight },
              { label: t('techSheet.color'), value: preview.color },
              { label: t('techSheet.fireRating'), value: preview.fireRating },
              { label: t('techSheet.standards'), value: preview.standards },
              { label: t('techSheet.warranty'), value: preview.warranty },
              { label: t('techSheet.generatedAt'), value: formatDate(preview.generatedAt) },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-btp-600/30 bg-btp-900/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{row.label}</p>
                <p className="text-white font-medium mt-0.5">{row.value}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400 mt-4 whitespace-pre-wrap">{preview.description}</p>
          {preview.supplierUrl && (
            <p className="text-xs text-cyan-500/90 mt-2 truncate">
              {t('techSheet.supplierUrl')}: {preview.supplierUrl}
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
