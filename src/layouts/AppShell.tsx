import { SidebarProvider } from '@/contexts/SidebarContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { MainLayout } from './MainLayout';

/** Authenticated app shell: sidebar, notifications, main layout. */
export function AppShell() {
  return (
    <SidebarProvider>
      <NotificationProvider>
        <MainLayout />
      </NotificationProvider>
    </SidebarProvider>
  );
}
