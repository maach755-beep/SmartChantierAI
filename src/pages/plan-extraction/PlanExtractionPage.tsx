import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles,
  Upload,
  Database,
  FileSpreadsheet,
  GitCompare,
  Bot,
  AlertCircle,
  Loader2,
  Download,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable } from '@/components/ui/DataTable';
import { planExtractionApi, isPlanApiOnline } from '@/api/planExtractionClient';
import { useLanguage } from '@/hooks/useLanguage';
import type {
  DevisDocument,
  PlanExtractionKpis,
  PlanExtractionResult,
  ProjectRecord,
} from '@shared/plan-extraction/types';

type Tab = 'dashboard' | 'upload' | 'data' | 'devis' | 'changes' | 'compare' | 'assistant';

export function PlanExtractionPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [projectId, setProjectId] = useState('');
  const [kpis, setKpis] = useState<PlanExtractionKpis | null>(null);
  const [extraction, setExtraction] = useState<PlanExtractionResult | null>(null);
  const [devis, setDevis] = useState<DevisDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assistantQ, setAssistantQ] = useState('');
  const [assistantA, setAssistantA] = useState('');
  const apiOnline = isPlanApiOnline();

  const load = useCallback(async () => {
    setError(null);
    try {
      const { data: projs } = await planExtractionApi.listProjects();
      setProjects(projs);
      const pid = projectId || projs[0]?.id;
      if (!pid) return;
      setProjectId(pid);
      const [{ data: k }, { data: ext }] = await Promise.all([
        planExtractionApi.getKpis(pid),
        planExtractionApi.getLatestExtraction(pid),
      ]);
      setKpis(k);
      setExtraction(ext?.result ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('planExtraction.loadError'));
    }
  }, [projectId, t]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async API hydration on mount
    void load();
  }, [load]);

  const onUpload = async (file: File) => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await planExtractionApi.uploadPlan(projectId, file);
      setExtraction(data.result);
      await load();
      setTab('data');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const onDevis = async () => {
    if (!projectId || !extraction) return;
    setLoading(true);
    try {
      const { data } = await planExtractionApi.generateDevis(projectId, extraction.jobId);
      setDevis(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Devis failed');
    } finally {
      setLoading(false);
    }
  };

  const onExport = async (format: 'csv' | 'pdf' | 'excel') => {
    if (!extraction) return;
    const res = await planExtractionApi.exportTable(extraction.jobId, format);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-export.${format === 'excel' ? 'xls' : format}`;
    a.click();
  };

  const onAsk = async () => {
    if (!projectId || !assistantQ.trim()) return;
    const { data } = await planExtractionApi.askAssistant(
      projectId,
      assistantQ,
      lang as 'fr' | 'ar' | 'en',
      extraction?.jobId
    );
    setAssistantA(data.answer);
  };

  const tabs: { id: Tab; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
    { id: 'dashboard', icon: Sparkles, label: t('planExtraction.tabDashboard') },
    { id: 'upload', icon: Upload, label: t('planExtraction.tabUpload') },
    { id: 'data', icon: Database, label: t('planExtraction.tabData') },
    { id: 'devis', icon: FileSpreadsheet, label: t('planExtraction.tabDevis') },
    { id: 'changes', icon: GitCompare, label: t('planExtraction.tabChanges') },
    { id: 'compare', icon: GitCompare, label: t('planExtraction.tabCompare') },
    { id: 'assistant', icon: Bot, label: t('planExtraction.tabAssistant') },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('planExtraction.title')}
        subtitle={t('planExtraction.subtitle')}
        actions={
          <Badge variant={apiOnline ? 'green' : 'orange'}>
            {apiOnline ? t('planExtraction.apiOnline') : t('planExtraction.apiOfflineShort')}
          </Badge>
        }
      />

      {error && (
        <Card className="mb-4 border-amber-500/40 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-sm text-amber-200">{error}</p>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="flex-1 rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white text-sm"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <nav className="flex gap-1 overflow-x-auto pb-2 mb-4">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 shrink-0 px-3 py-2 rounded-lg text-xs sm:text-sm ${
              tab === id ? 'bg-btp-600 text-white' : 'bg-btp-800/60 text-slate-400'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      {tab === 'dashboard' && kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KpiCard label={t('planExtraction.kpiSurface')} value={`${kpis.totalSurfaceSqm} m²`} />
          <KpiCard label={t('planExtraction.kpiProgress')} value={`${kpis.progressPercent}%`} />
          <KpiCard label={t('planExtraction.kpiBudget')} value={`${kpis.budgetPercent}%`} />
          <KpiCard label={t('planExtraction.kpiDelay')} value={`${kpis.delayPercent}%`} />
          <KpiCard label={t('planExtraction.kpiOrdered')} value={String(kpis.materialsOrdered)} />
          <KpiCard label={t('planExtraction.kpiInstalled')} value={String(kpis.materialsInstalled)} />
          <KpiCard label={t('planExtraction.kpiRisks')} value={String(kpis.riskCount)} />
          <KpiCard label={t('planExtraction.kpiAlerts')} value={String(kpis.alertCount)} />
        </div>
      )}

      {tab === 'upload' && (
        <Card>
          <p className="text-sm text-slate-400 mb-4">{t('planExtraction.uploadHint')}</p>
          <label className="flex flex-col items-center justify-center min-h-[200px] border-2 border-dashed border-btp-500/40 rounded-xl cursor-pointer hover:bg-btp-900/50 p-6">
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,image/*"
              className="hidden"
              disabled={loading || !apiOnline}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload(f);
              }}
            />
            {loading ? (
              <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            ) : (
              <>
                <Upload className="w-10 h-10 text-btp-400 mb-2" />
                <span className="text-sm text-slate-300">{t('planExtraction.uploadTypes')}</span>
              </>
            )}
          </label>
          {extraction?.status === 'needs_vision_api' && (
            <p className="mt-3 text-xs text-amber-400">{t('planExtraction.needsVision')}</p>
          )}
        </Card>
      )}

      {tab === 'data' && extraction && (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => onExport('csv')}>
              <Download className="w-4 h-4" /> CSV
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onExport('excel')}>
              <Download className="w-4 h-4" /> Excel
            </Button>
            <Button size="sm" variant="secondary" onClick={() => onExport('pdf')}>
              <Download className="w-4 h-4" /> PDF
            </Button>
          </div>
          {extraction.coloredZones.length > 0 && (
            <Card title={t('planExtraction.colorZones')}>
              <DataTable
                data={extraction.coloredZones}
                columns={[
                  { key: 'colorLabel', header: t('planExtraction.color') },
                  { key: 'zoneName', header: t('planExtraction.zone') },
                  { key: 'materialName', header: t('plans.material') },
                  { key: 'surfaceSqm', header: t('plans.surface') },
                ]}
              />
            </Card>
          )}
          <Card title={t('planExtraction.rooms')}>
            <DataTable
              data={extraction.rooms}
              columns={[
                { key: 'name', header: t('plans.piece') },
                { key: 'surfaceSqm', header: t('plans.surface') },
              ]}
            />
          </Card>
          <Card title={t('planExtraction.materials')}>
            <DataTable
              data={extraction.materials}
              columns={[
                { key: 'reference', header: t('planExtraction.ref') },
                { key: 'brand', header: t('planExtraction.brand') },
                { key: 'model', header: t('planExtraction.model') },
                { key: 'color', header: t('planExtraction.color') },
              ]}
            />
          </Card>
        </div>
      )}

      {tab === 'devis' && (
        <Card>
          <Button onClick={onDevis} disabled={!extraction || loading}>
            {t('planExtraction.generateDevis')}
          </Button>
          {devis && (
            <div className="mt-4 text-sm text-slate-300 space-y-1">
              <p>HT: {devis.subtotalHt} {devis.currency}</p>
              <p>{t('planExtraction.margin')}: {devis.marginAmount}</p>
              <p>TVA: {devis.vatAmount}</p>
              <p className="font-semibold text-white">TTC: {devis.totalTtc} {devis.currency}</p>
            </div>
          )}
        </Card>
      )}

      {tab === 'changes' && extraction && extraction.materials.length >= 2 && (
        <ChangeForm
          projectId={projectId}
          materials={extraction.materials}
          rooms={extraction.rooms}
          t={t}
        />
      )}

      {tab === 'compare' && (
        <CompareForm projectId={projectId} planJobId={extraction?.jobId} t={t} />
      )}

      {tab === 'assistant' && (
        <Card>
          <textarea
            className="w-full rounded-lg bg-btp-800 border border-btp-600/40 p-3 text-white text-sm min-h-[100px]"
            placeholder={t('planExtraction.assistantPlaceholder')}
            value={assistantQ}
            onChange={(e) => setAssistantQ(e.target.value)}
          />
          <Button className="mt-2" onClick={onAsk}>{t('assistant.send')}</Button>
          {assistantA && <p className="mt-4 text-sm text-slate-300 whitespace-pre-wrap">{assistantA}</p>}
        </Card>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-bold text-white mt-1">{value}</p>
    </Card>
  );
}

function ChangeForm({
  projectId,
  materials,
  rooms,
  t,
}: {
  projectId: string;
  materials: PlanExtractionResult['materials'];
  rooms: PlanExtractionResult['rooms'];
  t: (k: string) => string;
}) {
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '');
  const [oldId, setOldId] = useState(materials[0]?.id ?? '');
  const [newId, setNewId] = useState(materials[1]?.id ?? '');
  const [result, setResult] = useState<string | null>(null);

  const submit = async () => {
    const { data, avenantPdf } = await planExtractionApi.applyMaterialChange(projectId, {
      roomId,
      oldMaterialId: oldId,
      newMaterialId: newId,
      quantity: rooms.find((r) => r.id === roomId)?.surfaceSqm ?? 1,
    });
    setResult(`${t('planExtraction.budgetImpact')}: ${data.budgetImpact}\n\n${avenantPdf}`);
  };

  return (
    <Card>
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        <select className="rounded-lg bg-btp-800 px-3 py-2 text-sm text-white" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
        <select className="rounded-lg bg-btp-800 px-3 py-2 text-sm text-white" value={oldId} onChange={(e) => setOldId(e.target.value)}>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name} (old)</option>)}
        </select>
        <select className="rounded-lg bg-btp-800 px-3 py-2 text-sm text-white" value={newId} onChange={(e) => setNewId(e.target.value)}>
          {materials.map((m) => <option key={m.id} value={m.id}>{m.name} (new)</option>)}
        </select>
      </div>
      <Button onClick={submit}>{t('planExtraction.applyChange')}</Button>
      {result && <pre className="mt-4 text-xs text-slate-400 whitespace-pre-wrap">{result}</pre>}
    </Card>
  );
}

function CompareForm({
  projectId,
  planJobId,
  t,
}: {
  projectId: string;
  planJobId?: string;
  t: (k: string) => string;
}) {
  const [msg, setMsg] = useState('');

  return (
    <Card>
      <p className="text-sm text-slate-400 mb-4">{t('planExtraction.compareHint')}</p>
      <label className="block">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="text-sm text-slate-400"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              const { data } = await planExtractionApi.syncFieldPhoto(projectId, f, undefined, planJobId);
              setMsg(
                `${t('planExtraction.completion')}: ${data.completionPercent}% — ${t('planExtraction.difference')}: ${data.differencePercent}% — Risk: ${data.riskScore}\n${data.alerts.join('\n')}`
              );
            } catch (err) {
              setMsg(err instanceof Error ? err.message : 'Error');
            }
          }}
        />
      </label>
      {msg && <pre className="mt-4 text-xs text-slate-300 whitespace-pre-wrap">{msg}</pre>}
    </Card>
  );
}
