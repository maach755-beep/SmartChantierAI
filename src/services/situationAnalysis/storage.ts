import type { SituationAnalysisResult } from '@/types/situationAnalysis';
import { getStorage, setStorage } from '@/utils/storage';

const KEY = 'situation_analyses';

export function saveAnalysis(result: SituationAnalysisResult): void {
  const list = getStorage<SituationAnalysisResult[]>(KEY, []);
  setStorage(KEY, [result, ...list].slice(0, 20));
}

export function getSavedAnalyses(): SituationAnalysisResult[] {
  return getStorage<SituationAnalysisResult[]>(KEY, []);
}

export function getLatestAnalysis(): SituationAnalysisResult | undefined {
  return getSavedAnalyses()[0];
}
