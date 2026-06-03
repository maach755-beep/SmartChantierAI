import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuth, useAuthAction } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[44px]';

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const { supabaseReady } = useAuth();
  const { resetPassword } = useAuthAction();
  const { success, error: toastError } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await resetPassword(email, toastError);
      setSent(true);
      success(supabaseReady ? t('auth.resetEmailSent') : t('auth.resetDemoSent'));
    } catch {
      /* toast */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 border-btp-500/30">
      <h1 className="text-2xl font-bold text-white mb-1">{t('auth.forgotTitle')}</h1>
      <p className="text-sm text-slate-400 mb-6">{t('auth.forgotSubtitle')}</p>
      {sent ? (
        <p className="text-sm text-emerald-400">{t('auth.checkInbox')}</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs text-slate-400">{t('auth.email')}</label>
            <input
              type="email"
              required
              className={inputClass + ' mt-1'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {t('auth.sendReset')}
          </Button>
        </form>
      )}
      <p className="text-center text-sm text-slate-500 mt-6">
        <Link to="/login" className="text-cyan-400 hover:underline">
          {t('auth.backToLogin')}
        </Link>
      </p>
    </Card>
  );
}
