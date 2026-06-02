import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Phone, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { QuickNav } from '@/components/layout/QuickNav';
import { useDemoData } from '@/hooks/useDemoData';
import type { TeamRoleType } from '@/types';

export function TeamPage() {
  const { t } = useTranslation();
  const { team, chantiers, attendance } = useDemoData();
  const [teamFilter, setTeamFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState<TeamRoleType | 'all'>('all');

  const teams = useMemo(() => [...new Set(team.map((m) => m.team))], [team]);

  const filtered = team.filter((m) => {
    if (teamFilter !== 'all' && m.team !== teamFilter) return false;
    if (roleFilter !== 'all' && m.roleType !== roleFilter) return false;
    return true;
  });

  const workers = team.filter((m) => m.roleType === 'worker').length;
  const managers = team.filter((m) => m.roleType === 'site_manager').length;
  const engineers = team.filter((m) => m.roleType === 'engineer').length;
  const presentToday = attendance.filter((a) => a.present).length;
  const active = team.filter((m) => m.active).length;

  const roleTabs: { id: TeamRoleType | 'all'; label: string }[] = [
    { id: 'all', label: t('common.all') },
    { id: 'worker', label: t('team.workers') },
    { id: 'site_manager', label: t('team.siteManagers') },
    { id: 'engineer', label: t('team.engineers') },
  ];

  return (
    <div>
      <PageHeader title={t('team.title')} subtitle={t('team.subtitle')} />
      <QuickNav
        links={[
          { to: '/projets', labelKey: 'nav.projects' },
          { to: '/pointage', labelKey: 'nav.attendance' },
          { to: '/terrain', labelKey: 'nav.fieldToOffice' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card>
          <p className="text-xs text-slate-500">{t('team.total')}</p>
          <p className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-btp-400" />
            {team.length}
          </p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">{t('team.workers')}</p>
          <p className="text-2xl font-bold">{workers}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">{t('team.siteManagers')}</p>
          <p className="text-2xl font-bold text-cyan-400">{managers}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500">{t('team.engineers')}</p>
          <p className="text-2xl font-bold text-violet-400">{engineers}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <ClipboardList className="w-3 h-3" />
            {t('team.attendanceToday')}
          </p>
          <p className="text-2xl font-bold text-green-400">{presentToday}</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {roleTabs.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRoleFilter(r.id)}
            className={`px-3 py-1.5 rounded-lg text-xs ${roleFilter === r.id ? 'bg-cyan-600/80 text-white' : 'bg-btp-800/50 text-slate-400'}`}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setTeamFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs ${teamFilter === 'all' ? 'bg-btp-600 text-white' : 'bg-btp-800/50 text-slate-400'}`}
        >
          {t('common.all')} ({active} {t('team.active')})
        </button>
        {teams.map((tm) => (
          <button
            key={tm}
            type="button"
            onClick={() => setTeamFilter(tm)}
            className={`px-3 py-1.5 rounded-lg text-xs ${teamFilter === tm ? 'bg-btp-600 text-white' : 'bg-btp-800/50 text-slate-400'}`}
          >
            {tm}
          </button>
        ))}
      </div>

      <DataTable
        data={filtered}
        columns={[
          { key: 'name', header: t('team.member') },
          { key: 'trade', header: t('team.trade') },
          { key: 'role', header: t('team.role') },
          {
            key: 'roleType',
            header: t('team.roleType'),
            render: (m) => <Badge variant="blue">{t(`team.roleTypes.${m.roleType}`)}</Badge>,
          },
          { key: 'team', header: t('team.teamName') },
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
            key: 'phone',
            header: t('team.phone'),
            render: (m) => (
              <span className="flex items-center gap-1 text-xs">
                <Phone className="w-3 h-3" />
                {m.phone}
              </span>
            ),
          },
          {
            key: 'hours',
            header: t('team.hours'),
            render: (m) => `${m.hoursThisWeek}h`,
          },
          {
            key: 'active',
            header: t('common.status'),
            render: (m) => (
              <Badge variant={m.active ? 'green' : 'gray'}>
                {m.active ? t('team.active') : t('team.inactive')}
              </Badge>
            ),
          },
        ]}
      />
      <p className="text-xs text-slate-500 mt-4">{chantiers.length} {t('team.sites')}</p>
    </div>
  );
}
