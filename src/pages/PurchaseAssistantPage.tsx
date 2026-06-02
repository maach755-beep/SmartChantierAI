import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { ProcurementAssistantPanel } from '@/components/procurement/ProcurementAssistantPanel';

export function PurchaseAssistantPage() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t('purchase.title')} subtitle={t('purchase.subtitle')} />
      <PageQuickNav
        preset="full"
        extra={[
          { to: '/recherche', labelKey: 'nav.search' },
          { to: '/assistant-devis-ia', labelKey: 'nav.devisAssistant' },
          { to: '/fournisseurs', labelKey: 'nav.suppliers' },
        ]}
      />
      <p className="text-xs text-slate-500 mb-4">
        {t('purchase.franceOnly')} ·{' '}
        <Link to="/recherche" className="text-cyan-400 hover:underline">
          {t('nav.search')}
        </Link>
      </p>
      <ProcurementAssistantPanel />
    </div>
  );
}
