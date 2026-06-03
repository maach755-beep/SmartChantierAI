import { useTranslation } from 'react-i18next';
import { FileDown } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePlatformData } from '@/hooks/usePlatformData';
import { generateAvenantPdf } from '@/services/exportService';
import { formatCurrency } from '@/utils/format';
import type { Modification } from '@/types';

const statusMap: Record<Modification['status'], { key: string; variant: 'gray' | 'orange' | 'green' | 'red' }> = {
  draft: { key: 'modifications.draft', variant: 'gray' },
  pending: { key: 'modifications.pending', variant: 'orange' },
  approved: { key: 'modifications.approved', variant: 'green' },
  rejected: { key: 'modifications.rejected', variant: 'red' },
};

export function ModificationsPage() {
  const { t } = useTranslation();
  const { modifications } = usePlatformData();

  return (
    <div>
      <PageHeader title={t('modifications.title')} />
      <PageQuickNav preset="ops" extra={[{ to: '/projets', labelKey: 'nav.projects' }]} />
      <DataTable
        data={modifications}
        columns={[
          { key: 'chantierName', header: t('common.chantier') },
          { key: 'title', header: t('modifications.modTitle') },
          { key: 'room', header: t('modifications.room') },
          {
            key: 'status',
            header: t('common.status'),
            render: (m) => {
              const s = statusMap[m.status];
              return <Badge variant={s.variant}>{t(s.key)}</Badge>;
            },
          },
          {
            key: 'budgetImpact',
            header: t('modifications.budgetImpact'),
            render: (m) => formatCurrency(m.budgetImpact),
          },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (m) => (
              <Button size="sm" variant="secondary" onClick={() => void generateAvenantPdf(m)}>
                <FileDown className="w-3 h-3" />
                {t('modifications.generatePdf')}
              </Button>
            ),
          },
        ]}
      />
      <Card title={t('modifications.history')} className="mt-6">
        {modifications[0]?.history.map((h, i) => (
          <p key={i} className="text-sm text-slate-400 py-1 border-b border-btp-800/30 last:border-0">
            {h.date} — {h.action} ({h.user})
          </p>
        ))}
      </Card>
    </div>
  );
}
