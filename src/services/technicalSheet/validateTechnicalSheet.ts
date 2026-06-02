import type { TechnicalSheetInput } from '@/types/technicalSheet';

export function validateTechnicalSheetInput(input: TechnicalSheetInput): string | null {
  if (!input.productName.trim()) {
    return 'Nom du produit';
  }
  if (input.supplierUrl.trim()) {
    try {
      new URL(input.supplierUrl.trim());
    } catch {
      return 'URL fournisseur';
    }
  }
  return null;
}

export function formatTechnicalSheetValidationError(field: string): string {
  return `Champ obligatoire manquant ou invalide : ${field}`;
}
