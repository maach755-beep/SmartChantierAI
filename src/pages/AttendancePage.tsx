import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, LogIn, LogOut, FileText } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { Users, UserX, Heart, Palmtree } from 'lucide-react';
import { usePlatformData } from '@/hooks/usePlatformData';
import { useToast } from '@/contexts/ToastContext';
import {
  employeeCheckIn,
  employeeCheckOut,
  getDailyAttendanceReport,
} from '@/services/saas/phase2Data';

const selectClass =
  'w-full bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-white min-h-[44px]';

export function AttendancePage() {
  const { t } = useTranslation();
  const { attendance, team, chantiers, refresh } = usePlatformData();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState(chantiers[0]?.id ?? '');
  const [report, setReport] = useState<Awaited<ReturnType<typeof getDailyAttendanceReport>> | null>(null);

  const loadReport = async () => {
    setLoading(true);
    try {
      setReport(await getDailyAttendanceReport());
      await refresh();
    } finally {
      setLoading(false);
    }
  };

  const checkIn = async () => {
    if (!employeeId || !projectId) return;
    setLoading(true);
    try {
      await employeeCheckIn(employeeId, projectId);
      success(t('phase2.checkInOk'));
      await loadReport();
    } catch (e) {
      error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const checkOut = async (attendanceId: string) => {
    setLoading(true);
    try {
      await employeeCheckOut(attendanceId);
      success(t('phase2.checkOutOk'));
      await loadReport();
    } catch (e) {
      error(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const records = report?.records ?? attendance;
  const present = report?.present ?? records.filter((r) => r.present).length;
  const absent = report?.absent ?? records.filter((r) => r.absent).length;
  const sick = report?.sick ?? records.filter((r) => r.sick).length;
  const leave = report?.leave ?? records.filter((r) => r.leave).length;

  return (
    <div>
      <PageHeader title={t('attendance.title')} />
      <PageQuickNav preset="core" extra={[{ to: '/equipe', labelKey: 'nav.team' }]} />

      <Card className="mb-6">
        <p className="text-sm text-slate-400 mb-3">{t('phase2.attendanceActions')}</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-3">
          <select className={selectClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">{t('attendance.worker')}</option>
            {team.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
          <select className={selectClass} value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            {chantiers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => void checkIn()} disabled={loading}>
              <LogIn className="w-4 h-4" />
              {t('phase2.checkIn')}
            </Button>
            <Button variant="ghost" onClick={() => void loadReport()} disabled={loading}>
              <FileText className="w-4 h-4" />
              {t('phase2.dailyReport')}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard title={t('attendance.totalPresent')} value={present} icon={Users} variant="success" />
        <StatCard title={t('attendance.totalAbsent')} value={absent} icon={UserX} variant="danger" />
        <StatCard title={t('attendance.sick')} value={sick} icon={Heart} variant="warning" />
        <StatCard title={t('attendance.leave')} value={leave} icon={Palmtree} />
      </div>

      <Card>
        <DataTable
          data={records.slice(0, 50)}
          columns={[
            { key: 'workerName', header: t('attendance.worker') },
            { key: 'chantierName', header: t('common.chantier') },
            { key: 'date', header: t('common.date') },
            { key: 'hoursWorked', header: t('attendance.hoursWorked') },
            {
              key: 'id',
              header: t('phase2.checkOut'),
              render: (r) =>
                r.present && r.hoursWorked < 0.5 ? (
                  <Button size="sm" variant="ghost" onClick={() => void checkOut(r.id)}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                ) : (
                  '—'
                ),
            },
          ]}
        />
        {loading && (
          <p className="text-center text-slate-500 text-sm py-4 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </p>
        )}
      </Card>
    </div>
  );
}
