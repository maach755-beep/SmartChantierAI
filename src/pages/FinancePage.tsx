import { useTranslation } from 'react-i18next';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { usePlatformData } from '@/hooks/usePlatformData';
import { formatCurrency } from '@/utils/format';
import type { Chantier, FinancialStatus } from '@/types';

function getFinancialStatus(c: Chantier): FinancialStatus {
  const ratio = c.budgetPlanned > 0 ? c.budgetConsumed / c.budgetPlanned : 0;
  if (ratio < 0.85 && c.progress > 50) return 'profitable';
  if (ratio > 0.98) return 'unprofitable';
  return 'watch';
}

export function FinancePage() {
  const { t } = useTranslation();
  const { chantiers } = usePlatformData();

  const rows = chantiers.map((c) => {
    const material = c.budgetConsumed * 0.45;
    const labor = c.budgetConsumed * 0.35;
    const mod = c.budgetConsumed * 0.08;
    const total = material + labor + mod;
    const margin = c.budgetPlanned - total;
    const status = getFinancialStatus(c);
    return { ...c, material, labor, mod, total, margin, status };
  });

  const statusLabel: Record<FinancialStatus, string> = {
    profitable: t('finance.profitable'),
    watch: t('finance.watch'),
    unprofitable: t('finance.unprofitable'),
  };

  return (
    <div>
      <PageHeader title={t('finance.title')} />
      <PageQuickNav preset="reports" />
      <DataTable
        data={rows}
        columns={[
          { key: 'name', header: t('common.chantier') },
          {
            key: 'budgetPlanned',
            header: t('site.budgetPlanned'),
            render: (r) => formatCurrency(r.budgetPlanned),
          },
          {
            key: 'budgetConsumed',
            header: t('site.budgetConsumed'),
            render: (r) => formatCurrency(r.budgetConsumed),
          },
          {
            key: 'material',
            header: t('finance.materialCost'),
            render: (r) => formatCurrency(r.material),
          },
          {
            key: 'labor',
            header: t('finance.laborCost'),
            render: (r) => formatCurrency(r.labor),
          },
          {
            key: 'margin',
            header: t('finance.margin'),
            render: (r) => formatCurrency(r.margin),
          },
          {
            key: 'status',
            header: t('common.status'),
            render: (r) => (
              <Badge variant={r.status === 'profitable' ? 'green' : r.status === 'unprofitable' ? 'red' : 'orange'}>
                {statusLabel[r.status]}
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
