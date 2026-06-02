import { useTranslation } from 'react-i18next';
import { AlertTriangle, Bell, Camera, Clock, Package, X } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { Badge } from '@/components/ui/Badge';
import type { NotificationType } from '@/types';

const typeIcon: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  delay: Clock,
  risk: AlertTriangle,
  material: Package,
  photo: Camera,
  project: Bell,
  system: Bell,
};

export function NotificationPanel() {
  const { t } = useTranslation();
  const { notifications, panelOpen, setPanelOpen, markRead, markAllRead, unreadCount } = useNotifications();

  if (!panelOpen) return null;

  return (
    <>
      <button type="button" className="fixed inset-0 z-40 bg-black/40" aria-label={t('common.close')} onClick={() => setPanelOpen(false)} />
      <aside className="fixed top-0 end-0 z-50 h-full w-full max-w-md bg-btp-950 border-s border-btp-500/30 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-4 border-b border-btp-600/30">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-btp-300" />
            <h2 className="font-semibold text-white">{t('notifPanel.title')}</h2>
            {unreadCount > 0 && <Badge variant="orange">{unreadCount}</Badge>}
          </div>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button type="button" onClick={markAllRead} className="text-xs text-cyan-400 hover:underline">
                {t('notifPanel.markAll')}
              </button>
            )}
            <button type="button" onClick={() => setPanelOpen(false)} className="p-1 rounded hover:bg-btp-800 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <ul className="flex-1 overflow-y-auto divide-y divide-btp-600/20">
          {notifications.length === 0 ? (
            <li className="p-6 text-center text-slate-500">{t('notifPanel.empty')}</li>
          ) : (
            notifications.map((n) => {
              const Icon = typeIcon[n.type];
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => markRead(n.id)}
                    className={`w-full text-start px-4 py-3 hover:bg-btp-900/80 transition-colors ${!n.read ? 'bg-btp-800/30' : ''}`}
                  >
                    <div className="flex gap-3">
                      <Icon className={`w-5 h-5 shrink-0 ${n.level === 'red' ? 'text-red-400' : n.level === 'orange' ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white text-sm">{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
                        {n.chantierName && <p className="text-xs text-cyan-500/80 mt-1">{n.chantierName}</p>}
                        <p className="text-[10px] text-slate-600 mt-1">{new Date(n.date).toLocaleString()}</p>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </aside>
    </>
  );
}
