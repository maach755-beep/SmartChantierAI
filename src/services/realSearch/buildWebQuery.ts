import type { ParsedProcurementQuery } from '@/types/procurementSearch';

/** Requêtes orientées fiches produit (pas pages d'accueil). */
const PRODUCT_QUERY_SUFFIX =
  'fiche produit prix HT référence acheter professionnel';

/** Construit une requête web ciblant des fiches produit BTP France. */
export function buildTavilyWebQuery(parsed: ParsedProcurementQuery): string {
  const terms: string[] = [];

  const core =
    parsed.materialType && parsed.materialType !== 'Matériaux BTP'
      ? parsed.materialType
      : parsed.rawQuery;

  terms.push(core.replace(/\s+/g, ' ').trim());

  if (parsed.formatHint) terms.push(parsed.formatHint);
  if (parsed.dimensions && parsed.dimensions !== parsed.formatHint) terms.push(parsed.dimensions);

  if (parsed.maxBudgetPerUnit > 0) {
    terms.push(`${parsed.maxBudgetPerUnit} €/${parsed.unit} HT`);
  }

  if (parsed.location) terms.push(parsed.location);
  terms.push('France', PRODUCT_QUERY_SUFFIX);

  const query = terms.join(' ').replace(/\s+/g, ' ').trim();
  return query.length > 400 ? query.slice(0, 400) : query;
}

/** Variante sans suffixe long — pour 2e passe si peu de fiches produit. */
export function buildTavilyProductFallbackQuery(parsed: ParsedProcurementQuery): string {
  const parts = [
    parsed.materialType !== 'Matériaux BTP' ? parsed.materialType : parsed.rawQuery,
    parsed.formatHint,
    parsed.maxBudgetPerUnit > 0 ? `${parsed.maxBudgetPerUnit} euro m2` : '',
    parsed.location,
    'produit prix référence site pro',
  ].filter(Boolean);
  const q = parts.join(' ').replace(/\s+/g, ' ').trim();
  return q.length > 400 ? q.slice(0, 400) : q;
}

export function buildTavilyWebQueryFromRaw(raw: string): string {
  const trimmed = raw.trim();
  const query = `${trimmed} France ${PRODUCT_QUERY_SUFFIX}`.replace(/\s+/g, ' ').trim();
  return query.length > 400 ? query.slice(0, 400) : query;
}
