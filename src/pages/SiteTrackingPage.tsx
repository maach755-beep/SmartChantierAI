import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Clock, AlertTriangle, HardHat } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePlatformData } from '@/hooks/usePlatformData';
import { createProject } from '@/services/saas/platform';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { Chantier, ProjectStatus, TimelineEvent } from '@/types';

const emptyForm = {
  name: '',
  client: '',
  address: '',
  manager: '',
  progress: 0,
  budgetPlanned: 500000,
  delayDays: 0,
};

type SiteTab = 'all' | 'active' | 'delayed' | 'at_risk';

export function SiteTrackingPage() {
  const { t } = useTranslation();
  const { chantiers, tasks, photos, refresh } = usePlatformData();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState<SiteTab>('all');
  const [timelineChantier, setTimelineChantier] = useState('');

  const filtered = useMemo(() => {
    if (tab === 'all') return chantiers;
    if (tab === 'active') return chantiers.filter((c) => c.status === 'active');
    if (tab === 'delayed') return chantiers.filter((c) => c.status === 'delayed');
    return chantiers.filter((c) => c.status === 'at_risk');
  }, [chantiers, tab]);

  const timelineEvents = useMemo((): TimelineEvent[] => {
    const id = timelineChantier || chantiers[0]?.id;
    if (!id) return [];
    const fromTasks: TimelineEvent[] = tasks
      .filter((t) => t.chantierId === id)
      .map((t) => ({
        id: t.id,
        chantierId: t.chantierId,
        date: t.dueDate,
        title: t.title,
        type: 'task' as const,
        status: t.status === 'done' || t.status === 'validated' ? 'done' : t.dueDate < new Date().toISOString().slice(0, 10) ? 'late' : 'pending',
      }));
    const fromPhotos: TimelineEvent[] = photos
      .filter((p) => p.chantierId === id)
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        chantierId: p.chantierId,
        date: p.date.slice(0, 10),
        title: p.caption ?? 'Photo chantier',
        type: 'inspection' as const,
        status: 'done' as const,
      }));
    return [...fromTasks, ...fromPhotos].sort((a, b) => b.date.localeCompare(a.date));
  }, [tasks, photos, timelineChantier, chantiers]);

  const saveChantier = async () => {
    await createProject({
      name: form.name || 'Nouveau chantier',
      client: form.client,
      address: form.address,
      manager: form.manager,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      budgetPlanned: form.budgetPlanned,
      budgetConsumed: Math.round(form.budgetPlanned * (form.progress / 100) * 0.7),
      progress: form.progress,
      delayDays: form.delayDays,
      riskLevel: form.delayDays > 7 ? 'red' : form.delayDays > 3 ? 'orange' : 'green',
      status: (form.delayDays > 5 ? 'delayed' : 'active') as ProjectStatus,
    });
    await refresh();
    setShowForm(false);
    setForm(emptyForm);
  };

  const riskVariant = (c: Chantier) =>
    c.riskLevel === 'red' ? 'red' : c.riskLevel === 'orange' ? 'orange' : 'green';

  const tabs: { id: SiteTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'all', label: t('common.all'), icon: HardHat },
    { id: 'active', label: t('sites.active'), icon: HardHat },
    { id: 'delayed', label: t('sites.delayed'), icon: Clock },
    { id: 'at_risk', label: t('sites.atRisk'), icon: AlertTriangle },
  ];

  return (
    <div>
      <PageHeader
        title={t('site.title')}
        subtitle={t('sites.subtitle')}
        actions={
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            {t('site.newSite')}
          </Button>
        }
      />
      <PageQuickNav preset="core" extra={[{ to: '/documents', labelKey: 'nav.documents' }, { to: '/analyse-ia', labelKey: 'nav.aiAnalysis' }]} />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${tab === id ? 'bg-btp-600 text-white' : 'bg-btp-800/50 text-slate-400'}`}
          >
            <Icon className="w-4 h-4" />
            {label}
            <span className="text-xs opacity-70">
              ({id === 'all' ? chantiers.length : chantiers.filter((c) => c.status === id).length})
            </span>
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="mb-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {(
              [
                ['name', t('site.name')],
                ['client', t('common.client')],
                ['address', t('site.address')],
                ['manager', t('common.manager')],
              ] as const
            ).map(([key, label]) => (
              <div key={key}>
                <label className="text-xs text-slate-500">{label}</label>
                <input
                  className="w-full mt-1 px-3 py-2 rounded-lg bg-btp-900/60 border border-btp-600/30 text-sm"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500">{t('common.progress')} %</label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-btp-900/60 border border-btp-600/30 text-sm"
                value={form.progress}
                onChange={(e) => setForm({ ...form, progress: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t('common.budget')}</label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-btp-900/60 border border-btp-600/30 text-sm"
                value={form.budgetPlanned}
                onChange={(e) => setForm({ ...form, budgetPlanned: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-xs text-slate-500">{t('site.delay')}</label>
              <input
                type="number"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-btp-900/60 border border-btp-600/30 text-sm"
                value={form.delayDays}
                onChange={(e) => setForm({ ...form, delayDays: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={saveChantier}>{t('common.save')}</Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              {t('common.cancel')}
            </Button>
          </div>
        </Card>
      )}

      <DataTable
        data={filtered}
        emptyMessage={t('common.noData')}
        columns={[
          {
            key: 'name',
            header: t('site.name'),
            render: (c) => (
              <Link to={`/suivi/${c.id}`} className="text-btp-300 hover:underline font-medium">
                {c.name}
              </Link>
            ),
          },
          { key: 'client', header: t('common.client') },
          { key: 'address', header: t('site.address') },
          { key: 'manager', header: t('common.manager') },
          {
            key: 'progress',
            header: t('common.progress'),
            render: (c) => (
              <div className="flex items-center gap-2 min-w-[100px]">
                <div className="flex-1 h-1.5 bg-btp-800 rounded-full overflow-hidden">
                  <div className="h-full bg-btp-500" style={{ width: `${c.progress}%` }} />
                </div>
                <span className="text-xs">{formatPercent(c.progress)}</span>
              </div>
            ),
          },
          {
            key: 'budget',
            header: t('common.budget'),
            render: (c) => (
              <span className="text-xs">
                {formatCurrency(c.budgetConsumed)} / {formatCurrency(c.budgetPlanned)}
              </span>
            ),
          },
          {
            key: 'delay',
            header: t('site.delay'),
            render: (c) => (
              <Badge variant={c.delayDays > 7 ? 'red' : c.delayDays > 0 ? 'orange' : 'green'}>
                {c.delayDays} j
              </Badge>
            ),
          },
          {
            key: 'risk',
            header: t('common.status'),
            render: (c) => <Badge variant={riskVariant(c)}>{t(`projects.status.${c.status}`)}</Badge>,
          },
        ]}
      />

      <Card className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-white">{t('site.timeline')}</h3>
          <select
            value={timelineChantier || chantiers[0]?.id || ''}
            onChange={(e) => setTimelineChantier(e.target.value)}
            className="rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm max-w-xs"
          >
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <ol className="relative border-s border-btp-600/40 ms-3 space-y-6">
          {timelineEvents.map((ev) => (
            <li key={ev.id} className="ms-6">
              <span
                className={`absolute -start-1.5 flex h-3 w-3 rounded-full ${
                  ev.status === 'done' ? 'bg-emerald-500' : ev.status === 'late' ? 'bg-red-500' : 'bg-amber-500'
                }`}
              />
              <p className="text-sm font-medium text-white">{ev.title}</p>
              <p className="text-xs text-slate-500">{ev.date} · {ev.type}</p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
