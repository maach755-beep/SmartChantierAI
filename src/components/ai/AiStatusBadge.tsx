import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Brain, Loader2 } from 'lucide-react';
import { useAiHealth } from '@/contexts/AiHealthContext';
import { loadAiPreferences } from '@/services/ai/aiPreferences';

export function AiStatusBadge() {
  const { t } = useTranslation();
  const { loading, health } = useAiHealth();
  const prefs = loadAiPreferences();

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 px-2 py-1 rounded-full bg-slate-800/60">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {t('dashboard.aiStatusChecking')}
      </span>
    );
  }

  const ok = health?.ok ?? false;
  const model = health?.ollama.textModel ?? prefs.textModel;
  const label = ok
    ? t('dashboard.aiStatusOnline', { model })
    : t('dashboard.aiStatusOffline');

  return (
    <Link
      to="/parametres-ia"
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
        ok
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
          : 'border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20'
      }`}
      title={health?.ollama.message}
    >
      <Brain className="w-3.5 h-3.5" />
      {label}
    </Link>
  );
}
