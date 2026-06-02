import type { LibraryMaterial, MaterialLibraryCategory } from '@/types/materialsLibrary';
import { MATERIALS_LIBRARY_SEED } from '@/data/materialsLibrarySeed';
import { getStorage, setStorage } from '@/utils/storage';

const KEY = 'materials_library_v1';

export function initMaterialsLibrary(): LibraryMaterial[] {
  const existing = getStorage<LibraryMaterial[] | null>(KEY, null);
  if (existing?.length) return existing;
  setStorage(KEY, MATERIALS_LIBRARY_SEED);
  return MATERIALS_LIBRARY_SEED;
}

export function getMaterialsLibrary(): LibraryMaterial[] {
  return initMaterialsLibrary();
}

export function getMaterialsByCategory(category: MaterialLibraryCategory | ''): LibraryMaterial[] {
  const all = getMaterialsLibrary();
  if (!category) return all;
  return all.filter((m) => m.category === category);
}

export function searchMaterialsLibrary(query: string): LibraryMaterial[] {
  const q = query.toLowerCase().trim();
  if (!q) return getMaterialsLibrary();
  return getMaterialsLibrary().filter(
    (m) =>
      m.brand.toLowerCase().includes(q) ||
      m.model.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.category.includes(q)
  );
}
