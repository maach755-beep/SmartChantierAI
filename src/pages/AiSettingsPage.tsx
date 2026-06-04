import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Loader2, RefreshCw, Save, Zap } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { useToast } from '@/contexts/ToastContext';
import { useAiHealth } from '@/contexts/AiHealthContext';
import {
  loadAiPreferences,
  resetAiPreferences,
  saveAiPreferences,
  type AiPrimaryProvider,
  type AiPreferences,
} from '@/services/ai/aiPreferences';
import { testAiConnection, type AiConnectionTestResult } from '@/services/ai/aiProviderInfo';
import { procurementConfig } from '@/services/procurement/config';
import { clearOllamaStatusCache } from '@/services/ai/ollamaClient';

export function AiSettingsPage() {
  const { t } = useTranslation();
  const { success } = useToast();
  const { loading: healthLoading, health, refresh: refreshHealth } = useAiHealth();

  const [form, setForm] = useState<AiPreferences>(() => loadAiPreferences());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AiConnectionTestResult | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setForm(loadAiPreferences()), 0);
    return () => clearTimeout(id);
  }, []);

  const save = () => {
    saveAiPreferences(form);
    clearOllamaStatusCache();
    void refreshHealth(true);
    success(t('aiSettings.saved'));
  };

  const reset = () => {
    resetAiPreferences();
    setForm(loadAiPreferences());
    clearOllamaStatusCache();
    void refreshHealth(true);
    success(t('aiSettings.resetDone'));
  };

  const runTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    try {
      saveAiPreferences(form);
      clearOllamaStatusCache();
      setTestResult(await testAiConnection());
      void refreshHealth(true);
    } catch (e) {
      setTestResult({
        ok: false,
        provider: 'none',
        message: e instanceof Error ? e.message : t('aiSettings.testFailed'),
      });
    } finally {
      setTesting(false);
    }
  }, [form, refreshHealth, t]);

  const providers: { id: AiPrimaryProvider; label: string; disabled?: boolean }[] = [
    { id: 'ollama', label: t('aiSettings.providerOllama') },
    {
      id: 'openai',
      label: t('aiSettings.providerOpenai'),
      disabled: !procurementConfig.openai.enabled,
    },
    { id: 'auto', label: t('aiSettings.providerAuto') },
  ];

  const statusOnline = health?.ok ?? false;

  return (
    <div className="max-w-2xl">
      <PageHeader title={t('aiSettings.title')} subtitle={t('aiSettings.subtitle')} />
      <PageQuickNav preset="full" />

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Brain className="w-4 h-4 text-violet-400" />
            {t('aiSettings.connectionStatus')}
          </h3>
          <span
            className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full ${
              healthLoading
                ? 'bg-slate-700/50 text-slate-400'
                : statusOnline
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {healthLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('common.loading')}
              </>
            ) : statusOnline ? (
              t('aiSettings.statusOnline')
            ) : (
              t('aiSettings.statusOffline')
            )}
          </span>
        </div>

        <p
          className={`text-sm rounded-lg border p-3 ${
            healthLoading
              ? 'border-btp-600/30 text-slate-400'
              : statusOnline
                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
                : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
          }`}
        >
          {healthLoading
            ? t('aiSettings.checking')
            : health?.ollama.message ?? t('aiSettings.statusOfflineHint')}
        </p>
        {health?.source && (
          <p className="text-xs text-slate-500 mt-2">
            {t('aiSettings.healthSource', { source: health.source })}
          </p>
        )}
      </Card>

      <Card title={t('aiSettings.configTitle')} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-500 mb-2">{t('aiSettings.providerLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {providers.map((p) => (
              <button
                key={p.id}
                type="button"
                disabled={p.disabled}
                onClick={() => setForm((f) => ({ ...f, primaryProvider: p.id }))}
                className={`text-sm px-3 py-2 rounded-lg border transition-colors ${
                  form.primaryProvider === p.id
                    ? 'border-violet-500 bg-violet-500/20 text-white'
                    : 'border-btp-600 text-slate-400 hover:border-slate-500'
                } ${p.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {!procurementConfig.openai.enabled && (
            <p className="text-xs text-slate-500 mt-2">{t('aiSettings.openaiNotConfigured')}</p>
          )}
        </div>

        <div>
          <label htmlFor="ollama-url" className="block text-xs text-slate-500 mb-1">
            {t('aiSettings.ollamaUrl')}
          </label>
          <input
            id="ollama-url"
            type="text"
            value={form.ollamaBaseUrl}
            onChange={(e) => setForm((f) => ({ ...f, ollamaBaseUrl: e.target.value }))}
            className="w-full rounded-lg bg-btp-900 border border-btp-600 px-3 py-2 text-sm text-white font-mono"
            placeholder="http://localhost:11434"
          />
          <p className="text-xs text-slate-500 mt-1">{t('aiSettings.ollamaUrlHint')}</p>
        </div>

        <div>
          <label htmlFor="text-model" className="block text-xs text-slate-500 mb-1">
            {t('aiSettings.modelName')}
          </label>
          <input
            id="text-model"
            type="text"
            value={form.textModel}
            onChange={(e) => setForm((f) => ({ ...f, textModel: e.target.value }))}
            className="w-full rounded-lg bg-btp-900 border border-btp-600 px-3 py-2 text-sm text-white"
            placeholder="llama3.1"
          />
        </div>

        <div>
          <label htmlFor="vision-model" className="block text-xs text-slate-500 mb-1">
            {t('aiSettings.visionModel')}
          </label>
          <input
            id="vision-model"
            type="text"
            value={form.visionModel}
            onChange={(e) => setForm((f) => ({ ...f, visionModel: e.target.value }))}
            className="w-full rounded-lg bg-btp-900 border border-btp-600 px-3 py-2 text-sm text-white"
            placeholder="llava"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Button size="sm" onClick={save}>
            <Save className="w-4 h-4" />
            {t('common.save')}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void refreshHealth(true)} disabled={healthLoading}>
            <RefreshCw className={`w-4 h-4 ${healthLoading ? 'animate-spin' : ''}`} />
            {t('aiSettings.refreshStatus')}
          </Button>
          <Button size="sm" onClick={() => void runTest()} disabled={testing}>
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {t('aiSettings.testConnection')}
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            {t('aiSettings.resetPrefs')}
          </Button>
        </div>

        {testResult && (
          <p
            className={`text-xs p-2 rounded-lg ${
              testResult.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
            }`}
          >
            {testResult.ok
              ? `${t('aiSettings.testOk')} (${testResult.provider}${testResult.model ? ` — ${testResult.model}` : ''})`
              : `${t('aiSettings.testFailed')}: ${testResult.message}`}
          </p>
        )}
      </Card>

      <p className="text-xs text-slate-500 mt-4">{t('aiSettings.footerHint')}</p>
    </div>
  );
}
