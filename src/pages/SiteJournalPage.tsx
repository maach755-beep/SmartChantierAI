import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Loader2, History } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { UploadZone } from '@/components/ui/UploadZone';
import { LoadingBlock } from '@/components/ui/LoadingBlock';
import { usePlatformData } from '@/hooks/usePlatformData';
import { analyzeSitePhotos, listJournalHistory } from '@/services/siteJournal/engine';
import type { SiteJournalEntry } from '@/types/siteJournal';

export function SiteJournalPage() {
  const { t } = useTranslation();
  const { chantiers } = usePlatformData();
  const [chantierId, setChantierId] = useState(chantiers[0]?.id ?? '');
  const [photoCount, setPhotoCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [entry, setEntry] = useState<SiteJournalEntry | null>(null);
  const [history, setHistory] = useState(() => listJournalHistory());

  const analyze = async () => {
    if (!chantierId) return;
    setLoading(true);
    try {
      const e = await analyzeSitePhotos(chantierId, Math.max(1, photoCount));
      setEntry(e);
      setHistory(listJournalHistory(chantierId));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title={t('journal.title')} subtitle={t('journal.subtitle')} />
      <Card className="mb-6">
        <select
          value={chantierId}
          onChange={(e) => setChantierId(e.target.value)}
          className="w-full max-w-md mb-4 bg-btp-900 border border-btp-600/30 rounded-lg px-3 py-2 text-sm"
        >
          {chantiers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <UploadZone
          accept="image/*"
          hint={t('journal.upload')}
          onFile={() => setPhotoCount((n) => n + 1)}
        />
        {photoCount > 0 && (
          <p className="text-xs text-slate-500 mt-2">
            {photoCount} {t('journal.photosReady')}
          </p>
        )}
        <Button className="mt-4" onClick={() => void analyze()} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          {t('journal.analyze')}
        </Button>
      </Card>

      {loading && <LoadingBlock label={t('journal.analyzing')} />}

      {entry && !loading && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card title={t('journal.workDone')}>
            <ul className="text-sm text-slate-300 list-disc list-inside">
              {entry.workCompleted.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
            <p className="text-cyan-400 text-sm mt-3">
              {t('journal.progress')}: {entry.progressEstimate}%
            </p>
          </Card>
          <Card title={t('journal.remaining')}>
            <ul className="text-sm text-slate-400 list-disc list-inside">
              {entry.remainingTasks.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('journal.risks')}>
            <ul className="text-sm text-amber-200/90 list-disc list-inside">
              {entry.risksDetected.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('journal.recommendations')}>
            <ul className="text-sm text-emerald-300/90 list-disc list-inside">
              {entry.recommendations.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      <Card title={t('journal.history')} action={<History className="w-4 h-4 text-slate-500" />}>
        <ul className="text-sm text-slate-500 space-y-2">
          {history.length === 0 && <li>{t('journal.noHistory')}</li>}
          {history.slice(0, 10).map((h) => (
            <li key={h.id}>
              {t('journal.historyEntry', {
                date: new Date(h.createdAt).toLocaleString(),
                name: h.chantierName,
                count: h.photoCount,
                progress: h.progressEstimate,
              })}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
