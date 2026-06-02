import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Activity,
  AlertTriangle,
  Brain,
  Calendar,
  ClipboardList,
  Gauge,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
  Users,
  Wallet,
  Truck,
  Sparkles,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/ui/StatCard';
import { SafeChart } from '@/components/charts/SafeChart';
import { buildSnapshotFromStore } from '@/services/siteDirector/buildSnapshot';
import { appendLearning, getLearningHistory } from '@/services/siteDirector/learningStore';
import { runSiteDirectorAnalysis } from '@shared/site-director/engine';
import { answerDirectorQuestion } from '@shared/site-director/qa';
import { useLanguage } from '@/hooks/useLanguage';
import { formatCurrency, formatPercent } from '@/utils/format';
import type { StakeholderRole } from '@shared/site-director/types';

type Tab = 'overview' | 'health' | 'analysis' | 'plans' | 'decisions' | 'predictions' | 'executive' | 'briefing' | 'coach' | 'command';

const roleKeys: StakeholderRole[] = [
  'director', 'site_manager', 'team_leader', 'worker', 'procurement', 'administration',
];

export function SiteDirectorPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('overview');
  const [projectId, setProjectId] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const snapshot = useMemo(() => buildSnapshotFromStore(), []);
  const focusId = projectId || snapshot.chantiers[0]?.id;
  const analysis = useMemo(() => {
    const a = runSiteDirectorAnalysis(snapshot, focusId);
    appendLearning(a.learning);
    return a;
  }, [snapshot, focusId]);

  const learning = getLearningHistory();
  const healthColor =
    analysis.health.level === 'red' ? 'text-red-400' : analysis.health.level === 'orange' ? 'text-amber-400' : 'text-emerald-400';

  const radialData = analysis.health.dimensions.map((d) => ({
    name: t(`siteDirector.dim_${d.key}`),
    score: d.score,
    fill: d.score < 50 ? '#f87171' : d.score < 75 ? '#fbbf24' : '#34d399',
  }));

  const onAsk = () => {
    if (!question.trim()) return;
    setAnswer(
      answerDirectorQuestion(question, snapshot, focusId, lang as 'fr' | 'ar' | 'en')
    );
  };

  const tabs: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', label: t('siteDirector.tabOverview'), icon: Gauge },
    { id: 'health', label: t('siteDirector.tabHealth'), icon: Activity },
    { id: 'analysis', label: t('siteDirector.tabAnalysis'), icon: ClipboardList },
    { id: 'plans', label: t('siteDirector.tabPlans'), icon: Calendar },
    { id: 'decisions', label: t('siteDirector.tabDecisions'), icon: Target },
    { id: 'predictions', label: t('siteDirector.tabPredictions'), icon: TrendingUp },
    { id: 'executive', label: t('siteDirector.tabExecutive'), icon: Wallet },
    { id: 'briefing', label: t('siteDirector.tabBriefing'), icon: AlertTriangle },
    { id: 'coach', label: t('siteDirector.tabCoach'), icon: Lightbulb },
    { id: 'command', label: t('siteDirector.tabCommand'), icon: MessageSquare },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('siteDirector.title')}
        subtitle={t('siteDirector.subtitle')}
        actions={
          <span className="inline-flex items-center gap-1">
            <Badge variant="blue">
              <span className="inline-flex items-center gap-1">
                <Brain className="w-3 h-3" />
                {t('siteDirector.badge')}
              </span>
            </Badge>
          </span>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={focusId}
          onChange={(e) => setProjectId(e.target.value)}
          className="flex-1 rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2.5 text-white text-sm"
        >
          <option value="">{t('siteDirector.allProjects')}</option>
          {snapshot.chantiers.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <Card className="flex items-center gap-4 px-4 py-2 shrink-0">
          <div className={`text-3xl font-bold ${healthColor}`}>{analysis.health.globalScore}</div>
          <div>
            <p className="text-xs text-slate-500">{t('siteDirector.globalScore')}</p>
            <p className="text-sm text-white">/ 100</p>
          </div>
        </Card>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-2 rounded-lg text-xs ${
              tab === id ? 'bg-btp-600 text-white' : 'bg-btp-800/60 text-slate-400'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title={t('siteDirector.recommendations')}>
            <ul className="space-y-2">
              {analysis.recommendations.map((r) => (
                <li key={r.id} className="text-sm flex gap-2">
                  <Badge variant={r.priority === 'urgent' ? 'red' : r.priority === 'high' ? 'orange' : 'gray'}>
                    {r.priority}
                  </Badge>
                  <span className="text-slate-300">{r.text}</span>
                </li>
              ))}
            </ul>
          </Card>
          <Card title={t('siteDirector.predictions')}>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <PredictionRow label={t('siteDirector.predOnTime')} value={analysis.predictions.onTimeProbability} />
              <PredictionRow label={t('siteDirector.predBudget')} value={analysis.predictions.budgetOverrunProbability} />
              <PredictionRow label={t('siteDirector.predDelay')} value={analysis.predictions.delayProbability} />
              <PredictionRow label={t('siteDirector.predClient')} value={analysis.predictions.clientSatisfactionProbability} />
            </div>
          </Card>
        </div>
      )}

      {tab === 'health' && (
        <div className="grid lg:grid-cols-2 gap-4">
          <Card title={t('siteDirector.healthDimensions')}>
            <SafeChart height={280}>
              <BarChart data={radialData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis type="category" dataKey="name" width={75} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #334155' }} />
                <Bar dataKey="score" radius={4} />
              </BarChart>
            </SafeChart>
          </Card>
          <div className="space-y-2">
            {analysis.health.dimensions.map((d) => (
              <Card key={d.key} className="py-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-white">{t(`siteDirector.dim_${d.key}`)}</span>
                  <span className="font-bold text-cyan-300">{d.score}</span>
                </div>
                <div className="h-1.5 bg-btp-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: `${d.score}%` }} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">{d.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'analysis' && (
        <div className="space-y-4">
          {analysis.reports
            .filter((r) => !focusId || r.projectId === focusId)
            .map((report) => (
              <Card key={report.projectId} title={report.projectName}>
                <p className="text-xs text-slate-500 mb-3">{report.summary}</p>
                <ul className="space-y-2">
                  {report.findings.map((f, i) => (
                    <li key={i} className="text-sm border-s-2 border-btp-600 ps-3" style={{
                      borderColor: f.severity === 'high' ? '#f87171' : f.severity === 'medium' ? '#fbbf24' : '#64748b',
                    }}>
                      <span className="font-medium text-white">{f.title}</span>
                      <p className="text-slate-400">{f.description}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
        </div>
      )}

      {tab === 'plans' && (
        <div className="space-y-4">
          {(['daily', 'weekly', 'monthly'] as const).map((horizon) => (
            <Card key={horizon} title={t(`siteDirector.plan_${horizon}`)}>
              {roleKeys.map((role) => {
                const items = analysis.actionPlans.filter((p) => p.horizon === horizon && p.role === role);
                if (!items.length) return null;
                return (
                  <div key={role} className="mb-3">
                    <p className="text-xs font-semibold text-cyan-400 mb-1">{t(`siteDirector.role_${role}`)}</p>
                    <ul className="text-sm text-slate-400 space-y-1">
                      {items.map((p) => (
                        <li key={p.id}>• {p.action}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </Card>
          ))}
        </div>
      )}

      {tab === 'decisions' && (
        <div className="space-y-4">
          {analysis.decisions.map((d, i) => (
            <Card key={i} title={d.problem}>
              <div className="grid md:grid-cols-3 gap-3">
                {d.options.map((o) => (
                  <div key={o.id} className="rounded-lg bg-btp-900/60 border border-btp-600/30 p-3">
                    <p className="font-medium text-white text-sm">{o.label}</p>
                    <p className="text-xs text-slate-500 mt-1">{o.description}</p>
                    <div className="mt-2 text-xs space-y-0.5 text-slate-400">
                      <p>{t('siteDirector.cost')}: {formatCurrency(o.costImpact)}</p>
                      <p>{t('siteDirector.risk')}: {o.riskLevel}</p>
                      <p>{t('siteDirector.time')}: {o.timeImpactDays > 0 ? '+' : ''}{o.timeImpactDays}j</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'predictions' && (
        <Card>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PredictionCard label={t('siteDirector.predOnTime')} value={analysis.predictions.onTimeProbability} />
            <PredictionCard label={t('siteDirector.predBudget')} value={analysis.predictions.budgetOverrunProbability} invert />
            <PredictionCard label={t('siteDirector.predDelay')} value={analysis.predictions.delayProbability} invert />
            <PredictionCard label={t('siteDirector.predClient')} value={analysis.predictions.clientSatisfactionProbability} />
          </div>
        </Card>
      )}

      {tab === 'executive' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard title={t('siteDirector.profitability')} value={formatPercent(analysis.executive.profitabilityPercent)} icon={TrendingUp} />
          <StatCard title={t('siteDirector.cashFlow')} value={analysis.executive.cashFlowStatus} icon={Wallet} />
          <StatCard title={t('siteDirector.onTrack')} value={analysis.executive.projectsOnTrack} icon={Activity} variant="success" />
          <StatCard title={t('siteDirector.atRisk')} value={analysis.executive.projectsAtRisk} icon={AlertTriangle} variant="warning" />
          <StatCard title={t('siteDirector.workforcePerf')} value={formatPercent(analysis.executive.workforcePerformancePercent)} icon={Users} />
          <StatCard title={t('siteDirector.supplierPerf')} value={formatPercent(analysis.executive.supplierPerformancePercent)} icon={Truck} />
        </div>
      )}

      {tab === 'briefing' && (
        <Card title={`${t('siteDirector.briefingTitle')} — ${analysis.briefing.date}`}>
          <BriefSection title={t('siteDirector.priorities')} items={analysis.briefing.priorities} />
          <BriefSection title={t('siteDirector.urgent')} items={analysis.briefing.urgentActions} />
          <BriefSection title={t('siteDirector.delayedTasks')} items={analysis.briefing.delayedTasks} />
          <BriefSection title={t('siteDirector.shortages')} items={analysis.briefing.materialShortages} />
          <BriefSection title={t('siteDirector.riskAlerts')} items={analysis.briefing.riskAlerts} />
        </Card>
      )}

      {tab === 'coach' && (
        <div className="grid md:grid-cols-2 gap-4">
          {analysis.coach.map((c) => (
            <Card key={c.id}>
              <Badge variant="blue">{c.area}</Badge>
              <h4 className="font-semibold text-white">{c.title}</h4>
              <p className="text-sm text-slate-400 mt-2">{c.advice}</p>
            </Card>
          ))}
          <Card title={t('siteDirector.learning')}>
            <ul className="text-sm text-slate-400 space-y-2">
              {learning.slice(0, 6).map((l) => (
                <li key={l.id}>
                  <span className="text-cyan-500">{l.projectName}</span> — {l.lesson}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'command' && (
        <Card className="border-cyan-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white">{t('siteDirector.commandTitle')}</h3>
          </div>
          <p className="text-xs text-slate-500 mb-3">{t('siteDirector.commandHint')}</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {[t('siteDirector.q1'), t('siteDirector.q2'), t('siteDirector.q3')].map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="text-xs px-2 py-1 rounded bg-btp-800 text-slate-400 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
          <textarea
            className="w-full rounded-lg bg-btp-800 border border-btp-600/40 p-3 text-white text-sm min-h-[80px]"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t('siteDirector.askPlaceholder')}
          />
          <Button className="mt-2" onClick={onAsk}>{t('siteDirector.ask')}</Button>
          {answer && (
            <div className="mt-4 p-4 rounded-lg bg-btp-900/80 border border-btp-600/30 text-sm text-slate-300 whitespace-pre-wrap">
              {answer}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function PredictionRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-lg font-semibold text-white">{value}%</p>
    </div>
  );
}

function PredictionCard({ label, value, invert }: { label: string; value: number; invert?: boolean }) {
  const good = invert ? value < 40 : value > 60;
  return (
    <div className={`p-4 rounded-xl border ${good ? 'border-emerald-500/30' : 'border-amber-500/30'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${good ? 'text-emerald-400' : 'text-amber-400'}`}>{value}%</p>
    </div>
  );
}

function BriefSection({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-cyan-300 mb-1">{title}</p>
      <ul className="text-sm text-slate-400 space-y-1">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
