import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Brain, Loader2, RefreshCw, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getAiProviderOverview,
  refreshOllamaStatus,
  testAiConnection,
  type AiConnectionTestResult,
} from '@/services/ai/aiProviderInfo';
import type { OllamaStatus } from '@/services/ai/ollamaClient';

export function AiSettingsPanel() {
  const { t } = useTranslation();
  const overview = getAiProviderOverview();
  const [status, setStatus] = useState<OllamaStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<AiConnectionTestResult | null>(null);

  const loadStatus = useCallback(async () => {
    setLoading(true);
    try {
      setStatus(await refreshOllamaStatus());
    } catch {
      setStatus({
        online: false,
        textModel: null,
        visionModel: null,
        installedModels: [],
        message: t('settings.aiOllamaOffline'),
      });
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void loadStatus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [loadStatus]);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(await testAiConnection());
    } catch (e) {
      setTestResult({
        ok: false,
        provider: 'none',
        message: e instanceof Error ? e.message : t('settings.aiTestFailed'),
      });
    } finally {
      setTesting(false);
    }
  };

  const fallbackLabel =
    overview.fallbackProvider === 'openai'
      ? t('settings.aiFallbackOpenai')
      : t('settings.aiFallbackRules');

  return (
    <Card title={t('settings.aiTitle')} className="md:col-span-2">
      <p className="text-xs text-slate-500 mb-4">{overview.openaiHint}</p>

      <dl className="grid sm:grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <dt className="text-slate-500">{t('settings.aiCurrentProvider')}</dt>
          <dd className="text-white font-medium flex items-center gap-2 mt-1">
            <Brain className="w-4 h-4 text-violet-400" />
            Ollama ({t('settings.aiDefault')})
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('settings.aiFallback')}</dt>
          <dd className="text-slate-300 mt-1">{fallbackLabel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('settings.aiOllamaUrl')}</dt>
          <dd className="text-slate-300 font-mono text-xs mt-1 break-all">{overview.ollamaBaseUrl}</dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('settings.aiTextModel')}</dt>
          <dd className="text-slate-300 mt-1">
            {status?.textModel ?? overview.configuredTextModel}
            {!loading && !status?.textModel && (
              <span className="text-amber-400 text-xs block">{t('settings.aiModelMissing')}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">{t('settings.aiVisionModel')}</dt>
          <dd className="text-slate-300 mt-1">{status?.visionModel ?? overview.configuredVisionModel}</dd>
        </div>
        <div>
          <dt className="text-slate-500">OpenAI</dt>
          <dd className="mt-1">
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                overview.openaiConfigured
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700/50 text-slate-400'
              }`}
            >
              {overview.openaiConfigured
                ? `${t('settings.aiOptional')} — ${overview.openaiModel}`
                : t('settings.aiOpenaiDisabled')}
            </span>
          </dd>
        </div>
      </dl>

      <div
        className={`rounded-lg border p-3 mb-4 text-sm ${
          loading
            ? 'border-btp-600/30 bg-btp-900/40 text-slate-400'
            : status?.online
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
              : 'border-amber-500/30 bg-amber-950/20 text-amber-200'
        }`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('common.loading')}
          </span>
        ) : (
          status?.message ?? t('settings.aiOllamaOffline')
        )}
      </div>

      {!loading && !status?.online && (
        <p className="text-xs text-slate-500 mb-4">
          {t('settings.aiOllamaHelp')}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" size="sm" onClick={() => void loadStatus()} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          {t('settings.aiRefreshStatus')}
        </Button>
        <Button size="sm" onClick={() => void runTest()} disabled={testing}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {t('settings.aiTestConnection')}
        </Button>
      </div>

      {testResult && (
        <p
          className={`text-xs mt-3 p-2 rounded-lg ${
            testResult.ok ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'
          }`}
        >
          {testResult.ok
            ? `${t('settings.aiTestOk')} (${testResult.provider}${testResult.model ? ` — ${testResult.model}` : ''})`
            : `${t('settings.aiTestFailed')}: ${testResult.message}`}
        </p>
      )}
    </Card>
  );
}
