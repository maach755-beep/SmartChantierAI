import type {
  DiagnosisArea,
  DirectorProposalReport,
  PracticalSolution,
  SavingsRecommendation,
  SituationActionItem,
  SituationAnalysisResult,
  SituationInput,
  SituationScores,
} from '@/types/situationAnalysis';
import { uid } from '@/utils/format';

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scheduleRatio(input: SituationInput): number {
  const start = new Date(input.startDate).getTime();
  const end = new Date(input.plannedEndDate).getTime();
  const now = Date.now();
  if (end <= start) return 1;
  const elapsed = (now - start) / (end - start);
  return Math.max(0, Math.min(1.2, elapsed));
}

function budgetRatio(input: SituationInput): number {
  return input.budgetPlanned > 0 ? input.budgetConsumed / input.budgetPlanned : 0;
}

function computeScores(input: SituationInput): SituationScores {
  const sched = scheduleRatio(input);
  const progressExpected = sched * 100;
  const delayGap = progressExpected - input.progressPercent;
  const delay = clamp(100 - delayGap * 2 - input.tasksDelayed * 3);

  const br = budgetRatio(input);
  const budget = clamp(100 - Math.max(0, br - 0.85) * 120 - (br > 1 ? 25 : 0));

  const hasMaterials = input.missingMaterials.trim().length > 10;
  const hasProblems = input.problemsEncountered.trim().length > 20;
  const organization = clamp(
    100 - (hasMaterials ? 15 : 0) - (input.tasksDelayed > 5 ? 20 : input.tasksDelayed * 3) - (hasProblems ? 10 : 0)
  );

  const workersPerTask = input.workerCount / Math.max(1, input.tasksDelayed + 1);
  const productivity = clamp(
    70 + workersPerTask * 5 - input.tasksDelayed * 4 + (input.tasksCompleted > 50 ? 10 : 0)
  );

  const risk = clamp(
    100 -
      (input.clientModifications.trim() ? 12 : 0) -
      (input.supplierDelays.trim() ? 15 : 0) -
      (delayGap > 15 ? 25 : delayGap > 5 ? 12 : 0)
  );

  const global = clamp((delay + budget + organization + productivity + risk) / 5);

  return { delay, budget, organization, productivity, risk, global };
}

function buildDiagnosis(input: SituationInput, scores: SituationScores): DiagnosisArea[] {
  const sched = scheduleRatio(input);
  const br = budgetRatio(input);
  const delayGap = sched * 100 - input.progressPercent;

  return [
    {
      area: 'planning',
      status: delayGap > 10 || input.tasksDelayed > 5 ? 'critical' : delayGap > 5 ? 'warning' : 'ok',
      summary:
        delayGap > 10
          ? `Avancement ${input.progressPercent}% vs ${Math.round(sched * 100)}% attendu — écart planning ${Math.round(delayGap)} pts. ${input.tasksDelayed} tâches en retard.`
          : `Planning globalement suivi (${input.tasksDelayed} retards signalés).`,
    },
    {
      area: 'budget',
      status: br > 1 ? 'critical' : br > 0.92 ? 'warning' : 'ok',
      summary: `Consommation ${(br * 100).toFixed(0)}% du budget (${input.budgetConsumed.toLocaleString('fr-FR')} € HT / ${input.budgetPlanned.toLocaleString('fr-FR')} € HT).`,
    },
    {
      area: 'manpower',
      status: input.workerCount < 12 && input.tasksDelayed > 4 ? 'warning' : 'ok',
      summary: `${input.workerCount} ouvriers pour ${input.tasksCompleted} tâches terminées — ratio charge ${input.tasksDelayed} retards.`,
    },
    {
      area: 'materials',
      status: input.missingMaterials.trim() ? 'critical' : 'ok',
      summary: input.missingMaterials.trim()
        ? `Ruptures: ${input.missingMaterials.slice(0, 120)}…`
        : 'Pas de manque matériau majeur déclaré.',
    },
    {
      area: 'suppliers',
      status: input.supplierDelays.trim() ? 'warning' : 'ok',
      summary: input.supplierDelays.trim() || 'Fournisseurs dans les délais déclarés.',
    },
    {
      area: 'productivity',
      status: scores.productivity < 60 ? 'warning' : 'ok',
      summary: `Score productivité ${scores.productivity}/100 — ${input.problemsEncountered.slice(0, 80) || 'RAS'}.`,
    },
    {
      area: 'blocked_tasks',
      status: input.tasksDelayed > 3 ? 'critical' : 'ok',
      summary: `${input.tasksDelayed} tâches bloquées ou en retard nécessitent déblocage.`,
    },
    {
      area: 'client_changes',
      status: input.clientModifications.trim() ? 'warning' : 'ok',
      summary: input.clientModifications.trim() || 'Aucune modification client signalée.',
    },
    {
      area: 'contract',
      status: input.clientModifications.trim() && br > 0.9 ? 'warning' : 'ok',
      summary:
        input.clientModifications.trim()
          ? 'Modifications client — valider avenants avant exécution pour conformité contrat.'
          : 'Conformité contrat à maintenir via PV et réserves.',
    },
    {
      area: 'risks',
      status: scores.risk < 55 ? 'critical' : scores.risk < 75 ? 'warning' : 'ok',
      summary: `Indice risque global ${scores.risk}/100. Contraintes: ${input.siteConstraints.slice(0, 100) || '—'}.`,
    },
  ];
}

