import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FileImage,
  Camera,
  GitCompare,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { QuickNav } from '@/components/layout/QuickNav';
import { useDemoData } from '@/hooks/useDemoData';
import { runFullSiteAnalysis } from '@/services/fakeAi';
import type { AiAnalysisResult } from '@/types';

export function AiAnalysisPage() {
  const { t } = useTranslation();
  const { chantiers } = useDemoData();
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiAnalysisResult | null>(null);

  const ch = chantiers.find((c) => c.id === chantierId);

  const runAnalysis = async () => {
    setLoading(true);
    setResult(null);
    try {
      const r = await runFullSiteAnalysis(ch?.name);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t('aiHub.title')}
        subtitle={t('aiHub.subtitle')}
        actions={
          <span className="flex items-center gap-1 text-xs text-cyan-400 px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
            <Sparkles className="w-3 h-3" />
            {t('app.demo')}
          </span>
        }
      />
      <QuickNav
        links={[
          { to: '/photo-comparison', labelKey: 'nav.photoCompare' },
          { to: '/plans', labelKey: 'nav.planAnalysis' },
          { to: '/photos', labelKey: 'nav.photos' },
        ]}
      />

      <Card className="mb-6">
        <h3 className="font-semibold text-white mb-2">{t('aiHub.fullAnalysis')}</h3>
        <p className="text-sm text-slate-400 mb-4">{t('aiHub.fullAnalysisDesc')}</p>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-sm flex-1 min-w-[200px]">
            <span className="text-slate-500 block mb-1">{t('common.chantier')}</span>
            <select
              value={chantierId}
              onChange={(e) => setChantierId(e.target.value)}
              className="w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
            >
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <Button onClick={runAnalysis} disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {t('common.analyze')}
          </Button>
        </div>
      </Card>

      {result && (
        <div className="grid lg:grid-cols-2 gap-4 mb-8">
          <AnalysisBlock title={t('aiHub.modifications')} items={result.modifications} />
          <AnalysisBlock title={t('aiHub.delays')} items={result.delays} />
          <AnalysisBlock title={t('aiHub.missingWork')} items={result.missingWork} />
          <AnalysisBlock title={t('aiHub.materialChanges')} items={result.materialChanges} />
          <AnalysisBlock title={t('aiHub.progress')} items={result.progressDetected} />
          <Card>
            <h4 className="font-medium text-cyan-300 mb-2">{t('aiHub.recommendations')}</h4>
            <ul className="space-y-2">
              {result.recommendations.map((line, i) => (
                <li key={i} className="text-sm text-slate-300 flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-slate-500">
              {t('aiHub.compliance')}: {result.complianceScore}%
            </p>
          </Card>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { to: '/photo-comparison', icon: GitCompare, key: 'photoCompare', descKey: 'aiHub.compareDesc' },
          { to: '/plans', icon: FileImage, key: 'planAnalysis', descKey: 'aiHub.plansDesc' },
          { to: '/photos', icon: Camera, key: 'photos', descKey: 'aiHub.photosDesc' },
        ].map(({ to, icon: Icon, key, descKey }) => (
          <Link key={to} to={to}>
            <Card className="h-full hover:border-cyan-500/40 transition-all">
              <Icon className="w-6 h-6 text-cyan-300 mb-2" />
              <h3 className="font-semibold text-white text-sm">{t(`nav.${key}`)}</h3>
              <p className="text-xs text-slate-400 mt-1">{t(descKey)}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function AnalysisBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h4 className="font-medium text-white mb-2">{title}</h4>
      <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
        {items.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
    </Card>
  );
}
