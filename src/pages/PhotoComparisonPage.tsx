import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, GitCompare, Upload, AlertTriangle } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useDemoData } from '@/hooks/useDemoData';
import { dataStore } from '@/services/dataStore';
import { analyzePhotoPair } from '@/services/photoAi';
import type { PhotoComparisonResult, SitePhoto } from '@/types';

export function PhotoComparisonPage() {
  const { t } = useTranslation();
  const { photos, chantiers, refresh } = useDemoData();
  const [searchParams] = useSearchParams();
  const chantierId = searchParams.get('chantier') ?? chantiers[0]?.id ?? '';
  const ch = chantiers.find((c) => c.id === chantierId);

  const projectPhotos = useMemo(
    () => photos.filter((p) => p.chantierId === chantierId),
    [photos, chantierId]
  );
  const beforePhotos = projectPhotos.filter((p) => p.phase === 'before' || p.phase === 'progress');
  const afterPhotos = projectPhotos.filter((p) => p.phase === 'after' || p.phase === 'progress');

  const [oldPhoto, setOldPhoto] = useState<SitePhoto | null>(beforePhotos[0] ?? null);
  const [newPhoto, setNewPhoto] = useState<SitePhoto | null>(afterPhotos[0] ?? null);
  const [oldPreview, setOldPreview] = useState(oldPhoto?.url ?? 'https://picsum.photos/seed/chantier-old/500/360');
  const [newPreview, setNewPreview] = useState(newPhoto?.url ?? '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhotoComparisonResult | null>(null);
  const fileOldRef = useRef<HTMLInputElement>(null);
  const fileNewRef = useRef<HTMLInputElement>(null);

  const analyze = async () => {
    if (!ch || !oldPreview || !newPreview) return;
    setLoading(true);
    setResult(null);
    try {
      const analysis = await analyzePhotoPair(oldPreview, newPreview, ch.name);
      setResult(analysis);
      dataStore.savePhotoComparison({
        chantierId: ch.id,
        chantierName: ch.name,
        oldPhotoId: oldPhoto?.id ?? 'custom_old',
        newPhotoId: newPhoto?.id ?? 'custom_new',
        oldPhotoUrl: oldPreview,
        newPhotoUrl: newPreview,
        result: analysis,
      });
      if (analysis.differenceScore > 20) {
        dataStore.updateChantierProgressFromPhotos(ch.id, 2);
      }
      refresh();
    } finally {
      setLoading(false);
    }
  };

  const pickOld = (p: SitePhoto) => {
    setOldPhoto(p);
    setOldPreview(p.url);
    setResult(null);
  };

  const pickNew = (p: SitePhoto) => {
    setNewPhoto(p);
    setNewPreview(p.url);
    setResult(null);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <PageHeader title={t('photoCompare.title')} subtitle={t('photoCompare.subtitle')} />
      <PageQuickNav preset="ai" />

      {ch && (
        <Card className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm text-white font-medium">{ch.name}</p>
            <p className="text-xs text-slate-500">{t('photos.projectProgress')}: {ch.progress}%</p>
          </div>
          <Badge variant={ch.riskLevel === 'red' ? 'red' : ch.riskLevel === 'orange' ? 'orange' : 'green'}>
            {ch.status}
          </Badge>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <Card title={t('photoCompare.oldPhoto')}>
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-btp-900 mb-3">
            <img src={oldPreview} alt="" className="w-full h-full object-cover" />
          </div>
          <select
            className="w-full mb-2 rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
            value={oldPhoto?.id ?? ''}
            onChange={(e) => {
              const p = beforePhotos.find((x) => x.id === e.target.value);
              if (p) pickOld(p);
            }}
          >
            {beforePhotos.map((p) => (
              <option key={p.id} value={p.id}>{p.room} — {new Date(p.date).toLocaleDateString()}</option>
            ))}
          </select>
          <Button variant="ghost" size="sm" onClick={() => fileOldRef.current?.click()}>
            <Upload className="w-3 h-3" />
            {t('common.upload')}
          </Button>
          <input
            ref={fileOldRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setOldPhoto(null);
                setOldPreview(URL.createObjectURL(f));
                setResult(null);
              }
            }}
          />
        </Card>

        <Card title={t('photoCompare.newPhoto')}>
          <div
            className="aspect-[4/3] rounded-lg overflow-hidden bg-btp-900 mb-3 border-2 border-dashed border-btp-500/30 cursor-pointer"
            onClick={() => fileNewRef.current?.click()}
          >
            {newPreview ? (
              <img src={newPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <p className="h-full flex items-center justify-center text-slate-500 text-sm p-4 text-center">
                {t('photoCompare.uploadNew')}
              </p>
            )}
          </div>
          <select
            className="w-full mb-2 rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
            value={newPhoto?.id ?? ''}
            onChange={(e) => {
              const p = afterPhotos.find((x) => x.id === e.target.value);
              if (p) pickNew(p);
            }}
          >
            {afterPhotos.map((p) => (
              <option key={p.id} value={p.id}>{p.room} — {new Date(p.date).toLocaleDateString()}</option>
            ))}
          </select>
          <input
            ref={fileNewRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setNewPhoto(null);
                setNewPreview(URL.createObjectURL(f));
                setResult(null);
              }
            }}
          />
        </Card>
      </div>

      <Button onClick={analyze} disabled={loading || !newPreview} className="w-full sm:w-auto">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitCompare className="w-4 h-4" />}
        {t('photoCompare.runAi')}
      </Button>

      {result && (
        <div className="mt-6 space-y-4">
          <Card className="border-amber-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-white">{t('photoCompare.differenceScore')}</span>
            </div>
            <span className="text-2xl font-bold text-amber-400">{result.differenceScore}%</span>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ResultCard title={t('photoCompare.modifications')} items={result.modificationsDetected} tone="red" />
            <ResultCard title={t('photoCompare.progressDetected')} items={result.progressDetected} tone="green" />
            <ResultCard title={t('photoCompare.delayDetected')} items={result.delayDetected} tone="amber" />
            <ResultCard title={t('photoCompare.materialChangeDetected')} items={result.materialChangeDetected} tone="cyan" />
            <ResultCard title={t('photoCompare.completedWork')} items={result.completedWork} />
            <ResultCard title={t('photoCompare.missingWork')} items={result.missingWork} />
            <ResultCard title={t('photoCompare.alerts')} items={result.alerts} tone="red" icon />
          </div>
          <p className="text-xs text-slate-500">{t('photoCompare.alertsSaved')}</p>
        </div>
      )}
    </div>
  );
}

function ResultCard({
  title,
  items,
  tone,
  icon,
}: {
  title: string;
  items: string[];
  tone?: 'green' | 'amber' | 'cyan' | 'red';
  icon?: boolean;
}) {
  const border =
    tone === 'green'
      ? 'border-green-500/30'
      : tone === 'amber'
        ? 'border-amber-500/30'
        : tone === 'cyan'
          ? 'border-cyan-500/30'
          : tone === 'red'
            ? 'border-red-500/30'
            : '';
  return (
    <Card title={title} className={border}>
      <ul className="text-sm text-slate-300 space-y-1">
        {items.map((x) => (
          <li key={x} className="flex gap-1">
            {icon && <span className="text-red-400">!</span>}
            {x}
          </li>
        ))}
      </ul>
    </Card>
  );
}
