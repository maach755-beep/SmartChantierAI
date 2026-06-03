import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, SlidersHorizontal, Plus, Pencil, Trash2, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { QuickNav } from '@/components/layout/QuickNav';
import { usePlatformData } from '@/hooks/usePlatformData';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { createTask, updateTask, deleteTask } from '@/services/saas/phase2Data';
import { formatCurrency, formatDate } from '@/utils/format';
import type { Task, TaskPriority, TaskStatus } from '@/types';
import {
  ALL_TASK_PRIORITIES,
  ALL_TASK_STATUSES,
  TASK_PRIORITY_I18N,
  TASK_PRIORITY_SORT_ORDER,
  TASK_PRIORITY_VARIANT,
  TASK_STATUS_I18N,
  TASK_STATUS_SORT_ORDER,
  TASK_STATUS_VARIANT,
} from '@/utils/taskLabels';

type SortKey = 'date' | 'priority' | 'status';

function normalizeSearch(q: string): string {
  return q.trim().toLowerCase();
}

function taskMatchesSearch(task: Task, q: string): boolean {
  if (!q) return true;
  const haystack = [
    task.title,
    task.chantierName,
    task.roomName,
    task.assignee,
    task.lot,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

const emptyTask = {
  title: '',
  chantierId: '',
  assignee: '',
  priority: 'medium' as TaskPriority,
  status: 'todo' as TaskStatus,
  dueDate: new Date().toISOString().slice(0, 10),
  estimatedCostHt: 0,
  lot: 'carrelage' as Task['lot'],
};

export function TasksPage() {
  const { t } = useTranslation();
  const { tasks, chantiers, team, refresh } = usePlatformData();
  const { success } = useToast();
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyTask);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlChantier = searchParams.get('chantier') ?? '';

  const [search, setSearch] = useState('');
  const chantierFilter = urlChantier;
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');

  const assignees = useMemo(() => {
    const set = new Set(tasks.map((tk) => tk.assignee));
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [tasks]);

  const syncChantierUrl = (id: string) => {
    if (id) setSearchParams({ chantier: id });
    else setSearchParams({});
  };

  const filtered = useMemo(() => {
    const q = normalizeSearch(search);
    let list = tasks.filter((tk) => {
      if (chantierFilter && tk.chantierId !== chantierFilter) return false;
      if (assigneeFilter && tk.assignee !== assigneeFilter) return false;
      if (statusFilter !== 'all' && tk.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && tk.priority !== priorityFilter) return false;
      if (!taskMatchesSearch(tk, q)) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sortBy === 'date') {
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'priority') {
        return TASK_PRIORITY_SORT_ORDER[a.priority] - TASK_PRIORITY_SORT_ORDER[b.priority];
      }
      return TASK_STATUS_SORT_ORDER[a.status] - TASK_STATUS_SORT_ORDER[b.status];
    });

    return list;
  }, [tasks, search, chantierFilter, assigneeFilter, statusFilter, priorityFilter, sortBy]);

  const statusCounts = useMemo(() => {
    const base = chantierFilter ? tasks.filter((tk) => tk.chantierId === chantierFilter) : tasks;
    return ALL_TASK_STATUSES.reduce(
      (acc, s) => {
        acc[s] = base.filter((tk) => tk.status === s).length;
        return acc;
      },
      {} as Record<TaskStatus, number>
    );
  }, [tasks, chantierFilter]);

  const selectClass =
    'w-full bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-btp-500';

  const openCreate = () => {
    setForm({ ...emptyTask, chantierId: chantierFilter || chantiers[0]?.id || '' });
    setEditId(null);
    setModal('create');
  };

  const openEdit = (tk: Task) => {
    setEditId(tk.id);
    setForm({
      title: tk.title,
      chantierId: tk.chantierId,
      assignee: tk.assignee,
      priority: tk.priority,
      status: tk.status,
      dueDate: tk.dueDate,
      estimatedCostHt: tk.estimatedCostHt,
      lot: tk.lot,
    });
    setModal('edit');
  };

  const save = async () => {
    const ch = chantiers.find((c) => c.id === form.chantierId);
    const payload = { ...form, chantierName: ch?.name };
    if (modal === 'create') await createTask(payload);
    else if (editId) await updateTask(editId, payload);
    success(t('notifications.saved'));
    setModal(null);
    await refresh();
  };

  const remove = async (id: string) => {
    await deleteTask(id);
    await refresh();
  };

  const complete = async (tk: Task) => {
    await updateTask(tk.id, { status: 'done' });
    await refresh();
  };

  return (
    <div>
      <PageHeader
        title={t('tasks.title')}
        subtitle={t('tasks.subtitleFrance')}
        actions={
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4" />
            {t('phase2.createTask')}
          </Button>
        }
      />
      <QuickNav
        links={[
          { to: '/projets', labelKey: 'nav.projects' },
          { to: '/equipe', labelKey: 'nav.team' },
          { to: '/planning', labelKey: 'nav.planning' },
          { to: '/analyse-ia', labelKey: 'nav.aiAnalysis' },
        ]}
      />

      <div className="relative mb-4">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('tasks.searchPlaceholder')}
          className="w-full ps-10 pe-4 py-2.5 rounded-xl bg-btp-900/60 border border-btp-600/30 text-white text-sm focus:outline-none focus:border-btp-500"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-4">
        {ALL_TASK_STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
            className={`p-2.5 sm:p-3 rounded-xl border text-start transition-colors min-w-0 ${
              statusFilter === s ? 'border-btp-500 bg-btp-800/60' : 'border-btp-700/40 bg-btp-900/40 hover:border-btp-600/50'
            }`}
          >
            <p className="text-[10px] sm:text-xs text-slate-500 truncate">{t(TASK_STATUS_I18N[s])}</p>
            <p className="text-lg sm:text-2xl font-bold text-white">{statusCounts[s]}</p>
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
        <SlidersHorizontal className="w-4 h-4 shrink-0" />
        <span>{t('tasks.filters')}</span>
        <span className="ms-auto text-slate-400">
          {t('tasks.resultsCount', { count: filtered.length, total: tasks.length })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-4">
        <label className="block">
          <span className="text-xs text-slate-500 mb-1 block">{t('common.chantier')}</span>
          <select
            value={chantierFilter}
            onChange={(e) => syncChantierUrl(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('tasks.allProjects')}</option>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 mb-1 block">{t('tasks.assignee')}</span>
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('tasks.allAssignees')}</option>
            {assignees.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 mb-1 block">{t('common.status')}</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className={selectClass}
          >
            <option value="all">{t('common.all')}</option>
            {ALL_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(TASK_STATUS_I18N[s])}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-slate-500 mb-1 block">{t('tasks.priority')}</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className={selectClass}
          >
            <option value="all">{t('common.all')}</option>
            {ALL_TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {t(TASK_PRIORITY_I18N[p])}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2 lg:col-span-1">
          <span className="text-xs text-slate-500 mb-1 block">{t('tasks.sortBy')}</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className={selectClass}
          >
            <option value="date">{t('tasks.sortDate')}</option>
            <option value="priority">{t('tasks.sortPriority')}</option>
            <option value="status">{t('tasks.sortStatus')}</option>
          </select>
        </label>
      </div>

      <div className="hidden md:block">
        <DataTable
          data={filtered}
          emptyMessage={t('tasks.noResults')}
          emptyTitle={t('tasks.noResultsTitle')}
          columns={[
            {
              key: 'title',
              header: t('tasks.name'),
              render: (tk) => <span className="font-medium text-white">{tk.title}</span>,
            },
            {
              key: 'chantier',
              header: t('common.chantier'),
              render: (tk) => (
                <Link to={`/suivi/${tk.chantierId}`} className="text-btp-300 hover:underline text-xs">
                  {tk.chantierName}
                </Link>
              ),
            },
            { key: 'roomName', header: t('tasks.room') },
            { key: 'assignee', header: t('tasks.assignee') },
            {
              key: 'priority',
              header: t('tasks.priority'),
              render: (tk) => (
                <Badge variant={TASK_PRIORITY_VARIANT[tk.priority]}>
                  {t(TASK_PRIORITY_I18N[tk.priority])}
                </Badge>
              ),
            },
            {
              key: 'status',
              header: t('common.status'),
              render: (tk) => (
                <Badge variant={TASK_STATUS_VARIANT[tk.status]}>{t(TASK_STATUS_I18N[tk.status])}</Badge>
              ),
            },
            {
              key: 'dueDate',
              header: t('tasks.dueDate'),
              render: (tk) => formatDate(tk.dueDate),
            },
            {
              key: 'cost',
              header: t('tasks.costHt'),
              render: (tk) => (
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatCurrency(tk.estimatedCostHt)} HT
                </span>
              ),
            },
            {
              key: 'id',
              header: t('common.actions'),
              render: (tk) => (
                <div className="flex gap-1">
                  {tk.status !== 'done' && (
                    <Button size="sm" variant="ghost" onClick={() => void complete(tk)}>
                      <CheckCircle2 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => openEdit(tk)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => void remove(tk.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </div>

      <ul className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <li className="text-center py-10 text-slate-500 text-sm">{t('tasks.noResults')}</li>
        ) : (
          filtered.map((tk) => (
            <li
              key={tk.id}
              className="rounded-xl border border-btp-600/25 bg-btp-900/50 p-4 space-y-2"
            >
              <p className="font-medium text-white">{tk.title}</p>
              <Link to={`/suivi/${tk.chantierId}`} className="text-xs text-btp-300 hover:underline">
                {tk.chantierName}
              </Link>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>{tk.roomName}</span>
                <span>·</span>
                <span>{tk.assignee}</span>
                <span>·</span>
                <span>{formatDate(tk.dueDate)}</span>
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <Badge variant={TASK_PRIORITY_VARIANT[tk.priority]}>
                    {t(TASK_PRIORITY_I18N[tk.priority])}
                  </Badge>
                  <Badge variant={TASK_STATUS_VARIANT[tk.status]}>{t(TASK_STATUS_I18N[tk.status])}</Badge>
                </div>
                <span className="text-xs text-slate-400">{formatCurrency(tk.estimatedCostHt)} HT</span>
              </div>
            </li>
          ))
        )}
      </ul>

      <Modal open={modal !== null} onClose={() => setModal(null)} title={modal === 'create' ? t('phase2.createTask') : t('phase2.editTask')}>
        <div className="space-y-3">
          <input className={selectClass} placeholder={t('tasks.name')} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <select className={selectClass} value={form.chantierId} onChange={(e) => setForm({ ...form, chantierId: e.target.value })}>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select className={selectClass} value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })}>
            <option value="">—</option>
            {team.map((m) => (
              <option key={m.id} value={m.name}>{m.name}</option>
            ))}
          </select>
          <input type="date" className={selectClass} value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <select className={selectClass} value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}>
            {ALL_TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{t(TASK_PRIORITY_I18N[p])}</option>
            ))}
          </select>
          <select className={selectClass} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}>
            {ALL_TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{t(TASK_STATUS_I18N[s])}</option>
            ))}
          </select>
          <Button className="w-full" onClick={() => void save()}>{t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
}
