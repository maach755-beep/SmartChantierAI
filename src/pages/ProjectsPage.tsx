import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2, ListTodo, Package, Camera, FileText, Plus, Pencil, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { QuickNav } from '@/components/layout/QuickNav';
import { projectFilterLink } from '@/config/pageLinks';
import { useDemoData } from '@/hooks/useDemoData';
import { dataStore } from '@/services/dataStore';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { Chantier, ProjectStatus, RiskLevel } from '@/types';

const emptyForm = {
  name: '',
  client: '',
  address: '',
  manager: '',
  engineer: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
  budgetPlanned: 1_000_000,
  budgetConsumed: 0,
  progress: 0,
  delayDays: 0,
  status: 'active' as ProjectStatus,
  riskLevel: 'green' as RiskLevel,
};

export function ProjectsPage() {
  const { t } = useTranslation();
  const { chantiers, refresh } = useDemoData();
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const selected = chantiers.find((c) => c.id === selectedId);

  const openCreate = () => {
    setForm(emptyForm);
    setSelectedId(null);
    setModal('create');
  };

  const openEdit = (p: Chantier) => {
    setSelectedId(p.id);
    setForm({
      name: p.name,
      client: p.client,
      address: p.address,
      manager: p.manager,
      engineer: p.engineer ?? '',
      startDate: p.startDate,
      endDate: p.endDate,
      budgetPlanned: p.budgetPlanned,
      budgetConsumed: p.budgetConsumed,
      progress: p.progress,
      delayDays: p.delayDays,
      status: p.status,
      riskLevel: p.riskLevel,
    });
    setModal('edit');
  };

  const openDelete = (id: string) => {
    setSelectedId(id);
    setModal('delete');
  };

  const saveCreate = () => {
    dataStore.createProject({
      ...form,
      budgetConsumed: Math.round(form.budgetPlanned * (form.progress / 100) * 0.6),
    });
    refresh();
    setModal(null);
  };

  const saveEdit = () => {
    if (!selectedId) return;
    dataStore.updateProject(selectedId, {
      ...form,
      budgetConsumed: form.budgetConsumed || Math.round(form.budgetPlanned * (form.progress / 100) * 0.7),
    });
    refresh();
    setModal(null);
  };

  const confirmDelete = () => {
    if (selectedId) dataStore.deleteProject(selectedId);
    refresh();
    setModal(null);
  };

  const statusLabel = (s: ProjectStatus) => t(`projects.status.${s}`);

  return (
    <div>
      <PageHeader
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" /> {t('projects.create')}
          </Button>
        }
      />
      <QuickNav
        links={[
          { to: '/suivi', labelKey: 'nav.siteTracking' },
          { to: '/documents', labelKey: 'nav.documents' },
          { to: '/taches', labelKey: 'nav.tasks' },
          { to: '/rapports', labelKey: 'nav.reports' },
        ]}
      />

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {chantiers.map((p) => (
          <Card key={p.id} className="hover:border-btp-500/50 transition-colors">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 rounded-lg bg-btp-600/30 shrink-0">
                  <Building2 className="w-5 h-5 text-btp-300" />
                </div>
                <div className="min-w-0">
                  <Link to={`/suivi/${p.id}`} className="font-semibold text-white hover:text-btp-300 truncate block">
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500 truncate">{p.client}</p>
                </div>
              </div>
              <Badge variant={p.riskLevel === 'red' ? 'red' : p.riskLevel === 'orange' ? 'orange' : 'green'}>
                {statusLabel(p.status)}
              </Badge>
            </div>

            <p className="text-xs text-slate-400 mb-3 truncate">{p.address}</p>

            <div className="h-2 bg-btp-800 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-gradient-to-r from-btp-600 to-cyan-500" style={{ width: `${p.progress}%` }} />
            </div>
            <p className="text-xs text-slate-500 mb-3">{formatPercent(p.progress)}</p>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
              <span>{t('projects.delay')}: {p.delayDays}j</span>
              <span>{p.manager}</span>
              <span className="col-span-2">{formatCurrency(p.budgetConsumed)} / {formatCurrency(p.budgetPlanned)}</span>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-btp-600/20 pt-3 mb-2">
              <Link to={projectFilterLink(p.id, 'taches')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                <ListTodo className="w-3 h-3" /> {t('nav.tasks')}
              </Link>
              <Link to={projectFilterLink(p.id, 'materiaux')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                <Package className="w-3 h-3" /> {t('nav.materials')}
              </Link>
              <Link to={projectFilterLink(p.id, 'photos')} className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                <Camera className="w-3 h-3" /> {t('nav.photos')}
              </Link>
              <Link to="/rapports" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
                <FileText className="w-3 h-3" /> {t('nav.reports')}
              </Link>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                <Pencil className="w-3 h-3" /> {t('common.edit')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openDelete(p.id)}>
                <Trash2 className="w-3 h-3 text-red-400" /> {t('common.delete')}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={modal === 'create' || modal === 'edit'} onClose={() => setModal(null)} title={modal === 'create' ? t('projects.create') : t('projects.edit')} wide>
        <ProjectForm form={form} setForm={setForm} t={t} />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
          <Button onClick={modal === 'create' ? saveCreate : saveEdit}>{t('common.save')}</Button>
        </div>
      </Modal>

      <Modal open={modal === 'delete'} onClose={() => setModal(null)} title={t('projects.deleteConfirm')}>
        <p className="text-slate-400 text-sm mb-4">{selected?.name}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModal(null)}>{t('common.cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete}>{t('common.delete')}</Button>
        </div>
      </Modal>
    </div>
  );
}

function ProjectForm({
  form,
  setForm,
  t,
}: {
  form: typeof emptyForm;
  setForm: (f: typeof emptyForm) => void;
  t: (k: string) => string;
}) {
  const field = (label: string, key: keyof typeof emptyForm, type = 'text') => (
    <label className="block text-sm mb-3">
      <span className="text-slate-400">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
        value={String(form[key])}
        onChange={(e) =>
          setForm({
            ...form,
            [key]: type === 'number' ? Number(e.target.value) : e.target.value,
          })
        }
      />
    </label>
  );

  return (
    <div className="grid sm:grid-cols-2 gap-x-4">
      {field(t('projects.name'), 'name')}
      {field(t('common.client'), 'client')}
      {field(t('site.address'), 'address')}
      {field(t('common.manager'), 'manager')}
      {field(t('projects.engineer'), 'engineer')}
      {field(t('site.startDate'), 'startDate', 'date')}
      {field(t('site.endDate'), 'endDate', 'date')}
      {field(t('site.budgetPlanned'), 'budgetPlanned', 'number')}
      {field(t('common.progress') + ' %', 'progress', 'number')}
      {field(t('projects.delay'), 'delayDays', 'number')}
      <label className="block text-sm mb-3">
        <span className="text-slate-400">{t('common.status')}</span>
        <select
          className="mt-1 w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
        >
          {(['active', 'delayed', 'at_risk', 'completed'] as ProjectStatus[]).map((s) => (
            <option key={s} value={s}>{t(`projects.status.${s}`)}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm mb-3">
        <span className="text-slate-400">{t('projects.risk')}</span>
        <select
          className="mt-1 w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
          value={form.riskLevel}
          onChange={(e) => setForm({ ...form, riskLevel: e.target.value as RiskLevel })}
        >
          <option value="green">{t('risks.scoreGreen')}</option>
          <option value="orange">{t('risks.scoreOrange')}</option>
          <option value="red">{t('risks.scoreRed')}</option>
        </select>
      </label>
    </div>
  );
}
