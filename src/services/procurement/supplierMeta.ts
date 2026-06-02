import type { FrenchSupplierName } from '@/config/france';

/** Fiabilité fournisseur BTP France (0–100) — base démo, API à brancher. */
export const SUPPLIER_RELIABILITY: Record<FrenchSupplierName, number> = {
  'Point P': 92,
  BigMat: 91,
  Gedimat: 88,
  'Chausson Matériaux': 87,
  Samse: 86,
  Dispano: 85,
  'La Plateforme du Bâtiment': 84,
  'Leroy Merlin Pro': 83,
  CEDEO: 82,
  'Frans Bonhomme': 81,
};

/** Distance indicative dépôt → ville (km) — démo géolocalisation France. */
const DEPOT_DISTANCE_KM: Record<string, Partial<Record<FrenchSupplierName, number>>> = {
  Nice: {
    'Point P': 8,
    BigMat: 12,
    Gedimat: 25,
    'Chausson Matériaux': 18,
    Samse: 22,
    Dispano: 35,
    'La Plateforme du Bâtiment': 10,
    'Leroy Merlin Pro': 6,
    CEDEO: 14,
    'Frans Bonhomme': 20,
  },
  Paris: {
    'Point P': 12,
    BigMat: 18,
    Gedimat: 22,
    'Chausson Matériaux': 15,
    Samse: 14,
    Dispano: 28,
    'La Plateforme du Bâtiment': 20,
    'Leroy Merlin Pro': 8,
    CEDEO: 16,
    'Frans Bonhomme': 22,
  },
  Lyon: {
    'Point P': 10,
    BigMat: 14,
    Gedimat: 16,
    'Chausson Matériaux': 12,
    Samse: 11,
    Dispano: 20,
    'La Plateforme du Bâtiment': 18,
    'Leroy Merlin Pro': 9,
  },
  Marseille: {
    'Point P': 9,
    BigMat: 11,
    Gedimat: 14,
    'Chausson Matériaux': 10,
    Samse: 13,
    Dispano: 24,
    'La Plateforme du Bâtiment': 16,
    'Leroy Merlin Pro': 7,
  },
  Bordeaux: {
    'Point P': 11,
    BigMat: 15,
    Gedimat: 8,
    'Chausson Matériaux': 14,
    Samse: 12,
    Dispano: 30,
    'La Plateforme du Bâtiment': 22,
    'Leroy Merlin Pro': 10,
  },
  Toulouse: {
    'Point P': 13,
    BigMat: 17,
    Gedimat: 19,
    'Chausson Matériaux': 11,
    Samse: 10,
    Dispano: 32,
    'La Plateforme du Bâtiment': 21,
    'Leroy Merlin Pro': 9,
  },
  Lille: {
    'Point P': 14,
    BigMat: 16,
    Gedimat: 20,
    'Chausson Matériaux': 13,
    Samse: 9,
    Dispano: 12,
    'La Plateforme du Bâtiment': 24,
    'Leroy Merlin Pro': 11,
  },
};

export function getSupplierReliability(name: string): number {
  return SUPPLIER_RELIABILITY[name as FrenchSupplierName] ?? 80;
}

export function getDistanceKm(supplier: string, city: string): number {
  const table = DEPOT_DISTANCE_KM[city] ?? DEPOT_DISTANCE_KM.Paris;
  return table[supplier as FrenchSupplierName] ?? 25;
}

export function formatDistance(km: number): string {
  return km < 15 ? `${km} km — livraison locale` : `${km} km depuis le dépôt`;
}
