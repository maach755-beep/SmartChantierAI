import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Copy,
  ExternalLink,
  FileDown,
  GitCompare,
  History,
  Loader2,
  Save,
  Search,
  Trash2,
  ScrollText,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { useToast } from '@/contexts/ToastContext';
import { compareTechnicalSheets } from '@/services/ficheTechnique/ficheTechniqueComparison';
import { searchTechnicalProduct } from '@/services/ficheTechnique/ficheTechniqueSearch';
import {
  deleteTechnicalSheet,
  listTechnicalSheets,
  saveTechnicalSheet,
} from '@/services/ficheTechnique/ficheTechniqueStorage';
import {
  generateAndSaveComparisonPdf,
  generateAndSaveFicheTechniquePdf,
} from '@/pdf/ficheTechniquePdfGenerator';
import { preloadPdfFonts } from '@/services/pdf/pdfFonts';
import { isRealWebSearchEnabled } from '@/services/realSearch/config';
import type {
  FicheTechniquePdfLabels,
  FicheTechniqueSearchInput,
  TechnicalSheetConfidence,
  TechnicalSheetProduct,
} from '@/types/ficheTechnique';
import { formatDate } from '@/utils/format';
import { safeRenderValue } from '@/utils/safeRenderValue';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500';

const EXAMPLE_CHIPS = [
  'Carrelage extérieur 60x60 antidérapant Nice',
  'BA13 Placoplatre hydrofuge',
  'Garde-corps inox 316',
  'Peinture Tollens façade extérieure',
  'Isolant Rockwool acoustique',
  'Colle carrelage C2S1',
  'Mortier hydrofuge',
  'Receveur de douche extra plat',
];

const emptyInput = (): FicheTechniqueSearchInput => ({
  productName: '',
  reference: '',
  supplierUrl: '',
  manufacturerUrl: '',
  brand: '',
  category: '',
  useCase: '',
  city: '',
});

function confidenceBadgeVariant(c: TechnicalSheetConfidence): 'green' | 'orange' | 'gray' {
  if (c === 'confirme') return 'green';
  if (c === 'a_verifier') return 'orange';
  return 'gray';
}

