import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ClipboardCopy,
  FileDown,
  FileSpreadsheet,
  Loader2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { situationDemoExamples } from '@/data/situationDemoExamples';
import { runSituationAnalysis } from '@/services/situationAnalysis/engine';
import { saveAnalysis } from '@/services/situationAnalysis/storage';
import {
  copySituationToClipboard,
  exportSituationExcel,
  exportSituationPdf,
} from '@/services/situationAnalysis/exportReport';
import type { SituationAnalysisResult, SituationInput } from '@/types/situationAnalysis';
import { formatCurrency } from '@/utils/format';

const emptyInput: SituationInput = {
  siteName: '',
  siteType: 'Immeuble / Villa / Lotissement',
  startDate: new Date().toISOString().slice(0, 10),
  plannedEndDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
  budgetPlanned: 1_000_000,
  budgetConsumed: 0,
  progressPercent: 0,
  workerCount: 15,
  tasksCompleted: 0,
  tasksDelayed: 0,
  missingMaterials: '',
  problemsEncountered: '',
  clientModifications: '',
  supplierDelays: '',
  siteConstraints: '',
  photosNote: '',
  documentsNote: '',
};

type Tab = 'diagnosis' | 'solutions' | 'savings' | 'report' | 'table' | 'plans' | 'scores';

