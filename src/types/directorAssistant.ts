export type DirectorPriority = 'urgent' | 'high' | 'normal' | 'low';

export interface DirectorActionItem {
  id: string;
  title: string;
  responsible: string;
  deadline: string;
  priority: DirectorPriority;
}

export interface DirectorAssistantResult {
  id: string;
  chantierId: string;
  chantierName: string;
  inputText: string;
  language: 'fr' | 'ar';
  createdAt: string;
  situationSummary: string;
  rootCauses: string[];
  risks: string[];
  priorityLevel: DirectorPriority;
  actionPlan: DirectorActionItem[];
  recommendedDecisions: string[];
  estimatedTimeSavings: string;
  estimatedCostSavings: string;
  detectedTopics: string[];
}
