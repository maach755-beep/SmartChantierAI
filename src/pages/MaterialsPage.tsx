import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Package, ClipboardList, Bell } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { QuickNav } from '@/components/layout/QuickNav';
import { usePlatformData } from '@/hooks/usePlatformData';
import type { MaterialStockStatus } from '@/types';

const statusVariant: Record<MaterialStockStatus, 'green' | 'orange' | 'red' | 'blue'> = {
  ok: 'green',
  low: 'orange',
  critical: 'red',
  ordered: 'blue',
};

type MatTab = 'inventory' | 'missing' | 'requests' | 'alerts';

export function MaterialsPage() {
  const { t } = useTranslation();
  const { materials, materialRequests, chantiers } = usePlatformData();
  const [searchParams, setSearchParams] = useSearchParams();
  const chantierFilter = searchParams.get('chantier') ?? '';
  const [tab, setTab] = useState<MatTab>('inventory');

  const missing = useMemo(
    () => materials.filter((m) => m.quantityOnSite < m.quantityRequired * 0.5 || m.status === 'critical'),
    [materials]
  );
  const alerts = useMemo(
    () => materials.filter((m) => m.status === 'critical' || m.status === 'low'),
    [materials]
  );

  const inventoryFiltered = useMemo(
    () =>
      materials.filter((m) => {
        if (chantierFilter && m.chantierId !== chantierFilter) return false;
        return true;
      }),
    [materials, chantierFilter]
  );

  const critical = materials.filter((m) => m.status === 'critical').length;
  const low = materials.filter((m) => m.status === 'low').length;
  const pendingReq = materialRequests.filter((r) => r.status === 'pending').length;

  const tabs: { id: MatTab; label: string }[] = [
    { id: 'inventory', label: t('materials.tabInventory') },
    { id: 'missing', label: t('materials.tabMissing') },
    { id: 'requests', label: t('materials.tabRequests') },
    { id: 'alerts', label: t('materials.tabAlerts') },
  ];

  return (
    <div>
      <PageHeader title={t('materials.title')} subtitle={t('materials.subtitle')} />
      <QuickNav
        links={[
          { to: '/projets', labelKey: 'nav.projects' },
          { to: '/fournisseurs', labelKey: 'nav.suppliers' },
          { to: '/documents', labelKey: 'nav.documents' },
          { to: '/rapports', labelKey: 'nav.reports' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card className="border-red-500/30">
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {t('materials.critical')}
          </p>
          <p className="text-2xl font-bold text-red-400">{critical}</p>
        </Card>
        <Card className="border-amber-500/30">
          <p className="text-xs text-amber-400">{t('materials.low')}</p>
          <p className="text-2xl font-bold text-amber-400">{low}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            {t('materials.pendingRequests')}
          </p>
          <p className="text-2xl font-bold text-cyan-400">{pendingReq}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Package className="w-3 h-3" />
            {t('materials.total')}
          </p>
          <p className="text-2xl font-bold">{materials.length}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${tab === id ? 'bg-btp-600 text-white' : 'bg-btp-800/50 text-slate-400'}`}
          >
            {id === 'alerts' && <Bell className="w-4 h-4" />}
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={chantierFilter}
          onChange={(e) => {
            if (e.target.value) setSearchParams({ chantier: e.target.value });
            else setSearchParams({});
          }}
          className="bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm max-w-xs"
        >
          <option value="">{t('tasks.allProjects')}</option>
          {chantiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {tab === 'inventory' && (
        <DataTable
          data={inventoryFiltered}
          columns={[
            { key: 'name', header: t('materials.name') },
            { key: 'category', header: t('materials.category') },
            {
              key: 'chantier',
              header: t('common.chantier'),
              render: (m) => (
                <Link to={`/suivi/${m.chantierId}`} className="text-btp-300 hover:underline text-xs">
                  {m.chantierName}
                </Link>
              ),
            },
            {
              key: 'required',
              header: t('materials.required'),
              render: (m) => `${m.quantityRequired} ${m.unit}`,
            },
            {
              key: 'onSite',
              header: t('materials.onSite'),
              render: (m) => `${m.quantityOnSite} ${m.unit}`,
            },
            { key: 'supplierName', header: t('nav.suppliers') },
            {
              key: 'status',
              header: t('common.status'),
              render: (m) => <Badge variant={statusVariant[m.status]}>{m.status}</Badge>,
            },
          ]}
        />
      )}

      {tab === 'missing' && (
        <DataTable
          data={missing}
          columns={[
            { key: 'name', header: t('materials.name') },
            { key: 'chantierName', header: t('common.chantier') },
            {
              key: 'gap',
              header: t('materials.gap'),
              render: (m) => `${m.quantityRequired - m.quantityOnSite} ${m.unit}`,
            },
            {
              key: 'status',
              header: t('common.status'),
              render: (m) => <Badge variant={statusVariant[m.status]}>{m.status}</Badge>,
            },
          ]}
        />
      )}

      {tab === 'requests' && (
        <DataTable
          data={materialRequests}
          columns={[
            { key: 'materialName', header: t('materials.name') },
            { key: 'chantierName', header: t('common.chantier') },
            {
              key: 'qty',
              header: t('materials.quantity'),
              render: (r) => `${r.quantity} ${r.unit}`,
            },
            { key: 'requestedBy', header: t('materials.requestedBy') },
            { key: 'date', header: t('common.date') },
            {
              key: 'urgency',
              header: t('materials.urgency'),
              render: (r) => <Badge variant={r.urgency === 'urgent' ? 'red' : 'gray'}>{r.urgency}</Badge>,
            },
            {
              key: 'status',
              header: t('common.status'),
              render: (r) => <Badge variant={r.status === 'pending' ? 'orange' : 'green'}>{r.status}</Badge>,
            },
          ]}
        />
      )}

      {tab === 'alerts' && (
        <DataTable
          data={alerts}
          columns={[
            { key: 'name', header: t('materials.name') },
            { key: 'chantierName', header: t('common.chantier') },
            {
              key: 'onSite',
              header: t('materials.onSite'),
              render: (m) => `${m.quantityOnSite} / ${m.quantityRequired} ${m.unit}`,
            },
            {
              key: 'status',
              header: t('materials.stockAlert'),
              render: (m) => <Badge variant={statusVariant[m.status]}>{m.status}</Badge>,
            },
          ]}
        />
      )}
    </div>
  );
}
