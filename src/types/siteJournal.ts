export interface SiteJournalEntry {
  id: string;
  chantierId: string;
  chantierName: string;
  createdAt: string;
  photoCount: number;
  workCompleted: string[];
  progressEstimate: number;
  remainingTasks: string[];
  risksDetected: string[];
  recommendations: string[];
}
