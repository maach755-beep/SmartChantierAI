import { useTranslation } from 'react-i18next';
import { FolderOpen, GitCompare, Images, Clock } from 'lucide-react';

export type PhotoTabId = 'gallery' | 'albums' | 'timeline' | 'compare';

const tabs: { id: PhotoTabId; icon: React.ComponentType<{ className?: string }>; labelKey: string }[] = [
  { id: 'gallery', icon: Images, labelKey: 'photos.tabGallery' },
  { id: 'albums', icon: FolderOpen, labelKey: 'photos.tabAlbums' },
  { id: 'timeline', icon: Clock, labelKey: 'photos.tabTimeline' },
  { id: 'compare', icon: GitCompare, labelKey: 'photos.tabCompare' },
];

type PhotoTabsProps = {
  active: PhotoTabId;
  onChange: (tab: PhotoTabId) => void;
};

export function PhotoTabs({ active, onChange }: PhotoTabsProps) {
  const { t } = useTranslation();
  return (
    <nav className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin" aria-label={t('photos.title')}>
      {tabs.map(({ id, icon: Icon, labelKey }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={`flex items-center gap-2 shrink-0 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            active === id
              ? 'bg-gradient-to-r from-btp-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/10'
              : 'bg-btp-800/60 text-slate-400 hover:text-white'
          }`}
        >
          <Icon className="w-4 h-4" />
          <span className="whitespace-nowrap">{t(labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}
