import { useTranslation } from 'react-i18next';
import { PageQuickNav } from '@/components/layout/PageQuickNav';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { Button } from '@/components/ui/Button';
import { dataStore, DEMO_DATA_VERSION } from '@/services/dataStore';
import { useToast } from '@/contexts/ToastContext';
import { ROLE_LABELS, type UserRole } from '@/types/auth';
import { useLanguage } from '@/hooks/useLanguage';
import { APP_COUNTRY, APP_CURRENCY } from '@/config/france';
import { getRealWebSearchStatusLabel, isRealWebSearchEnabled } from '@/services/realSearch/config';
import { AiSettingsPanel } from '@/components/settings/AiSettingsPanel';

const ROLES: UserRole[] = ['admin', 'project_manager', 'site_manager', 'client'];

export function SettingsPage() {
  const { t } = useTranslation();
  const { confirm, success } = useToast();
  const { lang } = useLanguage();

  const resetDemo = async () => {
    const ok = await confirm({
      title: t('settings.resetConfirmTitle'),
      message: t('settings.resetConfirmMessage'),
      confirmLabel: t('settings.resetDemo'),
      danger: true,
    });
    if (!ok) return;
    dataStore.resetDemo();
    success(t('notifications.saved'));
    window.location.reload();
  };

  return (
    <div>
      <PageHeader title={t('settings.title')} />
      <PageQuickNav preset="full" />

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
        <Card title={t('settings.locale')}>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t('settings.country')}</dt>
              <dd className="text-white font-medium">{APP_COUNTRY}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">{t('settings.currency')}</dt>
              <dd className="text-white font-medium">{APP_CURRENCY} (€)</dd>
            </div>
            <p className="text-xs text-slate-500 pt-1">{t('settings.localeHint')}</p>
          </dl>
        </Card>

        <Card title={t('settings.language')}>
          <LanguageSwitcher />
        </Card>

        <AiSettingsPanel />

        <Card title={t('settings.realSearchTitle')}>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between gap-4 items-center">
              <dt className="text-slate-500">{t('settings.realSearchLabel')}</dt>
              <dd>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isRealWebSearchEnabled()
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {getRealWebSearchStatusLabel(t)}
                </span>
              </dd>
            </div>
            <p className="text-xs text-slate-500 pt-1">{t('settings.realSearchHint')}</p>
          </dl>
        </Card>

        <Card title={t('settings.demoMode')}>
          <p className="text-sm text-slate-400 mb-4">
            {t('settings.demoPersist').replace('{{version}}', String(DEMO_DATA_VERSION))}
          </p>
          <Button variant="danger" onClick={() => void resetDemo()}>
            {t('settings.resetDemo')}
          </Button>
        </Card>

        <Card title={t('settings.rolesFuture')} className="md:col-span-2">
          <p className="text-sm text-slate-500 mb-3">{t('settings.rolesHint')}</p>
          <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-400">
            {ROLES.map((role) => (
              <li key={role} className="px-3 py-2 rounded-lg bg-btp-900/50 border border-btp-600/20">
                {lang === 'ar' ? ROLE_LABELS[role].ar : lang === 'en' ? ROLE_LABELS[role].en : ROLE_LABELS[role].fr}
              </li>
            ))}
          </ul>
        </Card>

        <Card title={t('settings.mobileApi')} className="md:col-span-2">
          <p className="text-sm text-slate-400 mb-3">{t('settings.mobileApiHint')}</p>
          <ul className="text-xs text-slate-500 font-mono space-y-1">
            <li>GET /api/v1/projects</li>
            <li>GET /api/v1/sites/active | delayed | at-risk</li>
            <li>GET /api/v1/materials/requests</li>
            <li>GET /api/v1/documents/search?q=</li>
            <li>GET /api/v1/notifications</li>
          </ul>
          <p className="text-xs text-amber-500/80 mt-3">{t('settings.apiReady')}</p>
        </Card>

        <Card title={t('settings.profile')}>
          <p className="text-sm text-slate-300">{t('settings.companyName')}</p>
          <p className="text-xs text-slate-500 mt-1">{t('settings.companyLocation')}</p>
          <p className="text-xs text-cyan-500/80 mt-2">{t('settings.franceOnly')}</p>
        </Card>

        <Card title={t('settings.notifications')}>
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <input type="checkbox" defaultChecked className="rounded" />
            {t('settings.alertRisks')}
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-400 mt-2">
            <input type="checkbox" defaultChecked className="rounded" />
            {t('settings.alertField')}
          </label>
        </Card>
      </div>
    </div>
  );
}
