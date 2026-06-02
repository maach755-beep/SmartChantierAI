import type { TechnicalSheetProduct } from '@/types/ficheTechnique';
import { getStorage, removeStorage, setStorage } from '@/utils/storage';

const STORAGE_KEY = 'fiche_technique_history';
const MAX_ITEMS = 50;

export function saveTechnicalSheet(sheet: TechnicalSheetProduct): void {
  const list = listTechnicalSheets();
  const without = list.filter((s) => s.id !== sheet.id);
  const next = [{ ...sheet, generatedAt: sheet.generatedAt || new Date().toISOString() }, ...without].slice(
    0,
    MAX_ITEMS
  );
  setStorage(STORAGE_KEY, next);
}

export function listTechnicalSheets(): TechnicalSheetProduct[] {
  return getStorage<TechnicalSheetProduct[]>(STORAGE_KEY, []);
}

export function getTechnicalSheet(id: string): TechnicalSheetProduct | undefined {
  return listTechnicalSheets().find((s) => s.id === id);
}

export function deleteTechnicalSheet(id: string): void {
  const next = listTechnicalSheets().filter((s) => s.id !== id);
  setStorage(STORAGE_KEY, next);
}

export function clearTechnicalSheets(): void {
  removeStorage(STORAGE_KEY);
}
