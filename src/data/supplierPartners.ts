/** Réseau fournisseurs BTP France — intégration catalogue future. */

export type FutureSupplierId =
  | 'point_p'
  | 'bigmat'
  | 'gedimat'
  | 'chausson'
  | 'samse'
  | 'dispano'
  | 'plateforme_batiment'
  | 'leroy_merlin_pro'
  | 'local';

export interface FutureSupplierPartner {
  id: FutureSupplierId;
  name: string;
  type: 'national' | 'regional' | 'specialist';
  categories: string[];
  apiReady: boolean;
}

export const FUTURE_SUPPLIER_PARTNERS: FutureSupplierPartner[] = [
  { id: 'point_p', name: 'Point P', type: 'national', categories: ['facade', 'roofing', 'plumbing', 'isolation'], apiReady: false },
  { id: 'bigmat', name: 'BigMat', type: 'national', categories: ['tiles', 'glue', 'facade', 'mortier'], apiReady: false },
  { id: 'gedimat', name: 'Gedimat', type: 'regional', categories: ['flooring', 'facade', 'roofing', 'aggregates'], apiReady: false },
  { id: 'chausson', name: 'Chausson Matériaux', type: 'national', categories: ['tiles', 'paint', 'tools', 'plumbing'], apiReady: false },
  { id: 'samse', name: 'Samse', type: 'national', categories: ['tiles', 'plumbing', 'heating', 'tools'], apiReady: false },
  { id: 'dispano', name: 'Dispano', type: 'specialist', categories: ['plasterboard', 'flooring', 'wood'], apiReady: false },
  { id: 'plateforme_batiment', name: 'La Plateforme du Bâtiment', type: 'national', categories: ['general', 'tools'], apiReady: false },
  { id: 'leroy_merlin_pro', name: 'Leroy Merlin Pro', type: 'national', categories: ['paint', 'electrical', 'tiles', 'tools'], apiReady: false },
  { id: 'local', name: 'Négoce local agréé', type: 'regional', categories: ['all'], apiReady: true },
];

const PRIORITY: FutureSupplierId[] = [
  'point_p',
  'bigmat',
  'gedimat',
  'chausson',
  'samse',
  'dispano',
  'plateforme_batiment',
  'leroy_merlin_pro',
];

export function partnerForCategory(category: string): FutureSupplierId {
  const c = category.toLowerCase();
  if (c.includes('plomb') || c.includes('sanit') || c.includes('facade') || c.includes('toit')) return 'point_p';
  if (c.includes('carrel') || c.includes('tile') || c.includes('colle') || c.includes('joint')) return 'bigmat';
  if (c.includes('placo') || c.includes('plaster') || c.includes('parquet') || c.includes('menuiser')) return 'dispano';
  if (c.includes('peint') || c.includes('electr') || c.includes('outillage')) return 'leroy_merlin_pro';
  if (c.includes('isolation') || c.includes('mortier')) return 'gedimat';
  return 'chausson';
}

export function isFrenchSupplierName(name: string): boolean {
  const n = name.toLowerCase();
  return FUTURE_SUPPLIER_PARTNERS.some((s) => n.includes(s.name.toLowerCase())) || n.includes('négoce') || n.includes('negoce');
}

export function prioritizedPartnerIds(): FutureSupplierId[] {
  return PRIORITY;
}
