import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { usePlatformData } from '@/hooks/usePlatformData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { createPurchaseOrder, deletePurchaseOrder } from '@/services/saas/platform';
import { generateAndSavePurchaseOrderPdf } from '@/services/pdf/devisPdfGenerator';
import { formatCurrency } from '@/utils/format';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white min-h-[44px]';

export function PurchaseOrdersManagePage() {
  const { t } = useTranslation();
  const { purchaseOrders, suppliers, chantiers, refresh, isLiveDb } = usePlatformData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    projectId: '',
    supplierId: '',
    totalHt: 500,
    tvaPercent: 20,
  });

  const save = async () => {
    try {
      const tva = (form.totalHt * form.tvaPercent) / 100;
      const number = `BC-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
      await createPurchaseOrder({
        projectId: form.projectId || undefined,
        supplierId: form.supplierId || undefined,
        number,
        totalHt: form.totalHt,
        totalTtc: form.totalHt + tva,
        userId: user?.id,
      });
      success(t('saas.poCreated'));
      setModal(false);
      await refresh();
    } catch (e) {
      error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const exportPdf = async (po: (typeof purchaseOrders)[0]) => {
    const supplier = suppliers.find((s) => s.id === po.supplier_id);
    try {
      await generateAndSavePurchaseOrderPdf({
        documentNumber: po.number,
        supplier: supplier?.name ?? 'Fournisseur',
        clientName: 'Chantier',
        lines: [
          {
            workLot: 'Commande',
            description: `Bon de commande ${po.number}`,
            quantity: 1,
            unit: 'forfait',
            unitPriceHt: Number(po.total_ht),
            tvaPercent: 20,
          },
        ],
      });
      success(t('common.exportPdf'));
    } catch (e) {
      error(e instanceof Error ? e.message : 'PDF');
    }
  };

  return (
    <div>
      <PageHeader title={t('saas.poTitle')} subtitle={t('saas.poSubtitle')} />
      {!isLiveDb && (
        <p className="text-xs text-amber-400 mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {t('saas.localDbMode')}
        </p>
      )}
      <Button className="mb-4" onClick={() => setModal(true)}>
        <Plus className="w-4 h-4" />
        {t('saas.createPO')}
      </Button>
      <DataTable
        data={purchaseOrders}
        columns={[
          { key: 'number', header: 'N° BC' },
          {
            key: 'supplier_id',
            header: t('suppliers.name'),
            render: (po) => suppliers.find((s) => s.id === po.supplier_id)?.name ?? '—',
          },
          {
            key: 'total_ttc',
            header: 'TTC',
            render: (po) => formatCurrency(Number(po.total_ttc)),
          },
          { key: 'status', header: t('common.status') },
          {
            key: 'id',
            header: t('common.actions'),
            render: (po) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => void exportPdf(po)}>
                  <FileDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    await deletePurchaseOrder(po.id);
                    await refresh();
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ),
          },
        ]}
      />
      <Modal open={modal} onClose={() => setModal(false)} title={t('saas.createPO')}>
        <div className="space-y-3">
          <select className={inputClass} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">{t('saas.noProject')}</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className={inputClass} value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
            <option value="">{t('suppliers.name')}</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <input type="number" className={inputClass} value={form.totalHt} onChange={(e) => setForm({ ...form, totalHt: Number(e.target.value) })} />
          <Button className="w-full" onClick={() => void save()}>{t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
