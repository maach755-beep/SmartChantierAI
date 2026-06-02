import type { Chantier, Risk, RiskLevel } from '@/types';

export interface ChantierHealth {
  score: number;
  level: RiskLevel;
  label: string;
}

export function computeChantierHealth(chantier: Chantier, siteRisks: Risk[]): ChantierHealth {
  const budgetRatio = chantier.budgetConsumed / chantier.budgetPlanned;
  const redCount = siteRisks.filter((r) => r.level === 'red').length;
  const orangeCount = siteRisks.filter((r) => r.level === 'orange').length;

  let score = 100;
  score -= chantier.delayDays * 2;
  score -= Math.max(0, (budgetRatio - 0.85) * 40);
  score -= redCount * 8;
  score -= orangeCount * 4;
  if (chantier.status === 'delayed') score -= 12;
  if (chantier.status === 'at_risk') score -= 18;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: RiskLevel = 'green';
  if (score < 50) level = 'red';
  else if (score < 75) level = 'orange';

  const label = level === 'red' ? 'Critique' : level === 'orange' ? 'Modéré' : 'Bon';

  return { score, level, label };
}
