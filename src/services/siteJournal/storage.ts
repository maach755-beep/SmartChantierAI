import type { SiteJournalEntry } from '@/types/siteJournal';
import { getStorage, setStorage } from '@/utils/storage';

const KEY = 'site_journal_history';

export function getJournalHistory(): SiteJournalEntry[] {
  return getStorage(KEY, []);
}

export function saveJournalEntry(entry: SiteJournalEntry): void {
  const list = getJournalHistory();
  setStorage(KEY, [entry, ...list].slice(0, 50));
}
