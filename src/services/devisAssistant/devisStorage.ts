import { getStorage, setStorage } from '@/utils/storage';
import type { ProfessionalDevisDocument } from '@/types/professionalDevis';

const KEY = 'professional_devis_v1';

export function saveProfessionalDevis(doc: ProfessionalDevisDocument): void {
  const list = getStorage<ProfessionalDevisDocument[]>(KEY, []);
  const idx = list.findIndex((d) => d.id === doc.id);
  const next = { ...doc, updatedAt: new Date().toISOString() };
  if (idx >= 0) {
    list[idx] = next;
  } else {
    list.unshift(next);
  }
  setStorage(KEY, list.slice(0, 10));
}

export function getProfessionalDevisList(): ProfessionalDevisDocument[] {
  return getStorage(KEY, []);
}
