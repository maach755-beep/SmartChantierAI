import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlatformData } from '@/hooks/usePlatformData';
import { computeDelayDetectionFromData } from '@/services/delayDetection/engine';
import type { DelayStatus } from '@/types/delayDetection';

const STATUS_STYLE: Record<DelayStatus, string> = {
  green: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  orange: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  red: 'bg-red-500/20 text-red-300 border-red-500/40',
};

export function DelayDetectionPage() {
  const { t } = useTranslation();
  const { chantiers, tasks, materials } = usePlatformData();
  const results = useMemo(
    () => computeDelayDetectionFromData(chantiers, tasks, materials),
    [chantiers, tasks, materials]
  );

  return (
    <div>
      <PageHeader title={t('delay.title')} subtitle={t('delay.subtitle')} />
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {results.map((r) => (
          <Card key={r.chantierId}>
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="font-semibold text-white text-sm">{r.chantierName}</h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>
                {t(`delay.status_${r.status}`)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <p className="text-slate-500 text-xs">{t('delay.percent')}</p>
                <p className="text-white font-medium">{r.delayPercent}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">{t('delay.days')}</p>
                <p className="text-white font-medium">{r.delayDays} j</p>
              </div>
            </div>
            <Badge variant={r.status === 'red' ? 'red' : r.status === 'orange' ? 'orange' : 'green'}>
              <AlertTriangle className="w-3 h-3 inline me-1" />
              {t(`delay.status_${r.status}`)}
            </Badge>
            <p className="text-xs text-slate-500 mt-3 font-medium">{t('delay.causes')}</p>
            <ul className="text-xs text-slate-400 mt-1 list-disc list-inside">
              {r.causes.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
            <p className="text-xs text-slate-500 mt-3 font-medium">{t('delay.recovery')}</p>
            <ul className="text-xs text-cyan-400/90 mt-1 list-disc list-inside">
              {r.recoveryActions.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
