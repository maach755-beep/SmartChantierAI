import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  Building2,
  Clock,
  AlertTriangle,
  Package,
  FileEdit,
  UserX,
  TrendingDown,
  Truck,
  Wallet,
  Activity,
  Sparkles,
  Timer,
  PiggyBank,
  Zap,
  ShoppingCart,
  ScrollText,
} from 'lucide-react';
import { QuickNav } from '@/components/layout/QuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ChartContainer } from '@/components/charts/ChartContainer';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';
import {
  chartProgressData,
  chartRiskData,
  chartBudgetData,
  chartDelayData,
  chartPresenceData,
} from '@/data/demoData';
import { formatCurrency } from '@/utils/format';
import { getSituationDashboardSummary } from '@/services/situationAnalysis/engine';
import { getPurchaseDashboardSummary } from '@/services/purchaseAssistant/aiRecommendationService';
import { Button } from '@/components/ui/Button';

export function DashboardPage() {
  const { t } = useTranslation();
  const { chantiers, modifications, attendance, suppliers, risks } = useDemoData();

  const active = chantiers.filter((c) => c.status === 'active').length;
  const delayed = chantiers.filter((c) => c.status === 'delayed').length;
  const atRisk = chantiers.filter((c) => c.status === 'at_risk').length;
  const pendingMods = modifications.filter((m) => m.status === 'pending').length;
  const absent = attendance.filter((a) => a.absent).length;
  const overBudget = chantiers.filter((c) => c.budgetConsumed > c.budgetPlanned * 0.95).length;
  const lateSup = suppliers.filter((s) => s.lateDeliveries > 2).length;
  const totalBudget = chantiers.reduce((s, c) => s + c.budgetPlanned, 0);
  const consumed = chantiers.reduce((s, c) => s + c.budgetConsumed, 0);
  const redRisks = risks.filter((r) => r.level === 'red').length;
  const orangeRisks = risks.filter((r) => r.level === 'orange').length;
  const situation = getSituationDashboardSummary(delayed + atRisk);
  const purchase = getPurchaseDashboardSummary();

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <QuickNav
        links={[
          { to: '/projets', labelKey: 'nav.projects' },
          { to: '/taches', labelKey: 'nav.tasks' },
          { to: '/analyse-ia', labelKey: 'nav.aiAnalysis' },
          { to: '/rapports', labelKey: 'nav.reports' },
        ]}
      />

      <SectionTitle title={t('dashboard.situationSection')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard title={t('dashboard.situationSitesToOptimize')} value={situation.sitesToOptimize} icon={Building2} variant="warning" />
        <StatCard title={t('dashboard.situationTimeGains')} value={situation.timeGainDays} icon={Timer} variant="default" />
        <StatCard title={t('dashboard.situationSavings')} value={formatCurrency(situation.potentialSavingsEur)} icon={PiggyBank} variant="success" />
        <StatCard title={t('dashboard.situationUrgent')} value={situation.urgentActions} icon={Zap} variant="danger" />
      </div>
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t('dashboard.situationTopReco')}</p>
            <p className="text-sm text-slate-300">{situation.topRecommendation}</p>
          </div>
          <Link to="/analyse-situation-chantier">
            <Button size="sm">
              <Sparkles className="w-4 h-4" />
              {t('dashboard.situationCta')}
            </Button>
          </Link>
        </div>
      </Card>

      <SectionTitle title={t('dashboard.purchaseSection')} />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <StatCard title={t('dashboard.purchaseRecent')} value={purchase.recentSearches} icon={ShoppingCart} />
        <StatCard title={t('dashboard.purchaseRecommended')} value={purchase.recommendedProducts} icon={Package} variant="success" />
        <StatCard title={t('dashboard.purchaseSavings')} value={formatCurrency(purchase.potentialSavings)} icon={PiggyBank} />
        <StatCard title={t('dashboard.purchaseReliable')} value={purchase.reliableSuppliers} icon={Truck} variant="default" />
        <StatCard title={t('dashboard.purchaseAvoid')} value={purchase.productsToAvoid} icon={AlertTriangle} variant="warning" />
      </div>
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-slate-500 mb-1">{t('dashboard.purchaseTopReco')}</p>
            <p className="text-sm text-slate-300">{purchase.topRecommendation}</p>
          </div>
          <Link to="/assistant-achat">
            <Button size="sm">
              <ShoppingCart className="w-4 h-4" />
              {t('dashboard.purchaseCta')}
            </Button>
          </Link>
        </div>
      </Card>

      <SectionTitle title={t('dashboard.techSheetSection')} />
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">{t('dashboard.techSheetHint')}</p>
          </div>
          <Link to="/assistant-fiche-technique">
            <Button size="sm">
              <ScrollText className="w-4 h-4" />
              {t('dashboard.techSheetCta')}
            </Button>
          </Link>
        </div>
      </Card>

      <SectionTitle title={t('dashboard.kpiSection')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title={t('dashboard.activeSites')} value={active} icon={Building2} variant="default" />
        <StatCard title={t('dashboard.delayedSites')} value={delayed} icon={Clock} variant="warning" />
        <StatCard title={t('dashboard.atRiskSites')} value={atRisk} icon={AlertTriangle} variant="danger" />
        <StatCard title={t('dashboard.pendingMods')} value={pendingMods} icon={FileEdit} />
      </div>

      <SectionTitle title={t('dashboard.riskSection')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title={t('dashboard.missingMaterials')} value={7} icon={Package} variant="warning" />
        <StatCard title={t('dashboard.criticalRisks')} value={redRisks} icon={AlertTriangle} variant="danger" />
        <StatCard title={t('dashboard.moderateRisks')} value={orangeRisks} icon={Activity} variant="warning" />
        <StatCard title={t('dashboard.lateSuppliers')} value={lateSup} icon={Truck} variant="warning" />
      </div>

      <SectionTitle title={t('dashboard.budgetSection')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title={t('dashboard.totalBudget')} value={formatCurrency(totalBudget)} icon={Wallet} />
        <StatCard title={t('dashboard.consumedBudget')} value={formatCurrency(consumed)} icon={TrendingDown} />
        <StatCard title={t('dashboard.overBudget')} value={overBudget} icon={TrendingDown} variant="danger" />
        <StatCard title={t('dashboard.absentWorkers')} value={absent} icon={UserX} variant="warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <ChartContainer title={t('dashboard.chartProgress')}>
          <BarChart data={chartProgressData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8' }} domain={[0, 100]} />
            <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #2563eb' }} />
            <Bar dataKey="progress" fill="#3b82f6" name="%" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>

        <ChartContainer title={t('dashboard.chartRisks')}>
          <PieChart>
            <Pie data={chartRiskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>
              {chartRiskData.map((e, i) => (
                <Cell key={i} fill={e.fill} />
              ))}
            </Pie>
            <Legend />
            <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #2563eb' }} />
          </PieChart>
        </ChartContainer>

        <ChartContainer title={t('dashboard.chartBudget')}>
          <BarChart data={chartBudgetData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #2563eb' }} />
            <Bar dataKey="prevu" fill="#60a5fa" name="Prévu (k€)" />
            <Bar dataKey="consomme" fill="#06b6d4" name="Consommé (k€)" />
          </BarChart>
        </ChartContainer>

        <ChartContainer title={t('dashboard.chartDelays')}>
          <LineChart data={chartDelayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #2563eb' }} />
            <Line type="monotone" dataKey="retard" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
          </LineChart>
        </ChartContainer>

        <ChartContainer title={t('dashboard.chartPresence')} className="lg:col-span-2">
          <BarChart data={chartPresenceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
            <XAxis dataKey="day" tick={{ fill: '#94a3b8' }} />
            <YAxis tick={{ fill: '#94a3b8' }} />
            <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #2563eb' }} />
            <Bar dataKey="present" stackId="a" fill="#22c55e" name="Présents" />
            <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Absents" />
          </BarChart>
        </ChartContainer>
      </div>

      <Card title={t('dashboard.topChantiers')} className="mt-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chantiers.slice(0, 6).map((c) => (
            <div key={c.id} className="p-3 rounded-lg bg-btp-900/50 border border-btp-600/20">
              <p className="font-medium text-white text-sm truncate">{c.name}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant={c.riskLevel === 'red' ? 'red' : c.riskLevel === 'orange' ? 'orange' : 'green'}>
                  {c.progress}%
                </Badge>
                {c.delayDays > 0 && (
                  <Badge variant="orange">
                    {c.delayDays}j
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
