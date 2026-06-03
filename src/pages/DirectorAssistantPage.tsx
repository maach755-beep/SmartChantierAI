import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Loader2, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { EmptyState } from '@/components/ui/EmptyState';
import { usePlatformData } from '@/hooks/usePlatformData';
import { runDirectorAssistant } from '@/services/directorAssistant/engine';
import { getDirectorHistory, saveDirectorAnalysis } from '@/services/directorAssistant/storage';
import type { DirectorAssistantResult, DirectorPriority } from '@/types/directorAssistant';

const PRIORITY_VARIANT: Record<DirectorPriority, 'red' | 'orange' | 'green' | 'gray'> = {
  urgent: 'red',
  high: 'orange',
  normal: 'green',
  low: 'gray',
};

export function DirectorAssistantPage() {
  const { t } = useTranslation();
  const { chantiers } = usePlatformData();
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? '');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DirectorAssistantResult | null>(null);
  const [history, setHistory] = useState(getDirectorHistory());

  const analyze = async () => {
    if (!text.trim() || !chantierId) return;
    setLoading(true);
    try {
      const r = await runDirectorAssistant(text, chantierId);
      saveDirectorAnalysis(r);
      setResult(r);
      setHistory(getDirectorHistory());
    } finally {
      setLoading(false);
    }
  };

  const examples = [
    t('director.exDelay'),
    t('director.exMaterials'),
    t('director.exBudget'),
  ];

  return (
    <div>
      <PageHeader title={t('director.title')} subtitle={t('director.subtitle')} />
      <Card className="mb-6">
        <label className="text-xs text-slate-500 block mb-1">{t('common.chantier')}</label>
        <select
          value={chantierId}
          onChange={(e) => setChantierId(e.target.value)}
          className="w-full max-w-md mb-3 bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm"
        >
          {chantiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="text-xs text-slate-500 block mb-1">{t('director.inputLabel')}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={t('director.placeholder')}
          className="w-full bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm text-slate-200"
        />
        <div className="flex flex-wrap gap-2 mt-3">
          {examples.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setText(ex)}
              className="text-xs px-2 py-1 rounded-md bg-btp-800/60 text-slate-400 hover:text-white"
            >
              {ex}
            </button>
          ))}
        </div>
        <Button className="mt-4" onClick={() => void analyze()} disabled={loading || !text.trim()}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {t('director.analyze')}
        </Button>
      </Card>

      {loading && <LoadingBlock label={t('director.analyzing')} />}

      {result && !loading && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card title={t('director.summary')}>
            <p className="text-sm text-slate-300">{result.situationSummary}</p>
            <div className="mt-3">
              <Badge variant={PRIORITY_VARIANT[result.priorityLevel]}>
                {t(`director.priority_${result.priorityLevel}`)}
              </Badge>
            </div>
          </Card>
          <Card title={t('director.savings')}>
            <p className="text-sm text-emerald-300">{t('director.timeSave')}: {result.estimatedTimeSavings}</p>
            <p className="text-sm text-cyan-300 mt-1">{t('director.costSave')}: {result.estimatedCostSavings}</p>
          </Card>
          <Card title={t('director.rootCauses')}>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              {result.rootCauses.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('director.risks')}>
            <ul className="text-sm text-amber-200/90 space-y-1 list-disc list-inside">
              {result.risks.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('director.decisions')} className="md:col-span-2">
            <ul className="text-sm text-slate-300 space-y-1">
              {result.recommendedDecisions.map((x) => (
                <li key={x}>• {x}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('director.actionPlan')} className="md:col-span-2">
            <div className="space-y-3">
              {result.actionPlan.map((a) => (
                <div key={a.id} className="p-3 rounded-lg bg-btp-900/50 border border-btp-600/20">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant={PRIORITY_VARIANT[a.priority]}>{t(`director.priority_${a.priority}`)}</Badge>
                    <span className="text-xs text-slate-500">{a.deadline}</span>
                  </div>
                  <p className="text-sm text-white font-medium">{a.title}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {t('director.responsible')}: {a.responsible}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {!result && !loading && (
        <Card>
          <EmptyState title={t('director.empty')} description={t('common.emptyHint')} icon={Brain} />
        </Card>
      )}

      {history.length > 0 && (
        <Card title={t('director.history')} className="mt-6">
          <ul className="text-sm text-slate-500 space-y-2">
            {history.slice(0, 5).map((h) => (
              <li key={h.id}>
                {new Date(h.createdAt).toLocaleString()} — {h.chantierName} — {h.priorityLevel}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
