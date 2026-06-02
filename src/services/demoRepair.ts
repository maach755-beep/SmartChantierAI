import type { Chantier } from '@/types';

/** Remove orphan records whose chantierId is not in active demo chantiers. */
export function repairDemoLinks<T extends { chantierId: string }>(
  items: T[],
  chantiers: Chantier[]
): T[] {
  const ids = new Set(chantiers.map((c) => c.id));
  return items.filter((item) => ids.has(item.chantierId));
}
