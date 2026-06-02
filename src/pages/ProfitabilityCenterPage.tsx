import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SafeChart } from '@/components/charts/SafeChart';
import { computeProfitability, getZoneCostsForChart } from '@/services/profitability/engine';
import { formatCurrency, formatCurrencyHT, formatCurrencyTTC } from '@/utils/format';

export function ProfitabilityCenterPage() {
  const { t } = useTranslation();
  const [chantierId, setChantierId] = useState('');
  const kpis = useMemo(() => computeProfitability(chantierId || undefined), [chantierId]);
  const selected = chantierId ? kpis.find((k) => k.chantierId === chantierId) ?? kpis[0] : kpis[0];
  const chartChantierId = selected?.chantierId;
  const chartData = useMemo(
    () => (chartChantierId ? getZoneCostsForChart(chartChantierId) : []),
    [chartChantierId]
  );

  return (
    <div>
      <PageHeader title={t('profit.title')} subtitle={t('profit.subtitle')} />
      <select
        value={chantierId}
        onChange={(e) => setChantierId(e.target.value)}
        className="mb-4 w-full max-w-md bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm"
      >
        <option value="">{t('profit.allChantiers')}</option>
        {kpis.map((k) => (
          <option key={k.chantierId} value={k.chantierId}>
            {k.chantierName}
          </option>
        ))}
      </select>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.slice(0, 4).map((k) => (
          <StatCard
            key={k.chantierId}
            title={k.chantierName}
            value={formatCurrency(k.estimatedProfit)}
            trend={`${t('profit.margin')}: ${k.profitMarginPercent}%`}
            icon={TrendingUp}
            variant={k.costOverrun > 0 ? 'warning' : 'success'}
          />
        ))}
      </div>

      {selected && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title={t('profit.kpis')}>
            <ul className="text-sm text-slate-400 space-y-2">
              <li>
                {t('profit.actualCost')}: <span className="text-white">{formatCurrency(selected.actualCost)}</span>
              </li>
              <li>
                {t('profit.budget')}: {formatCurrency(selected.budgetConsumed)} / {formatCurrency(selected.budgetPlanned)}
              </li>
              <li>
                {t('profit.overrun')}: {formatCurrency(selected.costOverrun)} ({selected.overrunPercent}%)
              </li>
              <li>
                {t('profit.totalHt')}: <span className="text-white">{formatCurrencyHT(selected.totalHt)}</span>
              </li>
              <li>
                {t('profit.tva')}: <span className="text-white">{formatCurrency(selected.tvaAmount)}</span>
              </li>
              <li>
                {t('profit.totalTtc')}: <span className="text-white">{formatCurrencyTTC(selected.totalHt)}</span>
              </li>
              <li>
                {t('profit.expensiveZone')}: <span className="text-amber-300">{selected.mostExpensiveZone}</span>
              </li>
              <li>
                {t('profit.expensiveMaterial')}: <span className="text-amber-300">{selected.mostExpensiveMaterial}</span>
              </li>
            </ul>
          </Card>
          <Card title={t('profit.savings')}>
            <ul className="text-sm text-emerald-300/90 space-y-1 list-disc list-inside">
              {selected.savingsOpportunities.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('profit.zoneChart')} className="lg:col-span-2">
            {chartData.length > 0 ? (
              <SafeChart height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="zone" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                  <Bar dataKey="cost" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                </BarChart>
              </SafeChart>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">{t('profit.noChartData')}</p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
