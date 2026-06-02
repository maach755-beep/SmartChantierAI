/** Plateforme France uniquement — pays, devise, TVA, référentiels métier. */

export const APP_COUNTRY = 'France' as const;
export const APP_COUNTRY_CODE = 'FR' as const;
export const APP_CURRENCY = 'EUR' as const;
export const APP_LOCALE = 'fr-FR' as const;

/** TVA construction France (taux normal). */
export const TVA_RATE = 0.2;

export const FRENCH_SUPPLIER_NETWORK = [
  'Point P',
  'BigMat',
  'Gedimat',
  'Chausson Matériaux',
  'Leroy Merlin Pro',
  'La Plateforme du Bâtiment',
  'Samse',
  'Dispano',
  'CEDEO',
  'Frans Bonhomme',
] as const;

export type FrenchSupplierName = (typeof FRENCH_SUPPLIER_NETWORK)[number];

/** Coûts horaires main-d'œuvre BTP France (€ HT / heure — ordres de grandeur 2024–2025). */
export const LABOR_RATES_EUR_HT = {
  manoeuvre: 42,
  ouvrierQualifie: 48,
  chefEquipe: 52,
  plombier: 55,
  electricien: 54,
  carreleur: 56,
  conducteurTravaux: 65,
} as const;

export function amountTTC(ht: number, rate = TVA_RATE): number {
  return Math.round(ht * (1 + rate) * 100) / 100;
}

export function amountHTFromTTC(ttc: number, rate = TVA_RATE): number {
  return Math.round((ttc / (1 + rate)) * 100) / 100;
}
