import { delayMs } from '@/utils/format';
import type { PhotoComparisonResult } from '@/types';

export async function analyzePhotoPair(
  _oldUrl: string,
  _newUrl: string,
  chantierName?: string
): Promise<PhotoComparisonResult> {
  await delayMs(1600 + Math.random() * 800);
  const site = chantierName ?? 'chantier';
  return {
    progressDetected: [
      `Cloisons BA13 terminées — ${site}`,
      'Électricité gainée — 95% zone salon',
      'Enduit murs R+1 validé',
    ],
    delayDetected: [
      'Retard pose carrelage cuisine — 4 jours',
      'Plomberie SDB non démarrée (prévu J-3)',
    ],
    materialChangeDetected: [
      'Carrelage 60x60 remplacé par 80x80 (non déclaré)',
      'Colle flexible : stock insuffisant',
    ],
    modificationsDetected: [
      'Cloison cuisine déplacée de 40 cm',
      'Ouverture mur porteur non prévue au plan',
      'Hauteur faux-plafond modifiée (+8 cm)',
    ],
    completedWork: ['Cloisons posées', 'Électricité gainée', 'Enduit murs terminé'],
    missingWork: ['Pose carrelage sol cuisine', 'Peinture plafond salon'],
    alerts: [
      'Modification structurelle détectée — avenant requis',
      `Écart significatif plan vs réalité — ${site}`,
      'Risque humidité zone SDB',
    ],
    differenceScore: 28 + Math.floor(Math.random() * 25),
  };
}
