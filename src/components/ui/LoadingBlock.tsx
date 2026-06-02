import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LoadingBlock({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      <p className="text-sm text-slate-500">{label ?? t('common.loading')}</p>
    </div>
  );
}
