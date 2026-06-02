import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { UploadZone } from '@/components/ui/UploadZone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { StatCard } from '@/components/ui/StatCard';
import { Users, UserX, Heart, Palmtree } from 'lucide-react';
import { runOcrAttendance } from '@/services/fakeAi';
import { useDemoData } from '@/hooks/useDemoData';

export function AttendancePage() {
  const { t } = useTranslation();
  const { attendance } = useDemoData();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState(attendance);

  const runOcr = async () => {
    setLoading(true);
    try {
      const data = await runOcrAttendance();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  const present = records.filter((r) => r.present).length;
  const absent = records.filter((r) => r.absent).length;
  const sick = records.filter((r) => r.sick).length;
  const leave = records.filter((r) => r.leave).length;

  return (
    <div>
      <PageHeader title={t('attendance.title')} />
      <PageQuickNav preset="core" extra={[{ to: '/equipe', labelKey: 'nav.team' }]} />

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <UploadZone hint={t('attendance.uploadSheet')} onFile={runOcr} />
          <Button className="mt-3 w-full" onClick={runOcr} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('attendance.ocrProcessing') : t('common.analyze')}
          </Button>
        </div>
        <div className="lg:col-span-2 grid grid-cols-2 gap-3">
          <StatCard title={t('attendance.totalPresent')} value={present} icon={Users} variant="success" />
          <StatCard title={t('attendance.totalAbsent')} value={absent} icon={UserX} variant="danger" />
          <StatCard title={t('attendance.sick')} value={sick} icon={Heart} variant="warning" />
          <StatCard title={t('attendance.leave')} value={leave} icon={Palmtree} />
          <StatCard title={t('attendance.availableWorkforce')} value={present} icon={Users} />
          <StatCard title={t('attendance.laborRisk')} value={absent > 8 ? 'Élevé' : 'Modéré'} icon={UserX} variant={absent > 8 ? 'danger' : 'warning'} />
        </div>
      </div>

      <Card>
        <DataTable
          data={records.slice(0, 30)}
          columns={[
            { key: 'workerName', header: t('attendance.worker') },
            { key: 'chantierName', header: t('common.chantier') },
            { key: 'date', header: t('common.date') },
            { key: 'present', header: t('attendance.presence'), render: (r) => (r.present ? '✓' : '—') },
            { key: 'absent', header: t('attendance.absence'), render: (r) => (r.absent ? '✓' : '—') },
            { key: 'hoursWorked', header: t('attendance.hoursWorked') },
          ]}
        />
      </Card>
    </div>
  );
}
