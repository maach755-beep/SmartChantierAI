import type { RiskDetectionResult } from './types';
import { dataStore } from '@/services/dataStore';
import { computeCompliance } from '@/utils/compliance';

export function detectSiteRisks(chantierId?: string): RiskDetectionResult {
  const chantiers = dataStore.getChantiers();
  const ch = chantierId ? chantiers.find((c) => c.id === chantierId) : chantiers[0];
  if (!ch) {
    return { risks: [], overallScore: 100 };
  }
  const tasks = dataStore.getTasks();
  const mods = dataStore.getModifications();
  const compliance = computeCompliance(ch, tasks, mods);
  const risks: RiskDetectionResult['risks'] = [];

  if (ch.delayDays > 0) {
    risks.push({
      title: `Retard chantier ${ch.delayDays} jours`,
      severity: ch.delayDays > 7 ? 'high' : 'medium',
      mitigation: 'Replanifier les lots critiques et alerter le chef de projet.',
    });
  }
  if (compliance.unvalidatedMods > 0) {
    risks.push({
      title: `${compliance.unvalidatedMods} modification(s) non validée(s)`,
      severity: 'medium',
      mitigation: 'Valider les avenants avant poursuite des travaux.',
    });
  }
  if (ch.riskLevel === 'red') {
    risks.push({
      title: 'Niveau de risque élevé',
      severity: 'high',
      mitigation: 'Réunion de crise chantier sous 48h.',
    });
  }
  if (risks.length === 0) {
    risks.push({
      title: 'Aucun risque critique détecté',
      severity: 'low',
      mitigation: 'Maintenir le suivi hebdomadaire.',
    });
  }

  return { risks, overallScore: compliance.score };
}