export function SituationAnalysisPage() {
  const { t } = useTranslation();
  const [form, setForm] = useState<SituationInput>(emptyInput);
  const [result, setResult] = useState<SituationAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>('scores');
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof SituationInput>(key: K, value: SituationInput[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const analyze = () => {
    if (!form.siteName.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const r = runSituationAnalysis(form);
      saveAnalysis(r);
      setResult(r);
      setTab('scores');
      setLoading(false);
    }, 600);
  };

  const loadDemo = (input: SituationInput) => {
    setForm(input);
    setResult(null);
  };

  const severityLabel = (p: string) => {
    if (p === 'urgent') return t('situation.priorityUrgent');
    if (p === 'high') return t('situation.priorityHigh');
    return t('situation.priorityNormal');
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'scores', label: t('situation.tabScores') },
    { id: 'diagnosis', label: t('situation.tabDiagnosis') },
    { id: 'solutions', label: t('situation.tabSolutions') },
    { id: 'savings', label: t('situation.tabSavings') },
    { id: 'report', label: t('situation.tabReport') },
    { id: 'table', label: t('situation.tabTable') },
    { id: 'plans', label: t('situation.tabPlans') },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('situation.title')}
        subtitle={t('situation.subtitle')}
        actions={
          <Link to="/">
            <Button variant="ghost" size="sm">{t('nav.dashboard')}</Button>
          </Link>
        }
      />

      <Card className="mb-6">
        <p className="text-sm text-slate-400 mb-4">{t('situation.formIntro')}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {situationDemoExamples.map((ex) => (
            <Button key={ex.id} variant="secondary" size="sm" onClick={() => loadDemo(ex.input)}>
              {t(ex.labelKey)}
            </Button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label={t('situation.fieldName')} value={form.siteName} onChange={(v) => update('siteName', v)} />
          <Field label={t('situation.fieldType')} value={form.siteType} onChange={(v) => update('siteType', v)} />
          <Field label={t('situation.fieldStart')} type="date" value={form.startDate} onChange={(v) => update('startDate', v)} />
          <Field label={t('situation.fieldEnd')} type="date" value={form.plannedEndDate} onChange={(v) => update('plannedEndDate', v)} />
          <Field label={t('situation.fieldBudgetPlanned')} type="number" value={form.budgetPlanned} onChange={(v) => update('budgetPlanned', Number(v))} />
          <Field label={t('situation.fieldBudgetConsumed')} type="number" value={form.budgetConsumed} onChange={(v) => update('budgetConsumed', Number(v))} />
          <Field label={t('situation.fieldProgress')} type="number" value={form.progressPercent} onChange={(v) => update('progressPercent', Number(v))} />
          <Field label={t('situation.fieldWorkers')} type="number" value={form.workerCount} onChange={(v) => update('workerCount', Number(v))} />
          <Field label={t('situation.fieldTasksDone')} type="number" value={form.tasksCompleted} onChange={(v) => update('tasksCompleted', Number(v))} />
          <Field label={t('situation.fieldTasksLate')} type="number" value={form.tasksDelayed} onChange={(v) => update('tasksDelayed', Number(v))} />
        </div>

        <div className="grid lg:grid-cols-2 gap-3 mt-3">
          <TextArea label={t('situation.fieldMissingMat')} value={form.missingMaterials} onChange={(v) => update('missingMaterials', v)} />
          <TextArea label={t('situation.fieldProblems')} value={form.problemsEncountered} onChange={(v) => update('problemsEncountered', v)} />
          <TextArea label={t('situation.fieldClientMod')} value={form.clientModifications} onChange={(v) => update('clientModifications', v)} />
          <TextArea label={t('situation.fieldSupplierDelay')} value={form.supplierDelays} onChange={(v) => update('supplierDelays', v)} />
          <TextArea label={t('situation.fieldConstraints')} value={form.siteConstraints} onChange={(v) => update('siteConstraints', v)} />
          <div className="grid gap-3">
            <Field label={t('situation.fieldPhotos')} value={form.photosNote ?? ''} onChange={(v) => update('photosNote', v)} />
            <Field label={t('situation.fieldDocs')} value={form.documentsNote ?? ''} onChange={(v) => update('documentsNote', v)} />
          </div>
        </div>

        <Button className="mt-6" onClick={analyze} disabled={loading || !form.siteName.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {t('situation.analyze')}
        </Button>
      </Card>

      {result && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button variant="secondary" size="sm" onClick={() => void exportSituationPdf(result)}>
              <FileDown className="w-4 h-4" /> PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={() => exportSituationExcel(result)}>
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                void copySituationToClipboard(result).then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
              }}
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <ClipboardCopy className="w-4 h-4" />}
              {t('situation.copy')}
            </Button>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-2 mb-4">
            {tabs.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm ${
                  tab === id ? 'bg-btp-600 text-white' : 'bg-btp-800/60 text-slate-400'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {tab === 'scores' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              <ScoreCard label={t('situation.scoreDelay')} value={result.scores.delay} />
              <ScoreCard label={t('situation.scoreBudget')} value={result.scores.budget} />
              <ScoreCard label={t('situation.scoreOrg')} value={result.scores.organization} />
              <ScoreCard label={t('situation.scoreProd')} value={result.scores.productivity} />
              <ScoreCard label={t('situation.scoreRisk')} value={result.scores.risk} />
              <ScoreCard label={t('situation.scoreGlobal')} value={result.scores.global} highlight />
            </div>
          )}

          {tab === 'diagnosis' && (
            <div className="grid sm:grid-cols-2 gap-3">
              {result.diagnosis.map((d) => (
                <Card key={d.area}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-white">{t(`situation.area_${d.area}`)}</span>
                    <Badge variant={d.status === 'critical' ? 'red' : d.status === 'warning' ? 'orange' : 'green'}>
                      {d.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400">{d.summary}</p>
                </Card>
              ))}
            </div>
          )}

          {tab === 'solutions' && (
            <div className="space-y-4">
              {result.solutions.map((s) => (
                <Card key={s.id}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant={s.priority === 'urgent' ? 'red' : s.priority === 'high' ? 'orange' : 'gray'}>
                      {severityLabel(s.priority)}
                    </Badge>
                    <span className="text-xs text-slate-500">{s.advisedOwner} · {s.actionDelay}</span>
                  </div>
                  <p className="font-medium text-white text-sm">{s.problem}</p>
                  <p className="text-xs text-amber-400/90 mt-1">{t('situation.cause')}: {s.probableCause}</p>
                  <p className="text-sm text-cyan-300/90 mt-2">{s.concreteSolution}</p>
                  <p className="text-xs text-slate-500 mt-2">
                    {t('situation.impact')}: {s.expectedImpact} · {t('situation.deadline')}: {s.deadline}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {tab === 'savings' && (
            <div className="grid md:grid-cols-2 gap-4">
              {result.savings.map((s) => (
                <Card key={s.id}>
                  <h4 className="font-semibold text-white text-sm">{s.title}</h4>
                  <p className="text-sm text-slate-400 mt-2">{s.detail}</p>
                  <p className="text-xs text-emerald-400 mt-2">{s.estimatedSaving}</p>
                </Card>
              ))}
            </div>
          )}

          {tab === 'report' && (
            <Card title={result.directorReport.title}>
              <ReportSection title={t('situation.reportSummary')} lines={[result.directorReport.situationSummary]} />
              <ReportSection title={t('situation.reportProblems')} lines={result.directorReport.mainProblems} />
              <ReportSection title={t('situation.reportSolutions')} lines={result.directorReport.proposedSolutions.slice(0, 8)} />
              <ReportSection title={t('situation.reportTimeGains')} lines={result.directorReport.estimatedTimeGains} />
              <ReportSection title={t('situation.reportSavings')} lines={result.directorReport.potentialSavings} />
              <ReportSection title={t('situation.reportPriorities')} lines={result.directorReport.actionPriorities} />
              <ReportSection title={t('situation.reportPlan7')} lines={result.directorReport.plan7Days} />
              <ReportSection title={t('situation.reportPlan30')} lines={result.directorReport.plan30Days} />
              <ReportSection title={t('situation.reportDirector')} lines={result.directorReport.directorTalkingPoints} />
            </Card>
          )}

          {tab === 'table' && (
            <DataTable
              data={result.solutions}
              columns={[
                { key: 'problem', header: t('situation.colProblem') },
                {
                  key: 'priority',
                  header: t('situation.colSeverity'),
                  render: (s) => <Badge variant={s.priority === 'urgent' ? 'red' : s.priority === 'high' ? 'orange' : 'gray'}>{severityLabel(s.priority)}</Badge>,
                },
                { key: 'concreteSolution', header: t('situation.colSolution') },
                {
                  key: 'solutionCost',
                  header: t('situation.colCost'),
                  render: (s) => formatCurrency(s.solutionCost),
                },
                {
                  key: 'estimatedGain',
                  header: t('situation.colGain'),
                  render: (s) => formatCurrency(s.estimatedGain),
                },
                { key: 'advisedOwner', header: t('situation.colOwner') },
                { key: 'deadline', header: t('situation.colDeadline') },
                { key: 'status', header: t('situation.colStatus') },
              ]}
            />
          )}

          {tab === 'plans' && (
            <div className="space-y-4">
              {(['daily', 'weekly', 'monthly'] as const).map((h) => (
                <Card key={h} title={t(`situation.plan_${h}`)}>
                  {(['direction', 'chef_chantier', 'conducteur_travaux', 'ouvriers', 'achats', 'administration'] as const).map((role) => {
                    const items = result.actionPlans.filter((a) => a.horizon === h && a.role === role);
                    if (!items.length) return null;
                    return (
                      <div key={role} className="mb-3">
                        <p className="text-xs font-semibold text-cyan-400">{t(`situation.role_${role}`)}</p>
                        <ul className="text-sm text-slate-400 mt-1 space-y-0.5">
                          {items.map((a) => (
                            <li key={a.id}>• {a.action}</li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {!result && (
        <Card className="border-dashed border-btp-500/30 text-center py-12">
          <AlertTriangle className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">{t('situation.emptyResult')}</p>
        </Card>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs">{label}</span>
      <input
        type={type}
        className="mt-1 w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-500 text-xs">{label}</span>
      <textarea
        className="mt-1 w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm min-h-[80px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

function ScoreCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const color = value < 50 ? 'text-red-400' : value < 75 ? 'text-amber-400' : 'text-emerald-400';
  return (
    <Card className={highlight ? 'border-cyan-500/40' : ''}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </Card>
  );
}

function ReportSection({ title, lines }: { title: string; lines: string[] }) {
  if (!lines.length) return null;
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-cyan-300 mb-1">{title}</p>
      <ul className="text-sm text-slate-400 space-y-1">
        {lines.map((l, i) => (
          <li key={i}>• {l}</li>
        ))}
      </ul>
    </div>
  );
}
