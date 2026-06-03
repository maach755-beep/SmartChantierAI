import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  syncSystemNotifications,
  LOCAL_USER_ID,
} from '@/services/saas/phase2Data';
import { useAuth } from '@/contexts/AuthContext';
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
  const { user } = useAuth();
  const userId = user?.id ?? LOCAL_USER_ID;
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const refresh = useCallback(async () => {
    await syncSystemNotifications(userId);
    setNotifications(await listNotifications(userId));
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(() => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    return {
      notifications,
      unreadCount,
      refresh: () => void refresh(),
      markRead: (id: string) => {
        void markNotificationRead(id, userId).then(() => refresh());
      },
      markAllRead: () => {
        void markAllNotificationsRead(userId).then(() => refresh());
      },
      panelOpen,
      setPanelOpen,
    };
  }, [notifications, refresh, userId, panelOpen]);

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