export function AssistantFicheTechniquePage() {
  const { t } = useTranslation();
  const { success, error } = useToast();

  const [form, setForm] = useState<FicheTechniqueSearchInput>(emptyInput);
  const [results, setResults] = useState<TechnicalSheetProduct[]>([]);
  const [providerNote, setProviderNote] = useState('');
  const [selected, setSelected] = useState<TechnicalSheetProduct | null>(null);
  const [compareList, setCompareList] = useState<TechnicalSheetProduct[]>([]);
  const [history, setHistory] = useState<TechnicalSheetProduct[]>(() => listTechnicalSheets());
  const [searching, setSearching] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingCompare, setExportingCompare] = useState(false);

  useEffect(() => {
    void preloadPdfFonts().catch(() => undefined);
  }, []);

  const pdfLabels: FicheTechniquePdfLabels = useMemo(
    () => ({
      title: t('techSheet.pdfTitle'),
      comparisonTitle: t('techSheet.comparisonPdfTitle'),
      productName: t('techSheet.productName'),
      reference: t('techSheet.reference'),
      brand: t('techSheet.brand'),
      manufacturer: t('techSheet.manufacturer'),
      supplier: t('techSheet.supplier'),
      category: t('techSheet.category'),
      description: t('techSheet.description'),
      useCase: t('techSheet.useCase'),
      specifications: t('techSheet.specifications'),
      dimensions: t('techSheet.dimensions'),
      thickness: t('techSheet.thickness'),
      weight: t('techSheet.weight'),
      material: t('techSheet.material'),
      color: t('techSheet.color'),
      finish: t('techSheet.finish'),
      indoorOutdoorUse: t('techSheet.indoorOutdoorUse'),
      resistance: t('techSheet.resistance'),
      fireClassification: t('techSheet.fireRating'),
      thermalPerformance: t('techSheet.thermalPerformance'),
      acousticPerformance: t('techSheet.acousticPerformance'),
      slipResistance: t('techSheet.slipResistance'),
      waterResistance: t('techSheet.waterResistance'),
      uvResistance: t('techSheet.uvResistance'),
      loadResistance: t('techSheet.loadResistance'),
      certifications: t('techSheet.certifications'),
      ceStandards: t('techSheet.ceStandards'),
      normes: t('techSheet.normes'),
      warranty: t('techSheet.warranty'),
      countryOfOrigin: t('techSheet.countryOfOrigin'),
      environmentalSheet: t('techSheet.environmentalSheet'),
      safetySheet: t('techSheet.safetySheet'),
      productImage: t('techSheet.productImage'),
      noImage: t('techSheet.noImage'),
      sources: t('techSheet.sources'),
      notes: t('techSheet.notes'),
      confidence: t('techSheet.confidence'),
      confidenceConfirme: t('techSheet.confidenceConfirme'),
      confidenceAVerifier: t('techSheet.confidenceAVerifier'),
      confidenceEstimee: t('techSheet.confidenceEstimee'),
      provisionalBanner: t('techSheet.provisionalBanner'),
      generatedAt: t('techSheet.generatedAt'),
      specLabel: t('techSheet.specLabel'),
      specValue: t('techSheet.specValue'),
      usageRecommendations: t('techSheet.usageRecommendations'),
      footer: t('techSheet.pdfFooter'),
      advantages: t('techSheet.advantages'),
      disadvantages: t('techSheet.disadvantages'),
      suitability: t('techSheet.suitability'),
      recommendedProduct: t('techSheet.recommendedProduct'),
      recommendationReason: t('techSheet.recommendationReason'),
      price: t('techSheet.price'),
      availability: t('techSheet.availability'),
    }),
    [t]
  );

  const confidenceLabel = useCallback(
    (c: TechnicalSheetConfidence, provisional?: boolean) => {
      if (provisional) return t('techSheet.provisionalBanner');
      if (c === 'confirme') return t('techSheet.confidenceConfirme');
      if (c === 'a_verifier') return t('techSheet.confidenceAVerifier');
      return t('techSheet.confidenceEstimee');
    },
    [t]
  );

  const updateField = (key: keyof FicheTechniqueSearchInput, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const applyChip = (chip: string) => {
    setForm((prev) => ({ ...prev, productName: chip }));
  };

  const handleSearch = async () => {
    if (!form.productName.trim()) {
      error(t('techSheet.errorProductName'));
      return;
    }
    setSearching(true);
    setResults([]);
    setSelected(null);
    try {
      const res = await searchTechnicalProduct(form);
      setResults(res.products);
      setProviderNote(res.providerNote);
      if (res.products.length === 1) setSelected(res.products[0]);
      if (!res.searchConfigured) error(res.providerNote);
      else if (res.products.every((p) => p.isProvisional)) error(t('techSheet.noExactProduct'));
      else success(t('techSheet.searchDone', { count: res.products.length }));
    } catch (e) {
      console.error('[AssistantFicheTechnique] search failed:', e);
      error(e instanceof Error ? e.message : t('techSheet.errorSearch'));
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = (product: TechnicalSheetProduct) => {
    setSelected(product);
  };

  const toggleCompare = (product: TechnicalSheetProduct) => {
    setCompareList((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        error(t('techSheet.compareMax'));
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleSave = (product: TechnicalSheetProduct) => {
    saveTechnicalSheet(product);
    setHistory(listTechnicalSheets());
    success(t('techSheet.saved'));
  };

  const handleCopy = async (product: TechnicalSheetProduct) => {
    const text = [
      `${t('techSheet.productName')}: ${product.productName}`,
      `${t('techSheet.reference')}: ${product.reference}`,
      `${t('techSheet.brand')}: ${product.brand}`,
      `${t('techSheet.supplier')}: ${product.supplier}`,
      `${t('techSheet.description')}: ${product.description}`,
      `${t('techSheet.sources')}: ${product.sourceUrls.join(', ')}`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      success(t('techSheet.copied'));
    } catch (e) {
      console.error('[AssistantFicheTechnique] copy failed:', e);
      error(t('techSheet.errorCopy'));
    }
  };

  const handleExportPdf = async (product: TechnicalSheetProduct) => {
    setExportingPdf(true);
    try {
      await generateAndSaveFicheTechniquePdf(product, pdfLabels);
      success(t('techSheet.pdfDownloaded'));
    } catch (e) {
      console.error('[AssistantFicheTechnique] PDF export failed:', e);
      error(e instanceof Error ? e.message : t('techSheet.errorPdf'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleComparePdf = async () => {
    if (compareList.length < 2) {
      error(t('techSheet.compareMin'));
      return;
    }
    setExportingCompare(true);
    try {
      const comparison = compareTechnicalSheets(compareList);
      await generateAndSaveComparisonPdf(comparison, pdfLabels);
      success(t('techSheet.comparisonPdfDownloaded'));
    } catch (e) {
      console.error('[AssistantFicheTechnique] comparison PDF failed:', e);
      error(e instanceof Error ? e.message : t('techSheet.errorComparisonPdf'));
    } finally {
      setExportingCompare(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    deleteTechnicalSheet(id);
    setHistory(listTechnicalSheets());
    success(t('techSheet.deleted'));
  };

  const compareProducts = compareList;

  return (
    <div>
      <PageHeader title={t('techSheet.title')} subtitle={t('techSheet.subtitle')} />
      <PageQuickNav
        preset="full"
        extra={[
          { to: '/assistant-devis-ia', labelKey: 'nav.devisAssistant' },
          { to: '/assistant-achat', labelKey: 'nav.purchaseAssistant' },
          { to: '/recherche', labelKey: 'nav.search' },
        ]}
      />

      <p className="text-xs text-slate-500 mb-2">{t('techSheet.intro')}</p>
      {!isRealWebSearchEnabled() && (
        <p className="text-xs text-amber-400/90 mb-4">{t('techSheet.tavilyNotConfigured')}</p>
      )}

      <Card title={t('techSheet.formTitle')} className="mb-6">
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block sm:col-span-2">
            <span className="text-xs text-slate-500">{t('techSheet.searchProduct')} *</span>
            <input
              className={inputClass + ' mt-1'}
              value={form.productName}
              onChange={(e) => updateField('productName', e.target.value)}
              placeholder={t('techSheet.productNamePlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.reference')}</span>
            <input className={inputClass + ' mt-1'} value={form.reference} onChange={(e) => updateField('reference', e.target.value)} placeholder={t('techSheet.referencePlaceholder')} />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.brand')}</span>
            <input className={inputClass + ' mt-1'} value={form.brand} onChange={(e) => updateField('brand', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.category')}</span>
            <input className={inputClass + ' mt-1'} value={form.category} onChange={(e) => updateField('category', e.target.value)} />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.useCase')}</span>
            <input className={inputClass + ' mt-1'} value={form.useCase} onChange={(e) => updateField('useCase', e.target.value)} placeholder={t('techSheet.useCasePlaceholder')} />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.city')}</span>
            <input className={inputClass + ' mt-1'} value={form.city} onChange={(e) => updateField('city', e.target.value)} placeholder="Nice, Paris…" />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.supplierUrl')}</span>
            <input type="url" className={inputClass + ' mt-1'} value={form.supplierUrl} onChange={(e) => updateField('supplierUrl', e.target.value)} placeholder="https://www.pointp.fr/..." />
          </label>
          <label className="block">
            <span className="text-xs text-slate-500">{t('techSheet.manufacturerUrl')}</span>
            <input type="url" className={inputClass + ' mt-1'} value={form.manufacturerUrl} onChange={(e) => updateField('manufacturerUrl', e.target.value)} placeholder="https://..." />
          </label>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {EXAMPLE_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => applyChip(chip)}
              className="text-[11px] px-2.5 py-1 rounded-full border border-btp-600/40 text-slate-400 hover:text-white hover:border-cyan-500/50 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <Button onClick={() => void handleSearch()} disabled={searching || !form.productName.trim()}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {searching ? t('techSheet.searching') : t('techSheet.search')}
          </Button>
          {selected && (
            <>
              <Button variant="secondary" onClick={() => void handleExportPdf(selected)} disabled={exportingPdf}>
                {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
                {exportingPdf ? t('techSheet.generatingPdf') : t('techSheet.generatePdf')}
              </Button>
              <Button variant="secondary" onClick={() => void handleCopy(selected)}>
                <Copy className="w-4 h-4" />
                {t('techSheet.copySheet')}
              </Button>
              <Button variant="secondary" onClick={() => handleSave(selected)}>
                <Save className="w-4 h-4" />
                {t('techSheet.save')}
              </Button>
            </>
          )}
          {compareList.length >= 2 && (
            <Button variant="secondary" onClick={() => void handleComparePdf()} disabled={exportingCompare}>
              {exportingCompare ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
              {t('techSheet.generateComparisonPdf')}
            </Button>
          )}
        </div>
      </Card>

      {searching && <LoadingBlock label={t('techSheet.searching')} />}

      {providerNote && !searching && (
        <p className="text-xs text-slate-500 mb-4">{providerNote}</p>
      )}

      {results.length > 0 && !searching && (
        <>
          <h3 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-cyan-400" />
            {t('techSheet.resultsTitle')} ({results.length})
          </h3>
          <div className="grid lg:grid-cols-2 gap-3 mb-6">
            {results.map((product) => (
              <Card key={product.id} className={selected?.id === product.id ? 'ring-1 ring-cyan-500/50' : ''}>
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-white text-sm">{product.productName}</p>
                    <p className="text-xs text-slate-500">{product.brand} · {product.supplier}</p>
                  </div>
                  <Badge variant={confidenceBadgeVariant(product.confidence)}>
                    {confidenceLabel(product.confidence, product.isProvisional)}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mb-2 line-clamp-2">{product.description}</p>
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-3">
                  {product.reference !== '—' && <span>{t('techSheet.reference')}: {product.reference}</span>}
                  {product.priceLabel && <span>{product.priceLabel}</span>}
                  {product.availabilityLabel && <span>{product.availabilityLabel}</span>}
                </div>
                {product.sourceUrls[0] && (
                  <a href={product.sourceUrls[0]} target="_blank" rel="noopener noreferrer" className="text-[10px] text-cyan-500/90 truncate block mb-3">
                    {product.sourceUrls[0]}
                  </a>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => handleSelect(product)}>{t('techSheet.select')}</Button>
                  {product.sourceUrls[0] && (
                    <a href={product.sourceUrls[0]} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary"><ExternalLink className="w-3 h-3" />{t('techSheet.openSource')}</Button>
                    </a>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => void handleExportPdf(product)} disabled={exportingPdf}>
                    <FileDown className="w-3 h-3" />{t('techSheet.generateSheetPdf')}
                  </Button>
                  <Button
                    size="sm"
                    variant={compareList.some((p) => p.id === product.id) ? 'primary' : 'secondary'}
                    onClick={() => toggleCompare(product)}
                  >
                    <GitCompare className="w-3 h-3" />{t('techSheet.addToCompare')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {selected && !searching && (
        <Card title={t('techSheet.previewTitle')} className="mb-6">
          {selected.isProvisional && (
            <p className="text-xs text-amber-400 mb-3">{t('techSheet.provisionalBanner')}</p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm mb-4">
            {[
              { label: t('techSheet.brand'), value: selected.brand },
              { label: t('techSheet.manufacturer'), value: selected.manufacturer },
              { label: t('techSheet.category'), value: selected.category },
              { label: t('techSheet.material'), value: selected.material },
              { label: t('techSheet.dimensions'), value: selected.dimensions },
              { label: t('techSheet.thickness'), value: selected.thickness },
              { label: t('techSheet.slipResistance'), value: selected.slipResistance },
              { label: t('techSheet.normes'), value: selected.normes },
              { label: t('techSheet.warranty'), value: selected.warranty },
            ].map((row) => (
              <div key={row.label} className="rounded-lg border border-btp-600/30 bg-btp-900/30 px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-slate-500">{row.label}</p>
                <p className="text-white font-medium mt-0.5">{safeRenderValue(row.value)}</p>
              </div>
            ))}
          </div>
          <p className="text-sm text-slate-400 whitespace-pre-wrap">{selected.description}</p>
          {selected.sourceUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-500 mb-1">{t('techSheet.sources')}</p>
              {selected.sourceUrls.map((url) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-cyan-500/90 truncate">{url}</a>
              ))}
            </div>
          )}
        </Card>
      )}

      {compareProducts.length >= 2 && (
        <Card title={t('techSheet.compareTitle')} className="mb-6">
          <p className="text-xs text-slate-400 mb-3">{t('techSheet.compareHint', { count: compareProducts.length })}</p>
          <ul className="text-sm text-slate-300 space-y-1">
            {compareProducts.map((p) => (
              <li key={p.id}>• {p.productName} ({p.brand})</li>
            ))}
          </ul>
        </Card>
      )}

      {history.length > 0 && (
        <Card title={t('techSheet.historyTitle')} className="mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-btp-600/30">
                  <th className="py-2 pr-3">{t('techSheet.generatedAt')}</th>
                  <th className="py-2 pr-3">{t('techSheet.productName')}</th>
                  <th className="py-2 pr-3">{t('techSheet.supplier')}</th>
                  <th className="py-2 pr-3">{t('techSheet.brand')}</th>
                  <th className="py-2 pr-3">{t('techSheet.confidence')}</th>
                  <th className="py-2">{t('techSheet.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} className="border-b border-btp-600/20">
                    <td className="py-2 pr-3 text-slate-400">{formatDate(item.generatedAt)}</td>
                    <td className="py-2 pr-3 text-white">{item.productName}</td>
                    <td className="py-2 pr-3 text-slate-400">{item.supplier}</td>
                    <td className="py-2 pr-3 text-slate-400">{item.brand}</td>
                    <td className="py-2 pr-3">
                      <Badge variant={confidenceBadgeVariant(item.confidence)}>
                        {confidenceLabel(item.confidence, item.isProvisional)}
                      </Badge>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        <Button size="sm" variant="secondary" onClick={() => setSelected(item)}>
                          <History className="w-3 h-3" />{t('techSheet.open')}
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => void handleExportPdf(item)} disabled={exportingPdf}>
                          <FileDown className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => handleDeleteHistory(item.id)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
