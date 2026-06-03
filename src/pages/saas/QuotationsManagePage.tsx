import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileSpreadsheet, Plus, Trash2, FileDown } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { DataTable } from '@/components/ui/DataTable';
import { usePlatformData } from '@/hooks/usePlatformData';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import {
  createQuotation,
  deleteQuotation,
  detectExpensiveQuotations,
} from '@/services/saas/platform';
import { exportProfessionalDevisPdf } from '@/services/devisAssistant/exportDevisPdf';
import { createEmptyDevisDocument } from '@/services/devisAssistant/calculator';
import { formatCurrency } from '@/utils/format';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white min-h-[44px]';

export function QuotationsManagePage() {
  const { t } = useTranslation();
  const { quotations, chantiers, refresh, isLiveDb } = usePlatformData();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [modal, setModal] = useState(false);
  const [alerts, setAlerts] = useState<Awaited<ReturnType<typeof detectExpensiveQuotations>>>([]);
  const [form, setForm] = useState({
    projectId: '',
    clientName: '',
    siteAddress: '',
    subtotalHt: 1000,
    tvaPercent: 20,
  });

  const loadAlerts = async () => {
    setAlerts(await detectExpensiveQuotations());
  };

  const save = async () => {
    try {
      const tva = (form.subtotalHt * form.tvaPercent) / 100;
      const totalTtc = form.subtotalHt + tva;
      const number = `DEV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 9000 + 1000)}`;
      await createQuotation({
        projectId: form.projectId || undefined,
        number,
        clientName: form.clientName,
        siteAddress: form.siteAddress,
        subtotalHt: form.subtotalHt,
        tvaAmount: tva,
        totalTtc,
        userId: user?.id,
      });
      success(t('saas.quotationCreated'));
      setModal(false);
      await refresh();
      await loadAlerts();
    } catch (e) {
      error(e instanceof Error ? e.message : 'Erreur');
    }
  };

  const exportPdf = async (q: (typeof quotations)[0]) => {
    const doc = createEmptyDevisDocument();
    doc.devisNumber = q.number;
    doc.clientName = q.client_name ?? '';
    doc.siteAddress = q.site_address ?? '';
    doc.lines = [
      {
        id: crypto.randomUUID(),
        workLot: 'Devis',
        description: `Devis ${q.number}`,
        quantity: 1,
        unit: 'unité',
        unitPriceHt: Number(q.subtotal_ht),
        tvaPercent: 20,
      },
    ];
    try {
      await exportProfessionalDevisPdf(doc, {
        title: 'DEVIS',
        devisNumber: 'N° devis',
        date: 'Date',
        client: 'Client',
        site: 'Chantier',
        city: 'Ville',
        projectType: 'Type',
        colLot: 'Lot',
        colDescription: 'Description',
        colQty: 'Qté',
        colUnit: 'Unité',
        colUnitPrice: 'P.U. HT',
        colLineTotal: 'Total HT',
        colTva: 'TVA',
        labour: 'MO',
        subtotalHt: 'Total HT',
        tvaTotal: 'TVA',
        totalTtc: 'Total TTC',
        margin: '',
        clientBudget: '',
        budgetVariance: '',
        observations: '',
        conditionsTitle: 'Conditions',
        conditions1: '',
        conditions2: '',
        signature: '',
        signatureClient: '',
        currencyNote: 'EUR',
      });
      success(t('common.exportPdf'));
    } catch (e) {
      error(e instanceof Error ? e.message : 'PDF');
    }
  };

  return (
    <div>
      <PageHeader title={t('saas.quotationsTitle')} subtitle={t('saas.quotationsSubtitle')} />
      {!isLiveDb && (
        <p className="text-xs text-amber-400 mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {t('saas.localDbMode')}
        </p>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        <Button onClick={() => setModal(true)}>
          <Plus className="w-4 h-4" />
          {t('saas.createQuotation')}
        </Button>
        <Button variant="ghost" onClick={() => void loadAlerts()}>
          {t('saas.detectExpensive')}
        </Button>
      </div>
      {alerts.length > 0 && (
        <Card className="mb-4 border-amber-500/30">
          <p className="text-sm text-amber-300 font-medium mb-2">{t('saas.expensiveAlerts')}</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {alerts.map((a) => (
              <li key={a.quotation.id}>
                {a.quotation.number} — +{a.percentAboveAvg}% vs moyenne — {a.cheaperAlternativeHint}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <DataTable
        data={quotations}
        columns={[
          { key: 'number', header: 'N°' },
          { key: 'client_name', header: t('devis.clientName') },
          {
            key: 'total_ttc',
            header: 'TTC',
            render: (q) => formatCurrency(Number(q.total_ttc)),
          },
          { key: 'status', header: t('common.status') },
          {
            key: 'id',
            header: t('common.actions'),
            render: (q) => (
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={() => void exportPdf(q)}>
                  <FileDown className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async () => {
                    await deleteQuotation(q.id);
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
      <Modal open={modal} onClose={() => setModal(false)} title={t('saas.createQuotation')}>
        <div className="space-y-3">
          <select className={inputClass} value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
            <option value="">{t('saas.noProject')}</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input className={inputClass} placeholder={t('devis.clientName')} value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} />
          <input className={inputClass} placeholder={t('devis.siteAddress')} value={form.siteAddress} onChange={(e) => setForm({ ...form, siteAddress: e.target.value })} />
          <input type="number" className={inputClass} value={form.subtotalHt} onChange={(e) => setForm({ ...form, subtotalHt: Number(e.target.value) })} />
          <Button className="w-full" onClick={() => void save()}>
            <FileSpreadsheet className="w-4 h-4" />
            {t('common.save')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
