export type SituationPriority = 'urgent' | 'high' | 'normal';
export type DecisionStatus = 'pending' | 'in_progress' | 'done';
export type SituationHorizon = 'daily' | 'weekly' | 'monthly';
export type SituationRole =
  | 'direction'
  | 'chef_chantier'
  | 'conducteur_travaux'
  | 'ouvriers'
  | 'achats'
  | 'administration';

export interface SituationInput {
  siteName: string;
  siteType: string;
  startDate: string;
  plannedEndDate: string;
  budgetPlanned: number;
  budgetConsumed: number;
  progressPercent: number;
  workerCount: number;
  tasksCompleted: number;
  tasksDelayed: number;
  missingMaterials: string;
  problemsEncountered: string;
  clientModifications: string;
  supplierDelays: string;
  siteConstraints: string;
  photosNote?: string;
  documentsNote?: string;
}

export interface SituationScores {
  delay: number;
  budget: number;
  organization: number;
  productivity: number;
  risk: number;
  global: number;
}

export interface DiagnosisArea {
  area: string;
  status: 'ok' | 'warning' | 'critical';
  summary: string;
}

export interface PracticalSolution {
  id: string;
  problem: string;
  probableCause: string;
  concreteSolution: string;
  advisedOwner: string;
  actionDelay: string;
  expectedImpact: string;
  priority: SituationPriority;
  solutionCost: number;
  estimatedGain: number;
  deadline: string;
  status: DecisionStatus;
}

export interface SavingsRecommendation {
  id: string;
  category: 'time' | 'labor' | 'material' | 'cost' | 'organization' | 'delay_prevention';
  title: string;
  detail: string;
  estimatedSaving: string;
}

export interface DirectorProposalReport {
  title: string;
  situationSummary: string;
  mainProblems: string[];
  proposedSolutions: string[];
  estimatedTimeGains: string[];
  potentialSavings: string[];
  actionPriorities: string[];
  plan7Days: string[];
  plan30Days: string[];
  directorTalkingPoints: string[];
}

export interface SituationActionItem {
  id: string;
  role: SituationRole;
  horizon: SituationHorizon;
  action: string;
}

export interface SituationAnalysisResult {
  id: string;
  generatedAt: string;
  input: SituationInput;
  scores: SituationScores;
  diagnosis: DiagnosisArea[];
  solutions: PracticalSolution[];
  savings: SavingsRecommendation[];
  directorReport: DirectorProposalReport;
  actionPlans: SituationActionItem[];
}
