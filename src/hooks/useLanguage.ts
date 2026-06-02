import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { setDocumentDirection } from '@/i18n';
import { setStorage } from '@/utils/storage';
import type { Lang } from '@/types';

export function useLanguage() {
  const { i18n, t } = useTranslation();
  const raw = i18n.language ?? 'fr';
  const lang = (raw.startsWith('ar') ? 'ar' : raw.startsWith('en') ? 'en' : 'fr') as Lang;

  useEffect(() => {
    setDocumentDirection(lang);
  }, [lang]);

  const setLang = useCallback(
    (l: Lang) => {
      i18n.changeLanguage(l);
      setStorage('lang', l);
      setDocumentDirection(l);
    },
    [i18n]
  );

  return { lang, setLang, t, isRtl: lang === 'ar' };
}
