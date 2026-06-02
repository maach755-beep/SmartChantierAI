import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

type ToastVariant = 'success' | 'error' | 'info';

type ToastItem = { id: string; message: string; variant: ToastVariant };

type ConfirmOptions = {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<(ConfirmOptions & { resolve: (v: boolean) => void }) | null>(
    null
  );

  const dismiss = useCallback((id: string) => {
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = crypto.randomUUID();
      setToasts((list) => [...list.slice(-4), { id, message, variant }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const success = useCallback((message: string) => toast(message, 'success'), [toast]);
  const error = useCallback((message: string) => toast(message, 'error'), [toast]);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({ ...options, resolve });
    });
  }, []);

  const closeConfirm = (value: boolean) => {
    confirmState?.resolve(value);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ toast, success, error, confirm }}>
      {children}
      <div className="fixed bottom-4 end-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-start gap-2 px-4 py-3 rounded-lg border shadow-lg text-sm ${
              item.variant === 'success'
                ? 'bg-emerald-950/95 border-emerald-500/40 text-emerald-100'
                : item.variant === 'error'
                  ? 'bg-red-950/95 border-red-500/40 text-red-100'
                  : 'bg-btp-900/95 border-btp-500/40 text-slate-200'
            }`}
          >
            {item.variant === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
            {item.variant === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            {item.variant === 'info' && <Info className="w-4 h-4 shrink-0 mt-0.5" />}
            <span className="flex-1">{item.message}</span>
            <button type="button" className="opacity-70 hover:opacity-100" onClick={() => dismiss(item.id)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <Modal
        open={!!confirmState}
        onClose={() => closeConfirm(false)}
        title={confirmState?.title ?? ''}
      >
        <p className="text-sm text-slate-400 mb-4">{confirmState?.message}</p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => closeConfirm(false)}>
            {confirmState?.cancelLabel ?? t('common.cancel')}
          </Button>
          <Button
            variant={confirmState?.danger ? 'danger' : 'primary'}
            onClick={() => closeConfirm(true)}
          >
            {confirmState?.confirmLabel ?? t('common.confirm')}
          </Button>
        </div>
      </Modal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requires ToastProvider');
  return ctx;
}
