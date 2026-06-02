import { useTranslation } from 'react-i18next';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';

export function SuppliersPage() {
  const { t } = useTranslation();
  const { suppliers } = useDemoData();

  return (
    <div>
      <PageHeader title={t('suppliers.title')} />
      <PageQuickNav preset="core" extra={[{ to: '/materiaux', labelKey: 'nav.materials' }]} />
      <DataTable
        data={suppliers}
        columns={[
          { key: 'name', header: t('suppliers.name') },
          { key: 'contact', header: t('suppliers.contact') },
          { key: 'phone', header: t('suppliers.phone') },
          { key: 'email', header: t('suppliers.email') },
          {
            key: 'materials',
            header: t('suppliers.materialsSupplied'),
            render: (s) => s.materials.slice(0, 2).join(', '),
          },
          { key: 'ordersCount', header: t('suppliers.orders') },
          { key: 'lateDeliveries', header: t('suppliers.lateDeliveries') },
          { key: 'pendingMaterials', header: t('suppliers.pending') },
          {
            key: 'performanceScore',
            header: t('suppliers.performance'),
            render: (s) => (
              <Badge variant={s.performanceScore >= 80 ? 'green' : s.performanceScore >= 60 ? 'orange' : 'red'}>
                {s.performanceScore}%
              </Badge>
            ),
          },
        ]}
      />
    </div>
  );
}
