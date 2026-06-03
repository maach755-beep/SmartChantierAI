import type { DelayDetectionResult, DelayStatus } from '@/types/delayDetection';
import type { Chantier, MaterialItem, Task } from '@/types';
import { listProjects } from '@/services/saas/platform';
import { listTasks, listMaterials } from '@/services/saas/phase2Data';
import { dbProjectToChantier } from '@/services/saas/mappers';

function statusFrom(delayPercent: number, delayDays: number): DelayStatus {
  if (delayPercent > 15 || delayDays > 10) return 'red';
  if (delayPercent > 5 || delayDays > 3) return 'orange';
  return 'green';
}

export async function computeDelayDetectionAsync(chantierId?: string): Promise<DelayDetectionResult[]> {
  const projects = await listProjects();
  let chantiers = projects.map(dbProjectToChantier);
  if (chantierId) chantiers = chantiers.filter((c) => c.id === chantierId);
  const [tasks, materials] = await Promise.all([listTasks(), listMaterials()]);
  return computeDelayDetectionFromData(chantiers, tasks, materials);
}

/** Sync wrapper for pages using cached platform data */
export function computeDelayDetectionFromData(
  chantiers: Chantier[],
  tasks: Task[],
  materials: MaterialItem[],
  chantierId?: string
): DelayDetectionResult[] {
  const list = chantierId ? chantiers.filter((c) => c.id === chantierId) : chantiers;

  return list.map((ch) => {
    const expected = Math.min(100, ch.progress + ch.delayDays * 2 + 5);
    const delayPercent = Math.max(0, Math.round(expected - ch.progress));
    const causes: string[] = [];
    const recovery: string[] = [];

    if (ch.delayDays > 0) causes.push(`Retard planning ${ch.delayDays} jours`);
    if (ch.status === 'delayed') causes.push('Statut chantier : en retard');
    if (ch.riskLevel === 'red') causes.push('Risque élevé — matériaux / sous-traitance');
    const critical = materials.filter((m) => m.chantierId === ch.id && m.status === 'critical');
    if (critical.length) causes.push(`${critical.length} matériau(x) critique(s)`);
    const blocked = tasks.filter((t) => t.chantierId === ch.id && t.status === 'blocked').length;
    if (blocked) causes.push(`${blocked} tâche(s) bloquée(s)`);
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

/** @deprecated Use computeDelayDetectionFromData with platform data */
export function computeDelayDetection(_chantierId?: string): DelayDetectionResult[] {
  return [];
}
