import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, Sparkles, FileText, Image } from 'lucide-react';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EditableTable } from '@/components/ui/EditableTable';
import { analyzePlan } from '@/services/fakeAi';
import { dataStore } from '@/services/dataStore';
import type { PlanRoom } from '@/types';

type PlanFormat = 'pdf' | 'jpg' | 'png';

export function PlanAnalysisPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState<PlanFormat | null>(null);
  const [rows, setRows] = useState<Record<string, string | number>[]>([]);
  const [meta, setMeta] = useState<{ legends: string[]; levels: string[]; fileType: string } | null>(null);

  const runAnalysis = async (format: PlanFormat) => {
    setLoading(format);
    try {
      const result = await analyzePlan(format);
      setRows(
        result.rooms.map((r) => ({
          id: r.id,
          piece: r.piece,
          surface: r.surface,
          material: r.material,
          quantity: r.quantity,
          observation: r.observation,
        }))
      );
      setMeta({ legends: result.legends, levels: result.levels, fileType: result.fileType });
      dataStore.setPlanRooms(result.rooms as PlanRoom[]);
    } finally {
      setLoading(null);
    }
  };

  const columns = [
    { key: 'piece', header: t('plans.piece') },
    { key: 'surface', header: t('plans.surface'), type: 'number' as const },
    { key: 'material', header: t('plans.material') },
    { key: 'quantity', header: t('plans.quantity'), type: 'number' as const },
    { key: 'observation', header: t('plans.observation') },
  ];

  const uploads: { format: PlanFormat; icon: typeof FileText; accept: string; label: string }[] = [
    { format: 'pdf', icon: FileText, accept: '.pdf', label: t('plans.uploadPdf') },
    { format: 'jpg', icon: Image, accept: '.jpg,.jpeg', label: t('plans.uploadJpg') },
    { format: 'png', icon: Image, accept: '.png', label: t('plans.uploadPng') },
  ];

  return (
    <div>
      <PageHeader title={t('plans.title')} subtitle={t('plans.subtitle')} />
      <PageQuickNav preset="ai" extra={[{ to: '/projets', labelKey: 'nav.projects' }]} />

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {uploads.map(({ format, icon: Icon, accept, label }) => (
          <Card key={format} className="flex flex-col items-center text-center">
            <Icon className="w-10 h-10 text-btp-400 mb-3" />
            <p className="text-sm text-slate-400 mb-4">{label}</p>
            <label className="w-full">
              <input
                type="file"
                accept={accept}
                className="hidden"
                onChange={() => runAnalysis(format)}
              />
              <span className="inline-flex w-full justify-center px-4 py-2 rounded-lg bg-btp-800/80 border border-btp-500/30 text-sm cursor-pointer hover:bg-btp-700/80">
                {t('common.upload')}
              </span>
            </label>
            <Button
              className="mt-2 w-full"
              size="sm"
              onClick={() => runAnalysis(format)}
              disabled={loading !== null}
            >
              {loading === format ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading === format ? t('plans.analyzing') : t('common.analyze')}
            </Button>
          </Card>
        ))}
      </div>

      {meta && (
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card title={t('plans.legends')}>
            <p className="text-xs text-cyan-400 mb-2">OCR — {meta.fileType.toUpperCase()}</p>
            <ul className="text-sm text-slate-300 space-y-1">
              {meta.legends.map((l) => (
                <li key={l}>• {l}</li>
              ))}
            </ul>
          </Card>
          <Card title={t('plans.levels')}>
            <ul className="text-sm text-slate-300 space-y-1">
              {meta.levels.map((l) => (
                <li key={l}>• {l}</li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {rows.length > 0 && (
        <Card title={t('plans.detected')}>
          <EditableTable columns={columns} rows={rows} onChange={setRows} />
        </Card>
      )}
    </div>
  );
}
