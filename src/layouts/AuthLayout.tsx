import { Outlet, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';

export function AuthLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-btp-950 via-btp-800 to-cyan-900/40 border-e border-btp-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-btp-600 to-cyan-600 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-white">{t('app.name')}</p>
            <p className="text-sm text-slate-400">{t('app.tagline')}</p>
          </div>
        </div>
        <p className="text-slate-300 text-lg max-w-md leading-relaxed">{t('auth.hero')}</p>
        <p className="text-xs text-slate-500">© SmartChantier AI — BTP France</p>
      </div>
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="flex justify-end p-4 lg:p-6">
          <LanguageSwitcher />
        </header>
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>
        <footer className="p-4 text-center text-xs text-slate-500">
          <Link to="/login" className="hover:text-cyan-400">
            {t('auth.backToLogin')}
          </Link>
        </footer>
      </div>
    </div>
  );
}
