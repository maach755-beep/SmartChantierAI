import type { SiteJournalEntry } from '@/types/siteJournal';
import { dataStore } from '@/services/dataStore';
import { newId } from '@/utils/id';
import { delayMs } from '@/utils/format';
import { getJournalHistory, saveJournalEntry } from './storage';

export async function analyzeSitePhotos(
  chantierId: string,
  photoCount: number
): Promise<SiteJournalEntry> {
  await delayMs(1400 + photoCount * 200);
  const ch = dataStore.getChantiers().find((c) => c.id === chantierId) ?? dataStore.getChantiers()[0];
  const tasks = dataStore.getTasks().filter((t) => t.chantierId === ch.id);
  const blocked = tasks.filter((t) => t.status === 'blocked').length;
  const progressEstimate = Math.min(100, ch.progress + Math.floor(photoCount * 1.5));

  const entry: SiteJournalEntry = {
    id: newId('journal'),
    chantierId: ch.id,
    chantierName: ch.name,
    createdAt: new Date().toISOString(),
    photoCount,
    workCompleted: [
      'Cloisons RDC — finition joints',
      'Carrelage cuisine — 70% surface posée',
      'Électricité salon — gaines posées',
    ].slice(0, Math.max(1, photoCount)),
    progressEstimate,
    remainingTasks: [
      'Plinthes cuisine',
      'Étanchéité SDB',
      'Peinture couloir R+1',
    ].slice(0, 2 + blocked),
    risksDetected: ch.riskLevel === 'red'
      ? ['Retard matériaux — zone humide à contrôler']
      : ['Finition qualité — vérifier alignement carrelage'],
    recommendations: [
      'Commander colle flexible avant fin de semaine',
      'Photo conformité MO — cuisine et SDB',
      ch.delayDays > 0 ? `Rattrapage planning : ${ch.delayDays} j de retard` : 'Maintenir rythme actuel',
    ],
  };

  saveJournalEntry(entry);
  return entry;
}

export function listJournalHistory(chantierId?: string): SiteJournalEntry[] {
  const all = getJournalHistory();
  return chantierId ? all.filter((e) => e.chantierId === chantierId) : all;
}
