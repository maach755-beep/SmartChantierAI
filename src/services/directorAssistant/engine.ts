import type { DirectorAssistantResult, DirectorPriority } from '@/types/directorAssistant';
import { dataStore } from '@/services/dataStore';
import { newId } from '@/utils/id';
import { delayMs, formatCurrency } from '@/utils/format';
import { FRENCH_SUPPLIER_NETWORK } from '@/config/france';

type Topic = 'delay' | 'materials' | 'budget' | 'workers' | 'supplier' | 'planning';

function detectTopics(text: string): Topic[] {
  const m = text.toLowerCase();
  const topics: Topic[] = [];
  if (/retard|تأخير|delayed|planning|planning|جدول/.test(m)) topics.push('delay', 'planning');
  if (/matériau|مادة|stock|manquant|missing|carrelage|colle/.test(m)) topics.push('materials');
  if (/budget|ميزانية|dépasse|overrun|coût|cost/.test(m)) topics.push('budget');
  if (/ouvrier|عامل|worker|effectif|équipe/.test(m)) topics.push('workers');
  if (/fournisseur|مورد|supplier|livraison|delivery/.test(m)) topics.push('supplier');
  if (topics.length === 0) topics.push('planning');
  return [...new Set(topics)];
}

function detectLang(text: string): 'fr' | 'ar' {
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'fr';
}

function priorityFrom(chantierDelay: number, budgetRatio: number): DirectorPriority {
  if (chantierDelay > 10 || budgetRatio > 1.05) return 'urgent';
  if (chantierDelay > 4 || budgetRatio > 0.95) return 'high';
  if (chantierDelay > 0) return 'normal';
  return 'low';
}

export async function runDirectorAssistant(
  inputText: string,
  chantierId: string
): Promise<DirectorAssistantResult> {
  await delayMs(900 + Math.random() * 600);
  const chantiers = dataStore.getChantiers();
  const ch = chantiers.find((c) => c.id === chantierId) ?? chantiers[0];
  const topics = detectTopics(inputText);
  const lang = detectLang(inputText);
  const budgetRatio = ch.budgetPlanned > 0 ? ch.budgetConsumed / ch.budgetPlanned : 0;
  const priority = priorityFrom(ch.delayDays, budgetRatio);
  const timeSave = ch.delayDays > 5 ? '4 à 7 jours' : '1 à 3 jours';
  const costSave =
    budgetRatio > 1 ? `${formatCurrency(18_000)} – ${formatCurrency(35_000)} HT` : `${formatCurrency(6_000)} – ${formatCurrency(15_000)} HT`;

  const rootCauses: string[] = [];
  const risks: string[] = [];
  const decisions: string[] = [];

  if (topics.includes('delay') || topics.includes('planning')) {
    rootCauses.push(`Écart planning : ${ch.progress}% réalisé vs objectif semaine.`);
    risks.push('Pénalités client si jalons non tenus sous 10 jours.');
    decisions.push('Replanifier lot finitions + valider chemin critique avec conducteur.');
  }
  if (topics.includes('materials')) {
    rootCauses.push('Rupture stock carrelage / colle sur zone critique.');
    risks.push('Arrêt pose 2–3 jours si commande non passée avant 48h.');
    decisions.push(`Bon de commande urgent — Achats — ${FRENCH_SUPPLIER_NETWORK[1]} ou ${FRENCH_SUPPLIER_NETWORK[0]}.`);
  }
  if (topics.includes('budget')) {
    rootCauses.push(`Budget consommé ${Math.round(budgetRatio * 100)}% — risque dépassement.`);
    risks.push('Marge projet en baisse si avenants non facturés.');
    decisions.push('Geler modifications hors MO + point hebdo direction.');
  }
  if (topics.includes('workers')) {
    rootCauses.push('Effectif insuffisant sur lots second œuvre.');
    risks.push('Retard en cascade sur sous-traitants.');
    decisions.push('Renfort 2 ouvriers + réorganisation chef de chantier.');
  }
  if (topics.includes('supplier')) {
    rootCauses.push('Retard livraison fournisseur signalé.');
    risks.push('Coût logistique supplémentaire + reprise planning.');
    decisions.push('Relance fournisseur 06h + solution de substitution catalogue.');
  }

  const actionPlan: DirectorAssistantResult['actionPlan'] = [
    { id: newId('act'), title: 'Point urgence 08h — chef de chantier + conducteur', responsible: ch.manager, deadline: 'J+1', priority: 'urgent' },
    { id: newId('act'), title: 'Valider commandes matériaux manquants', responsible: 'Service Achats', deadline: 'J+2', priority: 'high' },
    { id: newId('act'), title: 'Mise à jour planning client / MO', responsible: 'Chef de projet', deadline: 'J+3', priority: priority === 'urgent' ? 'high' : 'normal' },
  ];

  const situationSummary =
    lang === 'ar'
      ? `الورشة ${ch.name}: تقدم ${ch.progress}%، تأخير ${ch.delayDays} يوم، ميزانية ${Math.round(budgetRatio * 100)}%.`
      : `Chantier ${ch.name} : avancement ${ch.progress}%, retard ${ch.delayDays} j, budget ${Math.round(budgetRatio * 100)}% consommé. Situation analysée : ${topics.join(', ')}.`;

  return {
    id: newId('dir'),
    chantierId: ch.id,
    chantierName: ch.name,
    inputText,
    language: lang,
    createdAt: new Date().toISOString(),
    situationSummary,
    rootCauses: rootCauses.length ? rootCauses : ['Analyse basée sur indicateurs chantier démo.'],
    risks: risks.length ? risks : ['Surveillance planning hebdomadaire recommandée.'],
    priorityLevel: priority,
    actionPlan,
    recommendedDecisions: decisions.length ? decisions : ['Maintenir rythme actuel avec point hebdo.'],
    estimatedTimeSavings: timeSave,
    estimatedCostSavings: costSave,
    detectedTopics: topics,
  };
}
