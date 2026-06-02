import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

export function ErrorBlock({
  message,
  onRetry,
  retryLabel,
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
      <p className="text-sm text-slate-300">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {retryLabel ?? 'Réessayer'}
        </Button>
      )}
    </div>
  );
}
