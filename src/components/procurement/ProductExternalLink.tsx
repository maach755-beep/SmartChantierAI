import { useTranslation } from 'react-i18next';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { copyTextToClipboard, openExternalUrl } from '@/utils/openExternalUrl';

interface ProductExternalLinkProps {
  url: string;
}

export function ProductExternalLink({ url }: ProductExternalLinkProps) {
  const { t } = useTranslation();
  const { success } = useToast();

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(url);
    if (ok) success(t('search.urlCopied'));
  };

  const handleOpenExternal = () => {
    openExternalUrl(url);
  };

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-btp-600/30 bg-btp-950/40 p-3">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">
        {t('search.productUrlLabel')}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="url"
          readOnly
          value={url}
          aria-label={t('search.productUrlLabel')}
          className="flex-1 min-w-0 text-xs font-mono bg-btp-900/80 border border-btp-600/40 rounded-lg px-3 py-2 text-slate-300 focus:outline-none focus:border-cyan-500/50 select-all cursor-text"
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.currentTarget.select()}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => void handleCopy()}
          title={t('search.copyProductUrl')}
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">{t('search.copyProductUrl')}</span>
        </Button>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        className="w-full sm:w-auto"
        onClick={handleOpenExternal}
      >
        <ExternalLink className="w-4 h-4" />
        {t('search.openExternalBrowser')}
      </Button>
    </div>
  );
}
