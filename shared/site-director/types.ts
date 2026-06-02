/** AI Site Director — domain types (SaaS-ready) */

export type Lang = 'fr' | 'ar' | 'en';
export type PlanHorizon = 'daily' | 'weekly' | 'monthly';
export type StakeholderRole =
  | 'director'
  | 'site_manager'
  | 'team_leader'
  | 'worker'
  | 'procurement'
  | 'administration';

export interface HealthDimensionScore {
  key: 'budget' | 'planning' | 'productivity' | 'safety' | 'quality' | 'risk';
  score: number;
  label: string;
  detail: string;
}

export interface ChantierHealthScore {
  globalScore: number;
  level: 'green' | 'orange' | 'red';
  dimensions: HealthDimensionScore[];
}

export interface AnalysisFinding {
  category:
    | 'delay'
    | 'budget'
    | 'material'
    | 'supplier'
    | 'workforce'
    | 'productivity'
    | 'quality'
    | 'contract';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  chantierId?: string;
  chantierName?: string;
}

export interface ProjectAnalysisReport {
  projectId: string;
  projectName: string;
  generatedAt: string;
  findings: AnalysisFinding[];
  summary: string;
}

export interface ActionPlanItem {
  id: string;
  role: StakeholderRole;
  horizon: PlanHorizon;
  priority: number;
  action: string;
  owner: string;
  deadline?: string;
}

export interface ManagementRecommendation {
  id: string;
  priority: 'urgent' | 'high' | 'normal';
  text: string;
  category: string;
}

export interface DecisionOption {
  id: string;
  label: string;
  description: string;
  costImpact: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeImpactDays: number;
}

export interface DecisionSupport {
  problem: string;
  options: DecisionOption[];
}

export interface SuccessPrediction {
  onTimeProbability: number;
  budgetOverrunProbability: number;
  delayProbability: number;
  clientSatisfactionProbability: number;
}

export interface ExecutiveMetrics {
  profitabilityPercent: number;
  cashFlowStatus: 'positive' | 'neutral' | 'negative';
  projectsOnTrack: number;
  projectsAtRisk: number;
  workforcePerformancePercent: number;
  supplierPerformancePercent: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface DailyBriefing {
  date: string;
  priorities: string[];
  urgentActions: string[];
  delayedTasks: string[];
  materialShortages: string[];
  riskAlerts: string[];
}

export interface BusinessCoachInsight {
  id: string;
  area: 'productivity' | 'cost' | 'organization' | 'planning' | 'resources';
  title: string;
  advice: string;
}

export interface LearningInsight {
  id: string;
  type: 'delay' | 'success' | 'mistake' | 'budget';
  lesson: string;
  projectName: string;
  date: string;
}

export interface SiteDirectorSnapshot {
  chantiers: {
    id: string;
    name: string;
    client: string;
    status: string;
    progress: number;
    delayDays: number;
    budgetPlanned: number;
    budgetConsumed: number;
    riskLevel: string;
    manager: string;
  }[];
  risks: { id: string; chantierId: string; chantierName: string; type: string; level: string; score: number; description: string }[];
  materials: { id: string; chantierId: string; chantierName: string; name: string; status: string }[];
  suppliers: { id: string; name: string; performanceScore: number; lateDeliveries: number; pendingMaterials: number }[];
  tasks: { id: string; chantierId: string; title: string; status: string }[];
  team: { id: string; chantierId: string; name: string; active: boolean; roleType: string }[];
  attendance: { present: boolean; absent: boolean; chantierId: string }[];
  modifications: { id: string; chantierId: string; status: string; budgetImpact: number }[];
  materialRequests: { status: string; urgency: string; chantierName: string; materialName: string }[];
}

export interface SiteDirectorAnalysis {
  health: ChantierHealthScore;
  reports: ProjectAnalysisReport[];
  actionPlans: ActionPlanItem[];
  recommendations: ManagementRecommendation[];
  decisions: DecisionSupport[];
  predictions: SuccessPrediction;
  executive: ExecutiveMetrics;
  briefing: DailyBriefing;
  coach: BusinessCoachInsight[];
  learning: LearningInsight[];
}
