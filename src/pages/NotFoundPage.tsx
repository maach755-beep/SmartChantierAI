import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <h1 className="text-6xl font-bold text-btp-400">404</h1>
      <p className="text-slate-400 mt-2 mb-6">{t('common.notFoundMessage')}</p>
      <Link to="/">
        <Button>
          <Home className="w-4 h-4" />
          {t('nav.dashboard')}
        </Button>
      </Link>
    </div>
  );
}
