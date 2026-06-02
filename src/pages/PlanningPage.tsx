import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';
import { formatDate } from '@/utils/format';

export function PlanningPage() {
  const { t } = useTranslation();
  const { planning } = useDemoData();

  const maxEnd = Math.max(...planning.map((p) => new Date(p.end).getTime()));
  const minStart = Math.min(...planning.map((p) => new Date(p.start).getTime()));
  const range = maxEnd - minStart || 1;

  return (
    <div>
      <PageHeader title={t('planning.title')} />
      <PageQuickNav preset="core" extra={[{ to: '/taches', labelKey: 'nav.tasks' }]} />

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <Card className="border-amber-500/30">
          <p className="text-sm font-medium text-amber-400">{t('planning.conflicts')}</p>
          <p className="text-2xl font-bold mt-1">3</p>
        </Card>
        <Card className="border-red-500/30">
          <p className="text-sm font-medium text-red-400">{t('planning.delays')}</p>
          <p className="text-2xl font-bold mt-1">5</p>
        </Card>
        <Card className="border-orange-500/30">
          <p className="text-sm font-medium text-orange-400">{t('planning.workload')}</p>
          <p className="text-2xl font-bold mt-1">2 équipes</p>
        </Card>
      </div>

      <Card title={t('planning.gantt')}>
        <div className="space-y-3 overflow-x-auto">
          {planning.slice(0, 12).map((task) => {
            const start = new Date(task.start).getTime();
            const end = new Date(task.end).getTime();
            const left = ((start - minStart) / range) * 100;
            const width = Math.max(((end - start) / range) * 100, 5);
            return (
              <div key={task.id} className="flex items-center gap-3 min-w-[600px]">
                <span className="w-48 text-xs text-slate-400 truncate">{task.title}</span>
                <div className="flex-1 h-6 bg-btp-900/60 rounded relative">
                  <div
                    className="absolute h-full rounded bg-gradient-to-r from-btp-600 to-cyan-600 flex items-center justify-end pe-2"
                    style={{ left: `${left}%`, width: `${width}%` }}
                  >
                    <span className="text-[10px] text-white">{task.progress}%</span>
                  </div>
                </div>
                <Badge variant="blue">{task.team}</Badge>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          IA : conflit détecté entre Équipe 1 et Équipe 2 sur {formatDate(planning[0]?.start ?? '')}
        </p>
      </Card>
    </div>
  );
}
