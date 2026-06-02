export type DelayStatus = 'green' | 'orange' | 'red';

export interface DelayDetectionResult {
  chantierId: string;
  chantierName: string;
  delayPercent: number;
  delayDays: number;
  status: DelayStatus;
  causes: string[];
  recoveryActions: string[];
  progressPercent: number;
  expectedProgressPercent: number;
}
