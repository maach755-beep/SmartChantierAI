import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { usePlatformData } from '@/hooks/usePlatformData';
import { computeChantierHealth } from '@/utils/healthScore';
import { formatCurrency } from '@/utils/format';
import type { Risk } from '@/types';

export function RisksPage() {
  const { t } = useTranslation();
  const { risks, chantiers } = usePlatformData();
  const [selectedId, setSelectedId] = useState(chantiers[0]?.id ?? '');
  const chantier = chantiers.find((c) => c.id === selectedId);
  const siteRisks = risks.filter((r) => r.chantierId === selectedId);
  const health = chantier ? computeChantierHealth(chantier, siteRisks) : null;

  const levelBadge = (r: Risk) =>
    r.level === 'red' ? 'red' : r.level === 'orange' ? 'orange' : 'green';

  const scoreCards = [
    { level: 'green' as const, count: siteRisks.filter((r) => r.level === 'green').length },
    { level: 'orange' as const, count: siteRisks.filter((r) => r.level === 'orange').length },
    { level: 'red' as const, count: siteRisks.filter((r) => r.level === 'red').length },
  ];

  return (
    <div>
      <PageHeader title={t('risks.title')} subtitle={t('risks.subtitle')} />
      <PageQuickNav preset="ops" extra={[{ to: '/analyse-ia', labelKey: 'nav.aiAnalysis' }]} />

      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="mb-4 bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-slate-200 w-full max-w-md"
      >
        {chantiers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {scoreCards.map(({ level, count }) => (
          <Card
            key={level}
            className={
              level === 'green'
                ? 'border-green-500/30'
                : level === 'orange'
                  ? 'border-amber-500/30'
                  : 'border-red-500/30'
            }
          >
            <p className="text-xs text-slate-500 uppercase">
              {level === 'green'
                ? t('risks.scoreGreen')
                : level === 'orange'
                  ? t('risks.scoreOrange')
                  : t('risks.scoreRed')}
            </p>
            <p
              className={`text-3xl font-bold mt-1 ${
                level === 'green' ? 'text-green-400' : level === 'orange' ? 'text-amber-400' : 'text-red-400'
              }`}
            >
              {count}
            </p>
          </Card>
        ))}
      </div>

      {chantier && health && (
        <Card title={t('risks.healthSheet')} className="mb-6 border-cyan-500/25">
          <div className="flex flex-wrap items-center gap-6 mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#1e3a5f" strokeWidth="3" />
                <circle
                  cx="18"
                  cy="18"
                  r="15"
                  fill="none"
                  stroke={health.level === 'red' ? '#ef4444' : health.level === 'orange' ? '#f59e0b' : '#22c55e'}
                  strokeWidth="3"
                  strokeDasharray={`${health.score} 100`}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                {health.score}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 flex-1">
              <div>
                <p className="text-xs text-slate-500">{t('risks.budgetPlanned')}</p>
                <p className="text-lg font-semibold">{formatCurrency(chantier.budgetPlanned)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('risks.budgetConsumed')}</p>
                <p className="text-lg font-semibold">{formatCurrency(chantier.budgetConsumed)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">{t('risks.delay')}</p>
                <p className="text-lg font-semibold text-amber-400">
                  {chantier.delayDays} {t('common.daysShort')}
                </p>
              </div>
            </div>
            <Badge variant={health.level === 'red' ? 'red' : health.level === 'orange' ? 'orange' : 'green'}>
              {health.label}
            </Badge>
          </div>
          <p className="text-sm font-medium text-cyan-400 mb-2">{t('risks.recommendations')}</p>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>• {t('risks.reco1')}</li>
            <li>• {t('risks.reco2')}</li>
            <li>• {t('risks.reco3')}</li>
          </ul>
        </Card>
      )}

      <DataTable
        data={siteRisks.length ? siteRisks : risks.slice(0, 15)}
        columns={[
          { key: 'chantierName', header: t('common.chantier') },
          {
            key: 'type',
            header: t('common.type'),
            render: (r) => {
              const key = `risks.types.${r.type}`;
              const translated = t(key);
              return translated === key ? r.type : translated;
            },
          },
          { key: 'description', header: t('common.description') },
          {
            key: 'level',
            header: t('risks.colLevel'),
            render: (r) => (
              <Badge variant={levelBadge(r)}>
                {r.level === 'red'
                  ? t('risks.scoreRed')
                  : r.level === 'orange'
                    ? t('risks.scoreOrange')
                    : t('risks.scoreGreen')}
              </Badge>
            ),
          },
          { key: 'score', header: '%' },
        ]}
      />
    </div>
  );
}
