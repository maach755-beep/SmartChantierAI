import type { DelayDetectionResult, DelayStatus } from '@/types/delayDetection';
import { dataStore } from '@/services/dataStore';

function statusFrom(delayPercent: number, delayDays: number): DelayStatus {
  if (delayPercent > 15 || delayDays > 10) return 'red';
  if (delayPercent > 5 || delayDays > 3) return 'orange';
  return 'green';
}

export function computeDelayDetection(chantierId?: string): DelayDetectionResult[] {
  const chantiers = chantierId
    ? dataStore.getChantiers().filter((c) => c.id === chantierId)
    : dataStore.getChantiers();

  return chantiers.map((ch) => {
    const expected = Math.min(100, ch.progress + ch.delayDays * 2 + 5);
    const delayPercent = Math.max(0, Math.round(expected - ch.progress));
    const causes: string[] = [];
    const recovery: string[] = [];

    if (ch.delayDays > 0) causes.push(`Retard planning ${ch.delayDays} jours`);
    if (ch.status === 'delayed') causes.push('Statut chantier : en retard');
    if (ch.riskLevel === 'red') causes.push('Risque élevé — matériaux / sous-traitance');
    const materials = dataStore.getMaterials().filter((m) => m.chantierId === ch.id && m.status === 'critical');
    if (materials.length) causes.push(`${materials.length} matériau(x) critique(s)`);
    if (causes.length === 0) causes.push('Aucun retard majeur — surveillance standard');

    if (ch.delayDays > 0) {
      recovery.push('Replanifier jalons semaine — conducteur de travaux');
      recovery.push('Relance fournisseurs — service achats');
    }
    recovery.push('Point photo quotidien — chef de chantier');
    if (delayPercent > 10) recovery.push('Brief direction — décision renfort équipe');

    return {
      chantierId: ch.id,
      chantierName: ch.name,
      delayPercent,
      delayDays: ch.delayDays,
      status: statusFrom(delayPercent, ch.delayDays),
      causes,
      recoveryActions: recovery,
      progressPercent: ch.progress,
      expectedProgressPercent: expected,
    };
  });
}
