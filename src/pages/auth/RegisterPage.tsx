import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAuthAction } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { UserRole } from '@/types/auth';

const inputClass =
  'w-full bg-btp-900/80 border border-btp-600/30 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 min-h-[44px]';

const ROLES: UserRole[] = ['client', 'site_manager', 'project_manager', 'admin'];

export function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signUp } = useAuthAction();
  const { success, error: toastError } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('client');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toastError(t('auth.passwordMin'));
      return;
    }
    setLoading(true);
    try {
      await signUp({ email, password, displayName, role }, toastError);
      success(t('auth.registerSuccess'));
      navigate('/');
    } catch {
      /* toast */
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 sm:p-8 border-btp-500/30">
      <h1 className="text-2xl font-bold text-white mb-1">{t('auth.registerTitle')}</h1>
      <p className="text-sm text-slate-400 mb-6">{t('auth.registerSubtitle')}</p>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-xs text-slate-400">{t('auth.displayName')}</label>
          <input
            required
            className={inputClass + ' mt-1'}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </div>
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
        <div>
          <label className="text-xs text-slate-400">{t('auth.password')}</label>
          <input
            type="password"
            required
            minLength={8}
            className={inputClass + ' mt-1'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-slate-400">{t('auth.role')}</label>
          <select
            className={inputClass + ' mt-1'}
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`auth.roles.${r}`)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="w-full min-h-[44px]" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {t('auth.createAccount')}
        </Button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-6">
        <Link to="/login" className="text-cyan-400 hover:underline">
          {t('auth.signIn')}
        </Link>
      </p>
    </Card>
  );
}
