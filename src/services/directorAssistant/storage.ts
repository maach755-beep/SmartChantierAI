import type { DirectorAssistantResult } from '@/types/directorAssistant';
import { getStorage, setStorage } from '@/utils/storage';

const KEY = 'director_assistant_history';

export function getDirectorHistory(): DirectorAssistantResult[] {
  return getStorage(KEY, []);
}

export function saveDirectorAnalysis(result: DirectorAssistantResult): void {
  const list = getDirectorHistory();
  setStorage(KEY, [result, ...list].slice(0, 30));
}
