import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Building2 } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { ProcurementAssistantPanel } from '@/components/procurement/ProcurementAssistantPanel';
import { runGlobalSearch } from '@/services/globalSearchService';
import type { GlobalSearchCategory } from '@/types/globalSearch';

const INTERNAL_CATEGORY_I18N: Record<GlobalSearchCategory, string> = {
  projects: 'search.catProjects',
  tasks: 'search.catTasks',
  teams: 'search.catTeams',
  materials: 'search.catMaterials',
  suppliers: 'search.catSuppliers',
  documents: 'search.catDocuments',
  reports: 'search.catReports',
  aiAnalyses: 'search.catAiAnalyses',
  profitability: 'search.catProfitability',
};

const EXAMPLE_QUERY = 'Carrelage extérieur 60x60 pour terrasse 80m² budget 35€/m² Nice';

export function SearchPage() {
  const { t } = useTranslation();

  const [internalQuery, setInternalQuery] = useState('');
  const [showInternal, setShowInternal] = useState(false);

  const internalResults = internalQuery.trim() ? runGlobalSearch(internalQuery.trim()) : null;

  return (
    <div>
      <PageHeader title={t('search.title')} subtitle={t('search.subtitleProcurement')} />
      <PageQuickNav
        preset="full"
        extra={[
          { to: '/assistant-achat', labelKey: 'nav.purchaseAssistant' },
          { to: '/assistant-devis-ia', labelKey: 'nav.devisAssistant' },
          { to: '/assistant-fiche-technique', labelKey: 'nav.techSheetAssistant' },
          { to: '/fournisseurs', labelKey: 'nav.suppliers' },
        ]}
      />

      <ProcurementAssistantPanel exampleQuery={EXAMPLE_QUERY} />

      <section className="mt-10 border-t border-btp-700/40 pt-8">
        <button
          type="button"
          onClick={() => setShowInternal(!showInternal)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
        >
          <Building2 className="w-4 h-4" />
          {t('search.internalToggle')}
          <ChevronRight className={`w-4 h-4 transition-transform ${showInternal ? 'rotate-90' : ''}`} />
        </button>

        {showInternal && (
          <>
            <input
              value={internalQuery}
              onChange={(e) => setInternalQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="w-full mb-4 px-4 py-2 rounded-lg bg-btp-900/60 border border-btp-600/30 text-sm text-white"
            />
            {internalResults && internalResults.totalCount > 0 && (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  {t('search.resultsCount', { count: internalResults.totalCount })}
                </p>
                {internalResults.groups.map((group) => (
                  <div key={group.category}>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase mb-1">
                      {t(INTERNAL_CATEGORY_I18N[group.category])}
                    </h3>
                    <ul className="rounded-lg border border-btp-700/30 divide-y divide-btp-800/50">
                      {group.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            to={item.href}
                            className="block px-3 py-2 text-sm text-slate-300 hover:bg-btp-800/40"
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {internalQuery.trim() && internalResults?.totalCount === 0 && (
              <p className="text-sm text-slate-500">{t('search.noResults')}</p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
