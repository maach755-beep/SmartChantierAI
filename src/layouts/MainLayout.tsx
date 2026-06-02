import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { NotificationPanel } from '@/components/layout/NotificationPanel';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNotifications } from '@/contexts/NotificationContext';

export function MainLayout() {
  const { t } = useTranslation();
  const { collapsed } = useSidebar();
  const { unreadCount, setPanelOpen } = useNotifications();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-[margin] duration-300 ${
          collapsed ? 'lg:ms-0' : ''
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 lg:px-6 py-4 bg-btp-950/90 backdrop-blur-md border-b border-btp-500/20">
          <div className="flex-1 min-w-0 ps-12 lg:ps-0" />
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-amber-400/90 px-2 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20">
              {t('app.demo')}
            </span>
            <button
              type="button"
              className="relative p-2 rounded-lg hover:bg-btp-800/50 text-slate-400"
              aria-label={t('notifPanel.title')}
              onClick={() => setPanelOpen(true)}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 end-1 w-4 h-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      <NotificationPanel />
    </div>
  );
}
