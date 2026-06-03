import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Brain, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { SiteManagerInsight } from '@/services/saas/types';

export function SiteManagerPanel({ insights }: { insights: SiteManagerInsight[] }) {
  const { t } = useTranslation();
  const atRisk = insights.filter((i) => i.delayRisk || i.budgetOverrunRisk);

  return (
    <Card className="mb-8 border-violet-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-violet-400" />
        <h3 className="font-semibold text-white">{t('phase2.siteManagerTitle')}</h3>
      </div>
      {insights.length === 0 ? (
        <p className="text-sm text-slate-500">{t('phase2.siteManagerEmpty')}</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.slice(0, 6).map((i) => (
            <div key={i.chantierId} className="p-3 rounded-lg bg-btp-900/50 border border-btp-600/20">
              <div className="flex justify-between items-start gap-2 mb-2">
                <p className="text-sm font-medium text-white truncate">{i.chantierName}</p>
                <Badge variant={i.healthLevel === 'red' ? 'red' : i.healthLevel === 'orange' ? 'orange' : 'green'}>
                  {i.healthScore}%
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1 mb-2">
                {i.delayRisk && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    <AlertTriangle className="w-3 h-3 inline" /> {t('phase2.delayRisk')}
                  </span>
                )}
                {i.budgetOverrunRisk && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                    <TrendingUp className="w-3 h-3 inline" /> +{i.predictedOverrunPercent}%
                  </span>
                )}
              </div>
              <ul className="text-xs text-slate-400 space-y-0.5">
                {i.actions.slice(0, 2).map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {atRisk.length > 0 && (
        <Link to="/detection-retard" className="inline-block mt-4">
          <Button size="sm" variant="ghost">
            {t('phase2.viewDelayAnalysis')} ({atRisk.length})
          </Button>
        </Link>
      )}
    </Card>
  );
}
