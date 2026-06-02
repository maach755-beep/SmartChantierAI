import type { Chantier, Modification, Task } from '@/types';
import { isTaskComplete, isTaskOpen } from '@/utils/taskLabels';

export interface ComplianceResult {
  score: number;
  missingTasks: number;
  missingMaterials: number;
  unvalidatedMods: number;
  delayDays: number;
}

export function computeCompliance(
  chantier: Chantier,
  tasks: Task[],
  modifications: Modification[]
): ComplianceResult {
  const siteTasks = tasks.filter((t) => t.chantierId === chantier.id);
  const done = siteTasks.filter((t) => isTaskComplete(t.status)).length;
  const total = siteTasks.length || 1;
  const taskRatio = done / total;

  const unvalidatedMods = modifications.filter(
    (m) => m.chantierId === chantier.id && (m.status === 'pending' || m.status === 'draft')
  ).length;

  const missingTasks = siteTasks.filter((t) => isTaskOpen(t.status)).length;
  const missingMaterials = chantier.status === 'at_risk' ? 3 + (chantier.delayDays > 5 ? 2 : 0) : chantier.delayDays > 0 ? 1 : 0;

  let score = Math.round(taskRatio * 70 + (100 - Math.min(chantier.delayDays * 3, 30)));
  score -= unvalidatedMods * 5;
  score -= missingTasks * 0.5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    missingTasks,
    missingMaterials,
    unvalidatedMods,
    delayDays: chantier.delayDays,
  };
}
