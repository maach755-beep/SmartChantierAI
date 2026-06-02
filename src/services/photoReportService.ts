import { exportToPdf } from '@/services/exportService';
import type { Chantier, PhotoComparisonRecord, PhotoAlbum, SitePhoto } from '@/types';

export function generatePhotoReportPdf(opts: {
  chantier: Chantier;
  photos: SitePhoto[];
  albums: PhotoAlbum[];
  comparisons: PhotoComparisonRecord[];
  lang: 'fr' | 'ar' | 'en';
}): void {
  const { chantier, photos, albums, comparisons, lang } = opts;
  const isAr = lang === 'ar';
  const isEn = lang === 'en';
  const title = isAr
    ? `تقرير صور الورشة — ${chantier.name}`
    : isEn
      ? `Site photo report — ${chantier.name}`
      : `Rapport photos chantier — ${chantier.name}`;

  const sections = [
    {
      heading: isAr ? 'معلومات المشروع' : 'Informations projet',
      lines: [
        isAr ? `العميل: ${chantier.client}` : `Client: ${chantier.client}`,
        isAr ? `التقدم: ${chantier.progress}%` : `Progression: ${chantier.progress}%`,
        isAr ? `المسؤول: ${chantier.manager}` : `Responsable: ${chantier.manager}`,
        isAr ? `العنوان: ${chantier.address}` : `Adresse: ${chantier.address}`,
      ],
    },
    {
      heading: isAr ? 'الألبومات' : 'Albums',
      lines: albums.length
        ? albums.map((a) => `${a.name} (${a.photoIds.length} ${isAr ? 'صور' : 'photos'})`)
        : [isAr ? 'لا ألبومات' : 'Aucun album'],
    },
    {
      heading: isAr ? 'آخر الصور' : 'Dernières photos',
      lines: photos.slice(0, 12).map(
        (p) =>
          `${new Date(p.date).toLocaleDateString()} — ${p.room} [${p.phase}] — ${p.uploadedBy}`
      ),
    },
    {
      heading: isAr ? 'مقارنات قبل/بعد' : 'Comparaisons avant/après',
      lines: comparisons.length
        ? comparisons.flatMap((c) => [
            `${new Date(c.date).toLocaleDateString()} — score ${c.result.differenceScore}%`,
            ...c.result.modificationsDetected.map((m) => `  • ${m}`),
            ...c.result.alerts.map((a) => `  ! ${a}`),
          ])
        : [isAr ? 'لا مقارنات' : 'Aucune comparaison enregistrée'],
    },
    {
      heading: isAr ? 'ملخص الذكاء الاصطناعي' : 'Synthèse IA',
      lines: comparisons[0]
        ? [
            ...(isAr
              ? ['تعديلات:', 'تأخيرات:', 'أعمال ناقصة:']
              : ['Modifications:', 'Retards:', 'Travaux manquants:']),
            ...comparisons[0].result.modificationsDetected,
            ...comparisons[0].result.delayDetected,
            ...comparisons[0].result.missingWork,
          ]
        : [isAr ? 'قم بتحليل مقارنة للحصول على التوصيات' : 'Effectuez une comparaison pour obtenir les recommandations'],
    },
  ];

  void exportToPdf(title, sections);
}
