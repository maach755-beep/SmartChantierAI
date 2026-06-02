import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { dataStore } from '@/services/dataStore';
import type { AppNotification } from '@/types';

type NotificationContextValue = {
  notifications: AppNotification[];
  unreadCount: number;
  refresh: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const value = useMemo(() => {
    dataStore.init();
    void version;
    const notifications = dataStore.getNotifications();
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount,
      refresh,
      markRead: (id: string) => {
        dataStore.markNotificationRead(id);
        refresh();
      },
      markAllRead: () => {
        dataStore.markAllNotificationsRead();
        refresh();
      },
      panelOpen,
      setPanelOpen,
    };
  }, [version, refresh, panelOpen]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
