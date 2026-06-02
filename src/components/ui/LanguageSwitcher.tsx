import { useLanguage } from '@/hooks/useLanguage';
import type { Lang } from '@/types';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLanguage();

  const options: { id: Lang; label: string }[] = [
    { id: 'fr', label: t('lang.fr') },
    { id: 'ar', label: t('lang.ar') },
    { id: 'en', label: t('lang.en') },
  ];

  return (
    <div className="flex rounded-lg overflow-hidden border border-btp-500/30 bg-btp-900/50">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => setLang(opt.id)}
          className={`px-3 py-1.5 text-xs font-medium transition-colors ${
            lang === opt.id ? 'bg-btp-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
