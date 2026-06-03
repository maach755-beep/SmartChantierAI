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
  Database,
} from 'lucide-react';
import { QuickNav } from '@/components/layout/QuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { ChartContainer } from '@/components/charts/ChartContainer';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { usePlatformData } from '@/hooks/usePlatformData';
import { formatCurrency } from '@/utils/format';
import { getSituationDashboardSummary } from '@/services/situationAnalysis/engine';
import { getPurchaseDashboardSummary } from '@/services/purchaseAssistant/aiRecommendationService';
import { Button } from '@/components/ui/Button';
import { SiteManagerPanel } from '@/components/dashboard/SiteManagerPanel';
import { Users, ListTodo, HeartPulse } from 'lucide-react';

const RISK_COLORS = { green: '#22c55e', orange: '#f59e0b', red: '#ef4444' };

export function DashboardPage() {
  const { t } = useTranslation();
  const { chantiers, attendance, suppliers, risks, metrics, loading, isLiveDb, siteInsights } =
    usePlatformData();

  const active = metrics?.activeProjects ?? chantiers.filter((c) => c.status === 'active').length;
  const delayed = metrics?.delayedProjects ?? chantiers.filter((c) => c.status === 'delayed').length;
  const atRisk = metrics?.atRiskProjects ?? chantiers.filter((c) => c.status === 'at_risk').length;
  const absent = metrics?.absentToday ?? attendance.filter((a) => a.absent).length;
  const overBudget =
    chantiers.filter((c) => c.budgetConsumed > c.budgetPlanned * 0.95).length;
  const lateSup = suppliers.filter((s) => s.lateDeliveries > 2).length;
  const totalBudget = metrics?.totalBudgetPlanned ?? chantiers.reduce((s, c) => s + c.budgetPlanned, 0);
  const consumed = metrics?.totalBudgetConsumed ?? chantiers.reduce((s, c) => s + c.budgetConsumed, 0);
  const redRisks = risks.filter((r) => r.level === 'red').length;
  const orangeRisks = risks.filter((r) => r.level === 'orange').length;
  const situation = getSituationDashboardSummary(delayed + atRisk);
  const purchase = getPurchaseDashboardSummary();

  const chartProgressData = chantiers.slice(0, 8).map((c) => ({
    name: c.name.length > 12 ? `${c.name.slice(0, 12)}…` : c.name,
    progress: c.progress,
  }));

  const chartRiskData = [
    { name: t('risks.scoreGreen'), value: chantiers.filter((c) => c.riskLevel === 'green').length, fill: RISK_COLORS.green },
    { name: t('risks.scoreOrange'), value: chantiers.filter((c) => c.riskLevel === 'orange').length, fill: RISK_COLORS.orange },
    { name: t('risks.scoreRed'), value: chantiers.filter((c) => c.riskLevel === 'red').length, fill: RISK_COLORS.red },
  ].filter((d) => d.value > 0);

  const chartBudgetData = chantiers.slice(0, 6).map((c) => ({
    name: c.name.length > 10 ? `${c.name.slice(0, 10)}…` : c.name,
    prevu: Math.round(c.budgetPlanned / 1000),
    consomme: Math.round(c.budgetConsumed / 1000),
  }));

  const chartDelayData = chantiers
    .filter((c) => c.delayDays > 0)
    .slice(0, 8)
    .map((c) => ({
      name: c.name.length > 10 ? `${c.name.slice(0, 10)}…` : c.name,
      retard: c.delayDays,
    }));

  const chartPresenceData = [
    { day: 'Lun', present: Math.max(0, attendance.length - absent), absent },
    { day: 'Mar', present: Math.max(0, attendance.length - absent - 1), absent: absent + 1 },
    { day: 'Mer', present: attendance.length, absent: 0 },
    { day: 'Jeu', present: Math.max(0, attendance.length - 1), absent: 1 },
    { day: 'Ven', present: Math.max(0, attendance.length - absent), absent },
  ];

  return (
    <div>
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />
      <div className="flex items-center gap-2 mb-4 text-xs">
        <Database className={`w-4 h-4 ${isLiveDb ? 'text-emerald-400' : 'text-amber-400'}`} />
        <span className={isLiveDb ? 'text-emerald-400' : 'text-amber-400'}>
          {isLiveDb ? t('dashboard.dataSourceLive') : t('dashboard.dataSourceLocal')}
        </span>
        {loading && <span className="text-slate-500">…</span>}
      </div>
      <QuickNav
        links={[
          { to: '/projets', labelKey: 'nav.projects' },
          { to: '/devis-gestion', labelKey: 'nav.quotations' },
          { to: '/bons-commande', labelKey: 'nav.purchaseOrders' },
          { to: '/rapports', labelKey: 'nav.reports' },
        ]}
      />

      <SectionTitle title={t('phase2.advancedKpi')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatCard title={t('phase2.healthScore')} value={`${metrics?.avgHealthScore ?? 0}%`} icon={HeartPulse} variant="success" />
        <StatCard title={t('phase2.openTasks')} value={metrics?.openTasks ?? 0} icon={ListTodo} />
        <StatCard title={t('phase2.workforce')} value={metrics?.presentToday ?? 0} icon={Users} variant="default" />
        <StatCard title={t('phase2.materialAlerts')} value={metrics?.materialShortages ?? 0} icon={Package} variant="warning" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title={t('dashboard.saasQuotations')} value={metrics?.quotationsCount ?? 0} icon={FileEdit} />
        <StatCard title={t('dashboard.saasPO')} value={metrics?.purchaseOrdersCount ?? 0} icon={ShoppingCart} />
        <StatCard title={t('dashboard.saasSuppliers')} value={metrics?.suppliersCount ?? suppliers.length} icon={Truck} />
        <StatCard
          title={t('dashboard.expensiveDevis')}
          value={metrics?.expensiveQuotations ?? 0}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      <SiteManagerPanel insights={siteInsights} />

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
        <StatCard title={t('phase2.overdueTasks')} value={metrics?.overdueTasks ?? 0} icon={FileEdit} variant="warning" />
      </div>

      <SectionTitle title={t('dashboard.riskSection')} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <StatCard title={t('dashboard.missingMaterials')} value={metrics?.materialShortages ?? 0} icon={Package} variant="warning" />
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

      {chartProgressData.length > 0 && (
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

          {chartRiskData.length > 0 && (
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
          )}

          {chartBudgetData.length > 0 && (
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
          )}

          {chartDelayData.length > 0 && (
            <ChartContainer title={t('dashboard.chartDelays')}>
              <LineChart data={chartDelayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis tick={{ fill: '#94a3b8' }} />
                <Tooltip contentStyle={{ background: '#0f1729', border: '1px solid #2563eb' }} />
                <Line type="monotone" dataKey="retard" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b' }} />
              </LineChart>
            </ChartContainer>
          )}

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
      )}

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
