import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import {
  authMode,
  resolveSession,
  signIn as authSignIn,
  signOut as authSignOut,
  signUp as authSignUp,
  requestPasswordReset,
  type RegisterInput,
} from '@/services/auth/authService';
import type { AuthUser } from '@/types/auth';
import { getErrorMessage } from '@/utils/asyncError';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  mode: 'supabase' | 'local';
  supabaseReady: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const session = await resolveSession();
      setUser(session);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => sub.subscription.unsubscribe();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const u = await authSignIn(email, password);
    setUser(u);
  }, []);

  const signUp = useCallback(async (input: RegisterInput) => {
    const u = await authSignUp(input);
    setUser(u);
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await requestPasswordReset(email);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      mode: authMode(),
      supabaseReady: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [user, loading, signIn, signUp, signOut, resetPassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth requires AuthProvider');
  return ctx;
}

export function useAuthAction() {
  const { signIn, signUp, signOut, resetPassword } = useAuth();
  return {
    signIn: async (email: string, password: string, onError: (m: string) => void) => {
      try {
        await signIn(email, password);
      } catch (e) {
        onError(getErrorMessage(e, 'Connexion impossible'));
        throw e;
      }
    },
    signUp: async (input: RegisterInput, onError: (m: string) => void) => {
      try {
        await signUp(input);
      } catch (e) {
        onError(getErrorMessage(e, 'Inscription impossible'));
        throw e;
      }
    },
    signOut,
    resetPassword: async (email: string, onError: (m: string) => void) => {
      try {
        await resetPassword(email);
      } catch (e) {
        onError(getErrorMessage(e, 'Réinitialisation impossible'));
        throw e;
      }
    },
  };
}
