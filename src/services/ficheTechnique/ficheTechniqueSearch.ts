import { parseProcurementQuery } from '@/services/procurement/queryParser';
import { isRealWebSearchEnabled, TAVILY_UNCONFIGURED_MESSAGE } from '@/services/realSearch/config';
import {
  isBlockedSupplierUrl,
  SUPPLIER_UNAVAILABLE_MESSAGE,
} from '@/services/realSearch/supplierAvailability';
import { searchTavilyWeb } from '@/services/realSearch/tavilyProvider';
import type { FicheTechniqueSearchInput, FicheTechniqueSearchResult } from '@/types/ficheTechnique';
import {
  buildProvisionalRawData,
  extractTechnicalSheetFromResult,
  normalizeTechnicalSheet,
} from './ficheTechniqueNormalizer';

function buildSearchQuery(input: FicheTechniqueSearchInput): string {
  const parts = [
    input.productName.trim(),
    input.reference.trim(),
    input.brand.trim(),
    input.category.trim(),
    input.useCase.trim(),
    input.city.trim(),
  ].filter(Boolean);

  if (input.supplierUrl.trim()) {
    try {
      const host = new URL(input.supplierUrl.trim()).hostname.replace(/^www\./, '');
      parts.push(`site:${host}`);
    } catch {
      /* ignore invalid URL */
    }
  }

  return parts.join(' ').trim() || input.productName.trim();
}

function validateInput(input: FicheTechniqueSearchInput): string | null {
  if (!input.productName.trim()) {
    return 'Nom du produit';
  }
  const urlFields: [string, string][] = [
    [input.supplierUrl, 'URL fournisseur'],
    [input.manufacturerUrl, 'URL fabricant'],
  ];
  for (const [url, label] of urlFields) {
    if (url.trim()) {
      try {
        new URL(url.trim());
      } catch {
        return label;
      }
    }
  }
  return null;
}

/**
 * Recherche produit BTP via Tavily (fiches produit réelles) puis normalisation fiche technique.
 */
export async function searchTechnicalProduct(
  input: FicheTechniqueSearchInput
): Promise<FicheTechniqueSearchResult> {
  const invalid = validateInput(input);
  if (invalid) {
    throw new Error(`Champ obligatoire manquant ou invalide : ${invalid}`);
  }

  const queryUsed = buildSearchQuery(input);
  const searchConfigured = isRealWebSearchEnabled();

  if (input.supplierUrl.trim() && isBlockedSupplierUrl(input.supplierUrl.trim())) {
    const provisional = normalizeTechnicalSheet({
      ...buildProvisionalRawData(input),
      notes: SUPPLIER_UNAVAILABLE_MESSAGE,
    });
    return {
      products: [provisional],
      providerNote: SUPPLIER_UNAVAILABLE_MESSAGE,
      searchConfigured,
      queryUsed,
    };
  }

  if (!searchConfigured) {
    console.error('[ficheTechnique] Tavily non configuré:', TAVILY_UNCONFIGURED_MESSAGE);
    const provisional = normalizeTechnicalSheet(buildProvisionalRawData(input));
    return {
      products: [provisional],
      providerNote: TAVILY_UNCONFIGURED_MESSAGE,
      searchConfigured: false,
      queryUsed,
    };
  }

  try {
    const parsed = parseProcurementQuery(queryUsed);
    if (input.city.trim()) parsed.location = input.city.trim();
    if (input.useCase.trim()) parsed.usageHint = input.useCase.trim();

    const response = await searchTavilyWeb(parsed);
    const products = response.results.map((hit) =>
      normalizeTechnicalSheet(extractTechnicalSheetFromResult(hit, input))
    );

    if (products.length === 0) {
      console.error('[ficheTechnique] Aucun produit trouvé pour:', queryUsed);
      const provisional = normalizeTechnicalSheet({
        ...buildProvisionalRawData(input),
        notes: 'Aucun produit exact trouvé — fiche provisoire générée. Affinez la référence ou le nom.',
      });
      return {
        products: [provisional],
        providerNote: 'Aucun produit trouvé. Essayez une référence plus précise.',
        searchConfigured: true,
        queryUsed,
      };
    }

    return {
      products,
      providerNote: response.providerNote,
      searchConfigured: true,
      queryUsed,
    };
  } catch (err) {
    console.error('[ficheTechnique] Erreur recherche Tavily:', err);
    const provisional = normalizeTechnicalSheet({
      ...buildProvisionalRawData(input),
      notes: `Erreur recherche web — fiche provisoire. ${err instanceof Error ? err.message : String(err)}`,
    });
    return {
      products: [provisional],
      providerNote: 'Recherche web indisponible — fiche provisoire générée.',
      searchConfigured: true,
      queryUsed,
    };
  }
}
