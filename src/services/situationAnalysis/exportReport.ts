import { exportToExcel, exportToPdf } from '@/services/exportService';
import type { SituationAnalysisResult } from '@/types/situationAnalysis';

export async function exportSituationPdf(result: SituationAnalysisResult): Promise<void> {
  const r = result.directorReport;
  await exportToPdf(r.title, [
    { heading: 'Résumé', lines: [r.situationSummary] },
    { heading: 'Problèmes principaux', lines: r.mainProblems },
    { heading: 'Solutions', lines: r.proposedSolutions },
    { heading: 'Gains temps', lines: r.estimatedTimeGains },
    { heading: 'Économies', lines: r.potentialSavings },
    { heading: 'Priorités', lines: r.actionPriorities },
    { heading: 'Plan 7 jours', lines: r.plan7Days },
    { heading: 'Plan 30 jours', lines: r.plan30Days },
    { heading: 'Points directeur', lines: r.directorTalkingPoints },
  ]);
}

export function exportSituationExcel(result: SituationAnalysisResult): void {
  const headers = [
    'Problème',
    'Gravité',
    'Solution',
    'Coût',
    'Gain',
    'Responsable',
    'Deadline',
    'Statut',
  ];
  const rows = result.solutions.map((s) => [
    s.problem,
    s.priority,
    s.concreteSolution,
    s.solutionCost,
    s.estimatedGain,
    s.advisedOwner,
    s.deadline,
    s.status,
  ]);
  exportToExcel(`proposition_${result.input.siteName.replace(/\s+/g, '_')}`, headers, rows);
}

export function copySituationToClipboard(result: SituationAnalysisResult): Promise<void> {
  const r = result.directorReport;
  const text = [
    r.title,
    '',
    r.situationSummary,
    '',
    '--- Problèmes ---',
    ...r.mainProblems.map((p) => `• ${p}`),
    '',
    '--- Solutions ---',
    ...result.solutions.map(
      (s) => `• [${s.priority}] ${s.problem}\n  → ${s.concreteSolution}\n  Responsable: ${s.advisedOwner} | ${s.deadline}`
    ),
    '',
    '--- Plan 7 jours ---',
    ...r.plan7Days.map((l) => `• ${l}`),
  ].join('\n');
  return navigator.clipboard.writeText(text);
}
