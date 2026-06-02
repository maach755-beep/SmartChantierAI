import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getStorage, setStorage } from '@/utils/storage';

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => getStorage('sidebar_collapsed', false));

  useEffect(() => {
    setStorage('sidebar_collapsed', collapsed);
    document.documentElement.style.setProperty('--sidebar-width', collapsed ? '4.5rem' : '16rem');
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const value = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
}
