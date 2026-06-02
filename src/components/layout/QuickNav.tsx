import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';

interface QuickNavLink {
  to: string;
  labelKey: string;
}

interface QuickNavProps {
  links: QuickNavLink[];
}

export function QuickNav({ links }: QuickNavProps) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {links.map(({ to, labelKey }) => (
        <Link
          key={to}
          to={to}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-btp-800/60 border border-btp-500/30 text-btp-300 hover:text-white hover:border-btp-400 transition-colors"
        >
          {t(labelKey)}
          <ArrowRight className="w-3 h-3" />
        </Link>
      ))}
    </div>
  );
}