function addSolution(
  list: PracticalSolution[],
  partial: Omit<PracticalSolution, 'id' | 'status'> & { status?: PracticalSolution['status'] }
): void {
  list.push({
    id: uid('sol'),
    status: 'pending',
    ...partial,
  });
}

function buildSolutions(input: SituationInput): PracticalSolution[] {
  const solutions: PracticalSolution[] = [];

  if (input.missingMaterials.trim()) {
    addSolution(solutions, {
      problem: 'Matériaux manquants sur chantier',
      probableCause: 'Commande tardive ou rupture stock fournisseur — arrêt corps d\'état dépendants',
      concreteSolution:
        'Commander les matériaux manquants sous 48h (carrelage, colle, peinture). Bloquer démarrage pose jusqu\'à réception PV livraison.',
      advisedOwner: 'Chef de chantier + Achats',
      actionDelay: '48 heures',
      expectedImpact: 'Éviter 3 à 5 jours de retard sur zones dépendantes',
      priority: 'urgent',
      solutionCost: 45_000,
      estimatedGain: 120_000,
      deadline: '+2 jours',
    });
  }

  if (input.tasksDelayed > 4) {
    addSolution(solutions, {
      problem: `${input.tasksDelayed} tâches en retard / bloquées`,
      probableCause: 'Chevauchement métiers, manque effectif ou attente matériaux',
      concreteSolution:
        'Réaffecter 2 ouvriers qualifiés sur la zone bloquée. Tenir réunion coordination 30 min quotidienne chef de chantier / conducteur.',
      advisedOwner: 'Conducteur de travaux',
      actionDelay: '24 heures',
      expectedImpact: 'Déblocage planning 4-7 jours',
      priority: 'urgent',
      solutionCost: 8_000,
      estimatedGain: 85_000,
      deadline: '+1 jour',
    });
  }

  if (input.supplierDelays.trim()) {
    addSolution(solutions, {
      problem: 'Retards fournisseurs',
      probableCause: 'Délais logistique ou rupture chaîne — impact planning pose',
      concreteSolution:
        'Négocier livraison express avec pénalités contractuelles. Activer fournisseur backup pour carrelage/ciment.',
      advisedOwner: 'Achats / Direction',
      actionDelay: '72 heures',
      expectedImpact: 'Sécuriser planning 2 semaines',
      priority: 'high',
      solutionCost: 12_000,
      estimatedGain: 95_000,
      deadline: '+3 jours',
    });
  }

  if (input.clientModifications.trim()) {
    addSolution(solutions, {
      problem: 'Modifications client non stabilisées',
      probableCause: 'Changement matériaux ou surfaces sans avenant signé',
      concreteSolution:
        'Valider les modifications client par écrit (avenant) avant exécution. Geler toute pose concernée jusqu\'à signature MOA.',
      advisedOwner: 'Direction + Administration',
      actionDelay: '5 jours ouvrés',
      expectedImpact: 'Éviter reprises et litiges — protège marge',
      priority: 'high',
      solutionCost: 2_000,
      estimatedGain: 150_000,
      deadline: '+5 jours',
    });
  }

  const br = budgetRatio(input);
  if (br > 0.92) {
    addSolution(solutions, {
      problem: 'Pression budget / dépassement',
      probableCause: 'Heures sup, modifications non facturées, gaspillage matériaux',
      concreteSolution:
        'Audit consommation hebdomadaire. Regrouper livraisons pour réduire déplacements. Préparer matériaux la veille pour chaque zone.',
      advisedOwner: 'Direction',
      actionDelay: '1 semaine',
      expectedImpact: 'Réduction 5-8% coûts opérationnels',
      priority: 'high',
      solutionCost: 5_000,
      estimatedGain: 110_000,
      deadline: '+7 jours',
    });
  }

  if (input.workerCount < 14 && input.tasksDelayed > 3) {
    addSolution(solutions, {
      problem: 'Effectif insuffisant vs charge',
      probableCause: 'Absentéisme ou sous-effectif vs planning initial',
      concreteSolution:
        'Renforcer par 2-3 ouvriers finitions sur 15 jours. Prioriser zones chemin critique (SDB, cuisine).',
      advisedOwner: 'Chef de chantier',
      actionDelay: '48 heures',
      expectedImpact: 'Rattrapage productivité +15%',
      priority: 'high',
      solutionCost: 35_000,
      estimatedGain: 75_000,
      deadline: '+2 jours',
    });
  }

  if (input.siteConstraints.toLowerCase().includes('bruyant') || input.siteConstraints.includes('18h')) {
    addSolution(solutions, {
      problem: 'Contraintes voisinage / horaires',
      probableCause: 'Plannings non alignés sur créneaux autorisés',
      concreteSolution:
        'Planifier tâches bruyantes (perçage, coupe) entre 7h-12h. Check-list quotidienne conformité horaires.',
      advisedOwner: 'Chef de chantier',
      actionDelay: 'Immédiat',
      expectedImpact: 'Éviter arrêt chantier et amendes',
      priority: 'normal',
      solutionCost: 0,
      estimatedGain: 40_000,
      deadline: 'Aujourd\'hui',
    });
  }

  addSolution(solutions, {
    problem: 'Organisation quotidienne',
    probableCause: 'Oublis préparation matériaux / manque suivi',
    concreteSolution:
      'Créer check-list quotidienne (matériaux J+1, zones prioritaires, validations). Briefing 15 min chaque matin.',
    advisedOwner: 'Conducteur de travaux',
    actionDelay: 'Immédiat',
    expectedImpact: 'Gain 30-45 min/ouvrier/jour',
    priority: 'normal',
    solutionCost: 500,
    estimatedGain: 25_000,
    deadline: 'Aujourd\'hui',
  });

  return solutions;
}

