import { useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, FileDown, Plus, FolderPlus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { QuickNav } from '@/components/layout/QuickNav';
import { PhotoTabs, type PhotoTabId } from '@/components/photos/PhotoTabs';
import { useDemoData } from '@/hooks/useDemoData';
import { dataStore } from '@/services/dataStore';
import { generatePhotoReportPdf } from '@/services/photoReportService';
import { useLanguage } from '@/hooks/useLanguage';
import type { PhotoPhase, SitePhoto } from '@/types';
import { formatPercent } from '@/utils/format';

const phaseVariant: Record<PhotoPhase, 'blue' | 'green' | 'orange'> = {
  before: 'blue',
  after: 'green',
  progress: 'orange',
};

export function PhotoUploadPage() {
  const { t } = useTranslation();
  const { lang } = useLanguage();
  const { photos, albums, chantiers, refresh } = useDemoData();
  const [searchParams, setSearchParams] = useSearchParams();
  const chantierFilter = searchParams.get('chantier') ?? chantiers[0]?.id ?? '';
  const tab = (searchParams.get('tab') as PhotoTabId) || 'gallery';
  const fileRef = useRef<HTMLInputElement>(null);
  const [albumModal, setAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [uploadPhase, setUploadPhase] = useState<PhotoPhase>('progress');
  const [selectedAlbum, setSelectedAlbum] = useState('');

  const ch = chantiers.find((c) => c.id === chantierFilter);
  const projectAlbums = useMemo(
    () => albums.filter((a) => a.chantierId === chantierFilter),
    [albums, chantierFilter]
  );
  const projectPhotos = useMemo(
    () => photos.filter((p) => p.chantierId === chantierFilter),
    [photos, chantierFilter]
  );
  const timeline = useMemo(
    () => dataStore.getPhotoTimeline(chantierFilter),
    [chantierFilter]
  );

  const setTab = (id: PhotoTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', id);
    if (chantierFilter) next.set('chantier', chantierFilter);
    setSearchParams(next);
  };

  const upload = (file: File) => {
    if (!ch) return;
    const url = URL.createObjectURL(file);
    const photo = dataStore.addPhoto({
      chantierId: ch.id,
      chantierName: ch.name,
      room: t('photos.defaultRoom'),
      url,
      caption: file.name,
      phase: uploadPhase,
      uploadedBy: ch.manager,
      date: new Date().toISOString(),
      tags: ['upload', uploadPhase],
      fileSize: `${Math.round(file.size / 1024)} Ko`,
      albumId: selectedAlbum || undefined,
    });
    if (selectedAlbum) dataStore.addPhotoToAlbum(selectedAlbum, photo.id);
    dataStore.updateChantierProgressFromPhotos(ch.id, 1);
    refresh();
  };

  const createAlbum = () => {
    if (!ch || !newAlbumName.trim()) return;
    dataStore.createPhotoAlbum({
      name: newAlbumName.trim(),
      chantierId: ch.id,
      chantierName: ch.name,
      description: t('photos.albumDescDefault'),
    });
    setNewAlbumName('');
    setAlbumModal(false);
    refresh();
  };

  const exportPdf = () => {
    if (!ch) return;
    generatePhotoReportPdf({
      chantier: ch,
      photos: projectPhotos,
      albums: projectAlbums,
      comparisons: dataStore.getPhotoComparisons().filter((c) => c.chantierId === ch.id),
      lang,
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title={t('photos.title')}
        subtitle={t('photos.subtitle')}
        actions={
          <Button variant="secondary" size="sm" onClick={exportPdf} className="hidden sm:inline-flex">
            <FileDown className="w-4 h-4" />
            {t('photos.exportPdf')}
          </Button>
        }
      />
      <QuickNav
        links={[
          { to: '/photo-comparison', labelKey: 'nav.photoCompare' },
          { to: '/analyse-ia', labelKey: 'nav.aiAnalysis' },
          { to: '/projets', labelKey: 'nav.projects' },
        ]}
      />

      <Card className="mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <label className="flex-1 text-sm min-w-0">
            <span className="text-slate-500 block mb-1">{t('common.chantier')}</span>
            <select
              value={chantierFilter}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams);
                next.set('chantier', e.target.value);
                next.set('tab', tab);
                setSearchParams(next);
              }}
              className="w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2.5 text-white"
            >
              {chantiers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          {ch && (
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 mb-1">{t('photos.projectProgress')}</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-btp-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-btp-600 to-cyan-500 transition-all"
                    style={{ width: `${ch.progress}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-cyan-300 shrink-0">{formatPercent(ch.progress)}</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-1">{projectPhotos.length} {t('photos.photoCount')}</p>
            </div>
          )}
        </div>
      </Card>

      <PhotoTabs active={tab} onChange={setTab} />

      <div className="mt-4 sm:mt-6">
        {tab === 'gallery' && (
          <>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-4">
              <select
                value={uploadPhase}
                onChange={(e) => setUploadPhase(e.target.value as PhotoPhase)}
                className="rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-sm text-white"
              >
                <option value="progress">{t('photos.phaseProgress')}</option>
                <option value="before">{t('photos.phaseBefore')}</option>
                <option value="after">{t('photos.phaseAfter')}</option>
              </select>
              <select
                value={selectedAlbum}
                onChange={(e) => setSelectedAlbum(e.target.value)}
                className="rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-sm text-white flex-1 min-w-[140px]"
              >
                <option value="">{t('photos.noAlbum')}</option>
                {projectAlbums.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                }}
              />
              <Button onClick={() => fileRef.current?.click()} className="w-full sm:w-auto">
                <Camera className="w-4 h-4" />
                {t('photos.takePhoto')}
              </Button>
              <Button variant="secondary" onClick={() => fileRef.current?.click()} className="w-full sm:w-auto">
                <Upload className="w-4 h-4" />
                {t('photos.upload')}
              </Button>
              <Button variant="ghost" onClick={exportPdf} className="sm:hidden w-full">
                <FileDown className="w-4 h-4" />
                {t('photos.exportPdf')}
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {projectPhotos.map((p) => (
                <PhotoCard key={p.id} photo={p} t={t} />
              ))}
            </div>
            {projectPhotos.length === 0 && (
              <p className="text-center text-slate-500 py-12">{t('photos.empty')}</p>
            )}
          </>
        )}

        {tab === 'albums' && (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={() => setAlbumModal(true)}>
                <FolderPlus className="w-4 h-4" />
                {t('photos.createAlbum')}
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projectAlbums.map((album) => {
                const cover = photos.find((p) => p.id === album.coverPhotoId);
                const count = photos.filter((p) => album.photoIds.includes(p.id) || p.albumId === album.id).length;
                return (
                  <Card key={album.id} className="p-0 overflow-hidden">
                    {cover ? (
                      <img src={cover.url} alt="" className="w-full h-36 sm:h-40 object-cover" />
                    ) : (
                      <div className="w-full h-36 bg-btp-800 flex items-center justify-center text-slate-600 text-sm">
                        {t('photos.noCover')}
                      </div>
                    )}
                    <div className="p-3 sm:p-4">
                      <h3 className="font-semibold text-white text-sm truncate">{album.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{album.description}</p>
                      <p className="text-xs text-cyan-500/80 mt-2">{count} {t('photos.photoCount')}</p>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}

        {tab === 'timeline' && (
          <ol className="relative border-s border-btp-600/40 ms-3 space-y-8 max-w-2xl">
            {timeline.map((ev) => (
              <li key={ev.id} className="ms-6 flex flex-col sm:flex-row gap-3 sm:gap-4">
                <img
                  src={ev.photoUrl}
                  alt=""
                  className="w-full sm:w-28 h-24 sm:h-20 object-cover rounded-lg border border-btp-600/30 shrink-0"
                />
                <div className="min-w-0">
                  <Badge variant={phaseVariant[ev.phase]}>{t(`photos.phase_${ev.phase}`)}</Badge>
                  <p className="text-sm font-medium text-white mt-1">{ev.title}</p>
                  <p className="text-xs text-slate-500">{new Date(ev.date).toLocaleString()}</p>
                  {ev.type === 'comparison' && (
                    <span className="text-[10px] text-amber-400">{t('photos.timelineCompare')}</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        {tab === 'compare' && (
          <Card>
            <p className="text-sm text-slate-400 mb-4">{t('photos.compareHint')}</p>
            <Link to={`/photo-comparison?chantier=${chantierFilter}`}>
              <Button>
                {t('photos.openCompare')}
              </Button>
            </Link>
          </Card>
        )}
      </div>

      <Modal open={albumModal} onClose={() => setAlbumModal(false)} title={t('photos.createAlbum')}>
        <label className="block text-sm mb-4">
          <span className="text-slate-400">{t('photos.albumName')}</span>
          <input
            className="mt-1 w-full rounded-lg bg-btp-800 border border-btp-600/40 px-3 py-2 text-white"
            value={newAlbumName}
            onChange={(e) => setNewAlbumName(e.target.value)}
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setAlbumModal(false)}>{t('common.cancel')}</Button>
          <Button onClick={createAlbum}><Plus className="w-4 h-4" />{t('common.save')}</Button>
        </div>
      </Modal>
    </div>
  );
}

function PhotoCard({ photo, t }: { photo: SitePhoto; t: (k: string) => string }) {
  return (
    <Card className="p-0 overflow-hidden group">
      <img src={photo.url} alt="" className="w-full aspect-[4/3] object-cover" loading="lazy" />
      <div className="p-2 sm:p-3">
        <p className="text-xs sm:text-sm font-medium text-white truncate">{photo.caption ?? photo.room}</p>
        <p className="text-[10px] sm:text-xs text-slate-500">{new Date(photo.date).toLocaleDateString()}</p>
        <div className="flex flex-wrap gap-1 mt-1.5">
          <Badge variant={phaseVariant[photo.phase]}>{t(`photos.phase_${photo.phase}`)}</Badge>
          {photo.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="gray">{tag}</Badge>
          ))}
        </div>
      </div>
    </Card>
  );
}
