import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchAiHealth, type AiHealthPayload } from '@/services/ai/aiHealth';
import { clearOllamaStatusCache } from '@/services/ai/ollamaClient';

type AiHealthContextValue = {
  loading: boolean;
  health: AiHealthPayload | null;
  refresh: (force?: boolean) => Promise<void>;
};

const AiHealthContext = createContext<AiHealthContextValue | null>(null);

export function AiHealthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<AiHealthPayload | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    try {
      if (force) clearOllamaStatusCache();
      setHealth(await fetchAiHealth(force));
    } catch {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t0 = window.setTimeout(() => void refresh(true), 0);
    const onPrefs = () => void refresh(true);
    window.addEventListener('smartchantier:ai-prefs-changed', onPrefs);
    return () => {
      clearTimeout(t0);
      window.removeEventListener('smartchantier:ai-prefs-changed', onPrefs);
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ loading, health, refresh }),
    [loading, health, refresh]
  );

  return <AiHealthContext.Provider value={value}>{children}</AiHealthContext.Provider>;
}

export function useAiHealth(): AiHealthContextValue {
  const ctx = useContext(AiHealthContext);
  if (!ctx) {
    throw new Error('useAiHealth must be used within AiHealthProvider');
  }
  return ctx;
}
