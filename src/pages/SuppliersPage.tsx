import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usePlatformData } from '@/hooks/usePlatformData';
import { useToast } from '@/contexts/ToastContext';
import { createSupplier, deleteSupplier } from '@/services/saas/platform';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white min-h-[44px]';

export function SuppliersPage() {
  const { t } = useTranslation();
  const { suppliers, refresh, isLiveDb } = usePlatformData();
  const { success, error } = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', phone: '', email: '', city: '' });

  const save = async () => {
    if (!form.name.trim()) return;
    try {
      await createSupplier({
        name: form.name,
        category: form.category || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        city: form.city || undefined,
      });
      success(t('saas.supplierCreated'));
      setModal(false);
      setForm({ name: '', category: '', phone: '', email: '', city: '' });
      await refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  return (
    <div>
      <PageHeader
        title={t('suppliers.title')}
        actions={
          <Button onClick={() => setModal(true)}>
            <Plus className="w-4 h-4" />
            {t('saas.createSupplier')}
          </Button>
        }
      />
      {!isLiveDb && (
        <p className="text-xs text-amber-400 mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {t('saas.localDbMode')}
        </p>
      )}
      <PageQuickNav preset="core" extra={[{ to: '/materiaux', labelKey: 'nav.materials' }, { to: '/bons-commande', labelKey: 'nav.purchaseOrders' }]} />
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
          {
            key: 'performanceScore',
            header: t('suppliers.performance'),
            render: (s) => (
              <Badge variant={s.performanceScore >= 80 ? 'green' : s.performanceScore >= 60 ? 'orange' : 'red'}>
                {s.performanceScore}%
              </Badge>
            ),
          },
          {
            key: 'id',
            header: t('common.actions'),
            render: (s) => (
              <Button
                size="sm"
                variant="danger"
                onClick={async () => {
                  await deleteSupplier(s.id);
                  await refresh();
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            ),
          },
        ]}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={t('saas.createSupplier')}>
        <div className="space-y-3">
          <input className={inputClass} placeholder={t('suppliers.name')} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputClass} placeholder={t('suppliers.contact')} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <input className={inputClass} placeholder={t('suppliers.phone')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input className={inputClass} placeholder={t('suppliers.email')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputClass} placeholder={t('devis.city')} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <Button className="w-full" onClick={() => void save()}>{t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