function buildSavings(input: SituationInput, solutions: PracticalSolution[]): SavingsRecommendation[] {
  const totalGain = solutions.reduce((s, x) => s + x.estimatedGain, 0);
  return [
    {
      id: 'sav_time',
      category: 'time',
      title: 'Gagner du temps',
      detail: 'Préparer matériaux la veille, regrouper livraisons, briefing matinal — évite allers-retours.',
      estimatedSaving: `${Math.round(totalGain * 0.15 / 1000)} k€ HT équivalent temps`,
    },
    {
      id: 'sav_labor',
      category: 'labor',
      title: 'Réduire effort main-d\'œuvre',
      detail: 'Réaffectation ciblée, check-list, zones priorisées — moins heures improductives.',
      estimatedSaving: `${Math.round(totalGain * 0.25 / 1000)} k€ HT main-d'œuvre`,
    },
    {
      id: 'sav_material',
      category: 'material',
      title: 'Réduire gaspillage matériaux',
      detail: 'Commandes juste-à-temps, contrôle quantités à réception, stockage protégé.',
      estimatedSaving: '3-5% budget matériaux',
    },
    {
      id: 'sav_cost',
      category: 'cost',
      title: 'Réduire coûts inutiles',
      detail: 'Livraisons groupées, avenants avant exécution, éviter reprises non facturées.',
      estimatedSaving: `${Math.round(totalGain * 0.35 / 1000)} k€ HT potentiel`,
    },
    {
      id: 'sav_org',
      category: 'organization',
      title: 'Améliorer organisation',
      detail: 'Réunion coordination quotidienne, tableau zones bloquées visible bureau chantier.',
      estimatedSaving: 'Visibilité planning +1 semaine',
    },
    {
      id: 'sav_delay',
      category: 'delay_prevention',
      title: 'Éviter retards futurs',
      detail: 'Commande 48h matériaux critiques, fournisseur backup, jalons hebdo avec direction.',
      estimatedSaving: `${input.tasksDelayed > 5 ? '5-10 jours' : '2-4 jours'} planning`,
    },
  ];
}

