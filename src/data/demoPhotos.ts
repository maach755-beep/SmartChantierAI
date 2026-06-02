import type { PhotoAlbum, PhotoComparisonRecord, PhotoTimelineEntry, SitePhoto } from '@/types';
import { demoChantiers } from './demoData';
import { demoSitePhotos } from './demoMaterials';

export const demoPhotosEnriched: SitePhoto[] = demoSitePhotos;

export const demoPhotoAlbums: PhotoAlbum[] = demoChantiers.slice(0, 8).flatMap((ch, ci) =>
  ['Avancement mensuel', 'Avant / Après travaux', 'Contrôle qualité'].map((name, ai) => {
    const albumId = `album_${ch.id}_${ai}`;
    const photos = demoPhotosEnriched.filter((p) => p.chantierId === ch.id && p.albumId === albumId);
    return {
      id: albumId,
      name: `${name} — ${ch.name}`,
      chantierId: ch.id,
      chantierName: ch.name,
      description: `Album ${name.toLowerCase()} du chantier ${ch.name}`,
      coverPhotoId: photos[0]?.id,
      photoIds: photos.map((p) => p.id),
      createdAt: new Date(Date.now() - (ci * 10 + ai) * 86400000).toISOString(),
    };
  })
);

const firstCh = demoChantiers[0];
const before = demoPhotosEnriched.find((p) => p.chantierId === firstCh.id && p.phase === 'before');
const after = demoPhotosEnriched.find((p) => p.chantierId === firstCh.id && p.phase === 'after');

export const demoPhotoComparisons: PhotoComparisonRecord[] = before && after
  ? [
      {
        id: 'pcmp_1',
        chantierId: firstCh.id,
        chantierName: firstCh.name,
        oldPhotoId: before.id,
        newPhotoId: after.id,
        oldPhotoUrl: before.url,
        newPhotoUrl: after.url,
        date: new Date().toISOString(),
        result: {
          progressDetected: ['Cloisons BA13 terminées', 'Électricité gainée — salon'],
          delayDetected: ['Retard pose carrelage cuisine — 4 jours'],
          materialChangeDetected: ['Carrelage 60x60 → 80x80 non déclaré'],
          modificationsDetected: ['Cloison cuisine déplacée de 40 cm', 'Ouverture mur porteur signalée'],
          completedWork: ['Cloisons posées', 'Enduit murs R+1'],
          missingWork: ['Pose carrelage sol cuisine', 'Peinture plafond salon'],
          alerts: ['Modification non déclarée détectée', 'Écart plan vs réalité — cuisine'],
          differenceScore: 34,
        },
      },
    ]
  : [];

export function buildPhotoTimeline(photos: SitePhoto[]): PhotoTimelineEntry[] {
  return [...photos]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((p) => ({
      id: `ptl_${p.id}`,
      chantierId: p.chantierId,
      date: p.date,
      title: p.caption ?? p.room,
      photoId: p.id,
      photoUrl: p.url,
      phase: p.phase,
      type: 'upload' as const,
    }));
}

export const demoPhotoTimeline: PhotoTimelineEntry[] = buildPhotoTimeline(demoPhotosEnriched);
