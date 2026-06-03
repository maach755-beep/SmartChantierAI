import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth, useAuthAction } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[44px]';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mode, supabaseReady } = useAuth();
  const { signIn } = useAuthAction();
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState('admin@smartchantier.fr');
  const [password, setPassword] = useState('Admin123!');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(email, password, toastError);
      success(t('auth.loginSuccess'));
      navigate('/');
    } catch {
      /* toast handled */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 border-btp-500/30 shadow-2xl">
      <h1 className="text-2xl font-bold text-white mb-1">{t('auth.loginTitle')}</h1>
      <p className="text-sm text-slate-400 mb-6">{t('auth.loginSubtitle')}</p>
      {!supabaseReady && (
        <p className="text-xs text-amber-400/90 mb-4 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
          {t('auth.demoModeHint')}
        </p>
      )}
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-400">{t('auth.email')}</label>
          <input
            type="email"
            required
            autoComplete="email"
            className={inputClass + ' mt-1'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">{t('auth.password')}</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            className={inputClass + ' mt-1'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-xs text-cyan-400 hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>
        <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
          {loading ? t('common.loading') : t('auth.signIn')}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-cyan-400 hover:underline">
          {t('auth.register')}
        </Link>
      </p>
      <p className="text-[10px] text-slate-600 mt-4 text-center">
        {t('auth.modeLabel')}: {mode === 'supabase' ? 'Supabase' : t('auth.localMode')}
      </p>
    </Card>
  );
}