function buildDirectorReport(
  input: SituationInput,
  solutions: PracticalSolution[],
  savings: SavingsRecommendation[],
  scores: SituationScores
): DirectorProposalReport {
  const urgent = solutions.filter((s) => s.priority === 'urgent');
  const totalGain = solutions.reduce((s, x) => s + x.estimatedGain, 0);

  return {
    title: 'Proposition d\'amélioration chantier',
    situationSummary: `${input.siteName} (${input.siteType}) — Avancement ${input.progressPercent}%, budget consommé ${(budgetRatio(input) * 100).toFixed(0)}%, ${input.workerCount} ouvriers, ${input.tasksDelayed} retards. Score global ${scores.global}/100.`,
    mainProblems: solutions.slice(0, 6).map((s) => s.problem),
    proposedSolutions: solutions.map((s) => s.concreteSolution),
    estimatedTimeGains: urgent.map((s) => s.expectedImpact),
    potentialSavings: savings.map((s) => `${s.title}: ${s.estimatedSaving}`),
    actionPriorities: urgent.length
      ? urgent.map((s, i) => `${i + 1}. ${s.concreteSolution.slice(0, 80)}…`)
      : solutions.slice(0, 4).map((s, i) => `${i + 1}. ${s.problem}`),
    plan7Days: [
      'J1-J2: Commandes matériaux + réunion coordination',
      'J3: Réaffectation effectifs zones bloquées',
      'J4-J5: Validation avenants client en cours',
      'J6: Point fournisseurs retard',
      'J7: Bilan direction — décision planning S+1',
    ],
    plan30Days: [
      'Semaine 1: Déblocage matériaux et tâches critiques',
      'Semaine 2: Rattrapage planning corps d\'état',
      'Semaine 3: Contrôle budget et productivité',
      'Semaine 4: Préparation livraison client — réserves levées',
    ],
    directorTalkingPoints: [
      `Score chantier ${scores.global}/100 — ${scores.global < 60 ? 'action urgente requise' : 'pilotage renforcé recommandé'}`,
      `Économies potentielles estimées: ${Math.round(totalGain / 1000)} k€ HT`,
      `${urgent.length} actions urgentes sous 48-72h`,
      'Proposition validée par assistant MO — prête pour arbitrage direction',
    ],
  };
}

