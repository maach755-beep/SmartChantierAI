import type { PurchaseSearchCriteria, SupplierSuggestion, ProductRecommendation } from '@/types/purchaseAssistant';
import { FRENCH_SUPPLIER_NETWORK } from '@/config/france';

const DEMO_SUPPLIERS: Omit<SupplierSuggestion, 'id'>[] = [
  {
    name: FRENCH_SUPPLIER_NETWORK[0],
    city: 'Paris — agence pro',
    phonePlaceholder: '+33 1 XX XX XX XX',
    emailPlaceholder: 'devis@pointp-demo.fr',
    productTypes: 'Gros œuvre, second œuvre, consommables',
    averageDelayDays: 3,
    supplierScore: 92,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[1],
    city: 'Lyon — réseau régional',
    phonePlaceholder: '+33 4 XX XX XX XX',
    emailPlaceholder: 'commandes@bigmat-demo.fr',
    productTypes: 'Carrelage, faïence, toiture',
    averageDelayDays: 5,
    supplierScore: 91,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[2],
    city: 'Bordeaux',
    phonePlaceholder: '+33 5 XX XX XX XX',
    emailPlaceholder: 'pro@gedimat-demo.fr',
    productTypes: 'Bois, couverture, isolation',
    averageDelayDays: 4,
    supplierScore: 88,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[3],
    city: 'Marseille',
    phonePlaceholder: '+33 4 XX XX XX XX',
    emailPlaceholder: 'achats@chausson-demo.fr',
    productTypes: 'Menuiserie, terrasse, plots',
    averageDelayDays: 4,
    supplierScore: 87,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[4],
    city: 'Grenoble — réseau Samse',
    phonePlaceholder: '+33 4 XX XX XX XX',
    emailPlaceholder: 'pro@samse-demo.fr',
    productTypes: 'Sanitaire, chauffage, carrelage, outillage',
    averageDelayDays: 3,
    supplierScore: 86,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[5],
    city: 'Lille — plateforme pro',
    phonePlaceholder: '+33 3 XX XX XX XX',
    emailPlaceholder: 'pro@dispano-demo.fr',
    productTypes: 'Panneaux, parquet, placo',
    averageDelayDays: 5,
    supplierScore: 86,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[6],
    city: 'Toulouse',
    phonePlaceholder: '+33 5 XX XX XX XX',
    emailPlaceholder: 'devis@plateforme-batiment-demo.fr',
    productTypes: 'Métallerie, façades, équipements',
    averageDelayDays: 7,
    supplierScore: 85,
    reliability: 'haute',
    averagePriceLevel: 'eleve',
    scope: 'national',
  },
  {
    name: FRENCH_SUPPLIER_NETWORK[7],
    city: 'France entière — click & collect pro',
    phonePlaceholder: '0800 XXX XXX',
    emailPlaceholder: 'pro@leroymerlin-demo.fr',
    productTypes: 'Peinture, outillage, électricité, sanitaire',
    averageDelayDays: 2,
    supplierScore: 84,
    reliability: 'haute',
    averagePriceLevel: 'moyen',
    scope: 'online',
  },
];

/**
 * Demo supplier search — réseau France uniquement (API à connecter).
 */
export function searchSuppliers(
  criteria: PurchaseSearchCriteria,
  products: ProductRecommendation[]
): SupplierSuggestion[] {
  const names = new Set(products.map((p) => p.supplier));
  const list: SupplierSuggestion[] = [];

  for (const s of DEMO_SUPPLIERS) {
    const matchProduct = products.some((p) => p.supplier === s.name);
    const scopeOk =
      criteria.scope === 'france' ||
      criteria.scope === 'online' ||
      s.scope === 'national' ||
      s.scope === 'online';
    if (!scopeOk && !matchProduct) continue;
    if (criteria.scope === 'online' && s.scope === 'national' && !matchProduct) continue;

    list.push({ id: `sup-${s.name.replace(/\s+/g, '-').toLowerCase()}`, ...s });
  }

  for (const name of names) {
    if (!list.some((l) => l.name === name)) {
      list.push({
        id: `sup-${name.replace(/\s+/g, '-').toLowerCase()}`,
        name,
        city: criteria.location || 'France',
        phonePlaceholder: '+33 X XX XX XX XX',
        emailPlaceholder: 'devis@fournisseur-demo.fr',
        productTypes: 'Produits chantier',
        averageDelayDays: 7,
        supplierScore: 80,
        reliability: 'moyenne',
        averagePriceLevel: 'moyen',
        scope: 'national',
      });
    }
  }

  return list.sort((a, b) => b.supplierScore - a.supplierScore).slice(0, 6);
}
