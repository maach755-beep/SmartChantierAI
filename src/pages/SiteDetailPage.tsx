import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { QuickNav } from '@/components/layout/QuickNav';
import { projectFilterLink } from '@/config/pageLinks';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';
import { computeChantierHealth } from '@/utils/healthScore';
import { formatCurrency, formatDate, formatPercent } from '@/utils/format';
import { TASK_STATUS_I18N, TASK_STATUS_VARIANT } from '@/utils/taskLabels';
import type { TaskStatus } from '@/types';

export function SiteDetailPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { chantiers, rooms, tasks, risks } = useDemoData();
  const chantier = chantiers.find((c) => c.id === id);
  const siteRooms = rooms.filter((r) => r.chantierId === id);
  const siteTasks = tasks.filter((tk) => tk.chantierId === id);
  const siteRisks = risks.filter((r) => r.chantierId === id);

  if (!chantier) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <p className="text-lg font-medium text-white">{t('sites.notFound')}</p>
        <p className="text-sm text-slate-500 mt-2">{t('sites.notFoundHint')}</p>
        <Link to="/suivi" className="inline-flex items-center gap-2 text-sm text-btp-300 mt-6 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Link>
      </div>
    );
  }

  const health = computeChantierHealth(chantier, siteRisks);

  return (
    <div>
      <Link to="/suivi" className="inline-flex items-center gap-2 text-sm text-btp-300 mb-4 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        {t('common.back')}
      </Link>
      <PageHeader title={chantier.name} subtitle={chantier.address} />
      {id && (
        <QuickNav
          links={[
            { to: '/projets', labelKey: 'nav.projects' },
            { to: projectFilterLink(id, 'taches'), labelKey: 'nav.tasks' },
            { to: projectFilterLink(id, 'materiaux'), labelKey: 'nav.materials' },
            { to: projectFilterLink(id, 'photos'), labelKey: 'nav.photos' },
            { to: '/rapports', labelKey: 'nav.reports' },
          ]}
        />
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <p className="text-xs text-slate-500">{t('common.client')}</p>
          <p className="font-medium">{chantier.client}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">{t('common.manager')}</p>
          <p className="font-medium">{chantier.manager}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">{t('common.progress')}</p>
          <p className="font-medium text-btp-300">{formatPercent(chantier.progress)}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">{t('site.delay')}</p>
          <p className="font-medium text-amber-400">
            {chantier.delayDays} {t('common.days')}
          </p>
        </Card>
        <Card className="md:col-span-2">
          <p className="text-xs text-slate-500">{t('common.budget')}</p>
          <p className="font-medium">
            {formatCurrency(chantier.budgetConsumed)} / {formatCurrency(chantier.budgetPlanned)}
          </p>
        </Card>
        <Card className="md:col-span-2 border-cyan-500/30">
          <p className="text-xs text-slate-500">{t('risks.healthSheet')}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-2xl font-bold">{health.score}/100</span>
            <Badge variant={health.level === 'red' ? 'red' : health.level === 'orange' ? 'orange' : 'green'}>
              {health.label}
            </Badge>
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card title={t('site.rooms')}>
          <div className="space-y-4">
            {siteRooms.map((room) => (
              <div key={room.id} className="p-3 rounded-lg bg-btp-900/40 border border-btp-600/20">
                <h4 className="font-medium text-white">{room.name}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {t('site.materials')}: {room.materials.join(', ')}
                </p>
                <p className="text-xs text-slate-500">
                  {t('site.tasks')}: {siteTasks.filter((tk) => tk.roomId === room.id).length}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('site.timeline')}>
          <div className="relative border-s-2 border-btp-600/40 ps-4 space-y-4">
            <div className="relative">
              <span className="absolute -start-[21px] w-3 h-3 rounded-full bg-btp-500" />
              <p className="text-sm font-medium">{formatDate(chantier.startDate)}</p>
              <p className="text-xs text-slate-500">{t('site.startDate')}</p>
            </div>
            {siteTasks.slice(0, 6).map((tk) => (
              <div key={tk.id} className="relative">
                <span className="absolute -start-[21px] w-3 h-3 rounded-full bg-cyan-500" />
                <p className="text-sm">{tk.title}</p>
                <Badge variant={TASK_STATUS_VARIANT[tk.status as TaskStatus]}>
                  {t(TASK_STATUS_I18N[tk.status as TaskStatus])}
                </Badge>
              </div>
            ))}
            <div className="relative">
              <span className="absolute -start-[21px] w-3 h-3 rounded-full bg-green-500" />
              <p className="text-sm font-medium">{formatDate(chantier.endDate)}</p>
              <p className="text-xs text-slate-500">{t('site.endDate')}</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