function buildActionPlans(input: SituationInput, solutions: PracticalSolution[]): SituationActionItem[] {
  const items: SituationActionItem[] = [];
  const push = (role: SituationActionItem['role'], horizon: SituationActionItem['horizon'], action: string) => {
    items.push({ id: uid('act'), role, horizon, action });
  };

  push('direction', 'daily', 'Valider priorités et arbitrage budget du jour');
  push('direction', 'weekly', 'Revue score santé chantier et décisions avenants');
  push('direction', 'monthly', 'Bilan marge et planning client');

  push('chef_chantier', 'daily', 'Briefing 07h30 — zones, matériaux J+1, sécurité');
  push('chef_chantier', 'weekly', 'Mise à jour planning 3 semaines glissantes');

  push('conducteur_travaux', 'daily', 'Suivi tâches bloquées et coordination métiers');
  push('conducteur_travaux', 'weekly', 'Analyse productivité par zone');

  push('ouvriers', 'daily', 'Exécuter check-list zone assignée — signalement blocages');
  push('ouvriers', 'weekly', 'Formation rapide nouvelles consignes client');

  push('achats', 'daily', 'Relance commandes urgentes fournisseurs');
  push('achats', 'weekly', 'Négociation délais et regroupement livraisons');

  push('administration', 'daily', 'Suivi avenants en attente signature');
  push('administration', 'weekly', 'Rapport budget consommé vs prévu');

  if (input.missingMaterials.trim()) {
    push('achats', 'daily', 'Commander matériaux manquants sous 48h');
  }

  solutions
    .filter((s) => s.priority === 'urgent')
    .slice(0, 4)
    .forEach((s) => {
      const role: SituationActionItem['role'] =
        s.advisedOwner.toLowerCase().includes('achat') || s.advisedOwner.toLowerCase().includes('fournisseur')
          ? 'achats'
          : s.advisedOwner.toLowerCase().includes('direction')
            ? 'direction'
            : s.advisedOwner.toLowerCase().includes('conducteur')
              ? 'conducteur_travaux'
              : 'chef_chantier';
      push(role, 'daily', s.concreteSolution.slice(0, 120));
    });

  return items;
}

export function runSituationAnalysis(input: SituationInput): SituationAnalysisResult {
  const scores = computeScores(input);
  const diagnosis = buildDiagnosis(input, scores);
  const solutions = buildSolutions(input);
  const savings = buildSavings(input, solutions);
  const directorReport = buildDirectorReport(input, solutions, savings, scores);
  const actionPlans = buildActionPlans(input, solutions);

  return {
    id: uid('sit'),
    generatedAt: new Date().toISOString(),
    input,
    scores,
    diagnosis,
    solutions,
    savings,
    directorReport,
    actionPlans,
  };
}

export function getSituationDashboardSummary(
  chantierDelayedCount = 0,
  sampleInput?: SituationInput
): {
  sitesToOptimize: number;
  timeGainDays: number;
  potentialSavingsEur: number;
  urgentActions: number;
  topRecommendation: string;
} {
  const input =
    sampleInput ??
    ({
      siteName: 'Chantier',
      siteType: 'BTP',
      startDate: '2025-01-01',
      plannedEndDate: '2026-12-31',
      budgetPlanned: 1_000_000,
      budgetConsumed: 920_000,
      progressPercent: 55,
      workerCount: 20,
      tasksCompleted: 40,
      tasksDelayed: 6,
      missingMaterials: 'Carrelage',
      problemsEncountered: 'Retards planning',
      clientModifications: '',
      supplierDelays: 'Fournisseur carrelage',
      siteConstraints: '',
    } satisfies SituationInput);

  const r = runSituationAnalysis(input);
  const urgent = r.solutions.filter((x) => x.priority === 'urgent');
  const totalGain = r.solutions.reduce((s, x) => s + x.estimatedGain, 0);

  return {
    sitesToOptimize: Math.max(chantierDelayedCount, 1),
    timeGainDays: Math.min(21, 3 + input.tasksDelayed),
    potentialSavingsEur: totalGain,
    urgentActions: urgent.length,
    topRecommendation: urgent[0]?.concreteSolution ?? r.solutions[0]?.concreteSolution ?? '—',
  };
}
