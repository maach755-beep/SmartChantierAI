import { demoPlanRooms } from '@/data/demoData';
import { delayMs } from '@/utils/format';
import { dataStore } from './dataStore';

function detectIntent(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('où') || m.includes('en est') || m.includes('أين') || m.includes('تقدم')) return 'progress';
  if (m.includes('retard') || m.includes('تأخير')) return 'delay';
  if (m.includes('contrat') || m.includes('عقد')) return 'contract';
  if (m.includes('matériau') || m.includes('مادة') || m.includes('مواد')) return 'materials';
  if (m.includes('risque') || m.includes('خطر')) return 'risks';
  if (m.includes('ouvrier') || m.includes('absent') || m.includes('عامل')) return 'workers';
  if (m.includes('rapport') || m.includes('تقرير')) return 'report';
  if (m.includes('fournisseur') || m.includes('مورد')) return 'suppliers';
  return 'progress';
}

function pickChantier(message: string) {
  const chantiers = dataStore.getChantiers();
  const found = chantiers.find((c) => message.toLowerCase().includes(c.name.toLowerCase()));
  return found ?? chantiers[0];
}

export async function askAssistant(message: string, lang: 'fr' | 'ar' | 'en'): Promise<string> {
  await delayMs(800 + Math.random() * 700);
  const intent = detectIntent(message);
  const ch = pickChantier(message);
  const budgetPct = Math.round((ch.budgetConsumed / ch.budgetPlanned) * 100);
  const timeSave = ch.status === 'delayed' ? '2 à 4 jours' : '1 jour';
  const costSave = ch.riskLevel === 'red' ? '15 000 – 25 000 € HT' : '5 000 – 12 000 € HT';

  if (lang === 'ar') {
    return [
      `**${ch.name}** — ${ch.progress}% تقدم، ميزانية ${budgetPct}%`,
      '',
      '**خطة عمل (48 ساعة)**',
      `1. [عاجل] طلب المواد الناقصة — المسؤول: المشتريات — توفير وقت: ${timeSave}`,
      `2. [عالية] إعادة جدولة المهام المتأخرة — المسؤول: ${ch.manager} — توفير: ${costSave}`,
      '3. [متوسطة] نقطة يومية مع الفريق — المسؤول: رئيس الورشة',
      '',
      `**الأولوية:** ${ch.riskLevel === 'red' ? 'عاجل' : 'عالية'}`,
    ].join('\n');
  }

  const frBlocks: Record<string, string[]> = {
    progress: [
      `**${ch.name}** — ${ch.progress}% d'avancement, budget consommé ${budgetPct}%, statut ${ch.status}.`,
      '',
      '**Plan d\'action (48h)**',
      `1. [Urgent] Valider jalons semaine — Responsable: ${ch.manager} — Gain temps: ${timeSave}`,
      '2. [Haute] Point photo zones critiques — Responsable: Chef de chantier',
      '3. [Normale] Mise à jour planning client — Responsable: Conducteur de travaux',
      '',
      `**Économie estimée:** ${costSave} (retards évités, reprises réduites)`,
      `**Priorité globale:** ${ch.riskLevel === 'red' ? 'Urgent' : ch.status === 'delayed' ? 'Haute' : 'Normale'}`,
    ],
    delay: [
      `Retard confirmé sur **${ch.name}** (~${ch.delayDays} jours vs planning).`,
      '',
      '**Actions concrètes**',
      '1. [Urgent] Débloquer tâches cloison/plomberie — Resp: Conducteur de travaux — Gain: 3 j',
      '2. [Haute] Relance fournisseur carrelage (Point P / BigMat) — Resp: Achats — Gain: 8 000 € HT',
      '3. [Haute] Réaffecter 2 ouvriers zone critique — Resp: Chef de chantier',
      '',
      `**Responsable suivi:** ${ch.manager}`,
    ],
    materials: [
      '**Matériaux manquants détectés (démo)**',
      '• Carrelage 60x60 — 120 m² — commande sous 48h',
      '• Colle flexible C2 — 8 sacs',
      '• Peinture mate RAL 9010 — 25 L',
      '',
      '**Plan**',
      '1. [Urgent] Bon de commande — Achats — Gain temps: 3 j',
      `2. [Haute] Vérifier stock chantier ${ch.name} — Chef de chantier`,
      '',
      `**Économie:** ${costSave} si commande groupée`,
    ],
    risks: [
      `**Risques sur ${ch.name}** (niveau ${ch.riskLevel})`,
      '• Dépassement budget possible (+5 à 10%)',
      '• Retard fournisseur matériaux',
      '• Tâches bloquées sans validation client',
      '',
      '**Actions**',
      '1. [Urgent] Brief direction — Direction — Décision avenant',
      '2. [Haute] Check-list sécurité quotidienne — Chef de chantier',
    ],
    contract: [
      `Conformité contrat estimée: **87%** sur ${ch.name}.`,
      '2 avenants en attente de signature.',
      '',
      '**Action:** [Urgent] Valider modifications client avant exécution — Resp: Administration — Gain: 12 000 € HT',
    ],
    workers: [
      '**Effectif:** 43/50 présents (7 absents).',
      '',
      '**Actions**',
      '1. [Haute] Réorganiser équipe finitions — Chef de chantier — Gain: 1,5 j',
      '2. [Normale] Relance absences non justifiées — RH / Direction',
    ],
    report: [
      `Rapport chantier **${ch.name}** prêt (mode démo).`,
      'Sections: avancement, budget, risques, matériaux, pointage.',
      '**Resp:** Assistant MO → validation Direction',
    ],
    suppliers: [
      '**Fournisseurs à surveiller:** Matériaux Pro BTP, Carrelage Express.',
      '',
      '**Action:** [Urgent] Appel livraison 06h — Achats — Gain: 2 j retard évités',
    ],
  };

  const lines = frBlocks[intent] ?? frBlocks.progress;
  if (lang === 'en') {
    return lines.map((l) => l.replace('Responsable', 'Owner').replace('Urgent', 'Urgent')).join('\n');
  }
  return lines.join('\n');
}

