import type { LearningInsight } from '@shared/site-director/types';
import { getStorage, setStorage } from '@/utils/storage';

const KEY = 'site_director_learning';

export function appendLearning(insights: LearningInsight[]): void {
  const existing = getStorage<LearningInsight[]>(KEY, []);
  const merged = [...insights, ...existing].slice(0, 50);
  setStorage(KEY, merged);
}

export function getLearningHistory(): LearningInsight[] {
  return getStorage<LearningInsight[]>(KEY, []);
}