export async function analyzePlan(
  fileType: 'pdf' | 'jpg' | 'png' = 'pdf'
): Promise<{
  rooms: typeof demoPlanRooms;
  legends: string[];
  levels: string[];
  fileType: string;
}> {
  await delayMs(1800 + (fileType === 'pdf' ? 400 : 0));
  const suffix = fileType === 'pdf' ? ' (OCR PDF)' : fileType === 'jpg' ? ' (scan JPG)' : ' (scan PNG)';
  return {
    fileType,
    rooms: demoPlanRooms.map((r, i) => ({
      ...r,
      observation: `${r.observation}${suffix}`,
      quantity: r.quantity + (fileType === 'pdf' ? 0 : i % 2),
    })),
    legends: [
      'S1 — Carrelage grès cérame 60x60 (beige)',
      'S2 — Parquet chêne zones séjour',
      'S3 — Résine / zones techniques',
      'S4 — À vérifier — légende partielle',
    ],
    levels: ['RDC', 'R+1', 'R+2', 'Terrasse'],
  };
}

export async function runOcrAttendance(): Promise<import('@/types').AttendanceRecord[]> {
  await delayMs(2500);
  return dataStore.getAttendance();
}

export async function analyzeFieldPhoto(): Promise<NonNullable<import('@/types').FieldUpdate['aiAnalysis']>> {
  await delayMs(1500);
  return {
    modificationDetected: true,
    affectedRoom: 'Cuisine',
    budgetImpact: 4500,
    delayImpact: 2,
    materialImpact: 'Carrelage 80x80 — changement de référence',
    riskImpact: 'orange',
  };
}

export async function runFullSiteAnalysis(chantierName?: string): Promise<import('@/types').AiAnalysisResult> {
  await delayMs(2200);
  const compare = await comparePhotos();
  return {
    modifications: compare.alerts.filter((a) => a.includes('Modification')),
    delays: compare.delayDetected,
    missingWork: compare.missingWork,
    recommendations: [
      `Valider l'avenant carrelage sur ${chantierName ?? 'le chantier'}`,
      'Commander colle flexible en urgence (8 sacs)',
      'Replanifier plomberie SDB — équipe disponible jeudi',
      'Photo conformité à reprendre zone cuisine',
    ],
    progressDetected: compare.progressDetected,
    materialChanges: compare.materialChangeDetected,
    complianceScore: 72 + Math.floor(Math.random() * 18),
  };
}

export async function comparePhotos(): Promise<{
  progressDetected: string[];
  delayDetected: string[];
  materialChangeDetected: string[];
  completedWork: string[];
  missingWork: string[];
  alerts: string[];
}> {
  await delayMs(2000);
  return {
    progressDetected: ['Cuisine: carrelage posé ~85%', 'SDB: étanchéité en cours'],
    delayDetected: ['Hall: retard 4j vs planning', 'Terrasse: attente matériaux'],
    materialChangeDetected: ['Cuisine: référence carrelage différente du plan'],
    completedWork: ['Cloisons RDC terminées', 'Électricité gainée salon'],
    missingWork: ['Plinthes cuisine', 'Joint silicone SDB'],
    alerts: [
      'Modification client non documentée — Cuisine',
      'Zone humide détectée — vérifier étanchéité',
      'Retard potentiel 3 jours si commande non passée',
    ],
  };
}
