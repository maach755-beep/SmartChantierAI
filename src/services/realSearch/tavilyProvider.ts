import type { ParsedProcurementQuery } from '@/types/procurementSearch';
import { buildTavilyProductFallbackQuery, buildTavilyWebQuery } from './buildWebQuery';
import {
  DEMO_SOURCE_LABEL,
  realSearchConfig,
  TAVILY_SOURCE_LABEL,
  TAVILY_UNCONFIGURED_MESSAGE,
} from './config';
import { classifyProductUrl, cleanProductTitle } from './productPageFilter';
import { extractProductFields } from './productExtractor';
import {
  detectSupplierFromText,
  detectSupplierFromUrl,
  getScrapeAllowedDomains,
  getScrapeAllowedSuppliers,
  type BtpSupplierTarget,
} from './supplierDomains';
import {
  collectPolicyBlockedSuppliers,
  dedupeUnavailable,
  getBlockedSupplierLog,
  isBlockedFetchError,
  isBlockedHttpStatus,
  isBlockedPageContent,
  isBlockedSupplierName,
  isBlockedSupplierUrl,
  markSupplierUnavailable,
  type SupplierUnavailableInfo,
} from './supplierAvailability';
import type { RealWebSearchHit, TavilySearchResponse } from './types';
import { WEB_PRODUCT_RESULTS_LIMIT } from './types';

interface TavilyApiResult {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string;
  score?: number;
}

interface TavilyApiPayload {
  query?: string;
  answer?: string;
  results?: TavilyApiResult[];
}

const TAVILY_FETCH_POOL = 20;

function resultContent(row: TavilyApiResult): string {
  return [row.content, row.raw_content].filter(Boolean).join(' ');
}

function mapTavilyHit(
  row: TavilyApiResult,
  index: number,
  parsed: ParsedProcurementQuery
): RealWebSearchHit | null {
  const url = row.url?.trim();
  const title = row.title?.trim();
  if (!url || !title) return null;

  if (isBlockedSupplierUrl(url)) return null;

  const content = resultContent(row);
  if (isBlockedPageContent(content) || isBlockedPageContent(title)) return null;

  const classification = classifyProductUrl(url, title, content);

  if (!classification.isProductPage) return null;

  const supplier =
    detectSupplierFromUrl(url) ?? detectSupplierFromText(`${title} ${content}`) ?? null;
  if (!supplier || isBlockedSupplierName(supplier)) return null;

  const extracted = extractProductFields(title, content, parsed.unit || 'm²');
  const productTitle = cleanProductTitle(extracted.productName, supplier);

  const tavilyScore = typeof row.score === 'number' ? row.score : 0.5;
  const confidence = Math.min(
    100,
    Math.round(classification.productPageScore * 0.55 + tavilyScore * 45)
  );

  const deliveryOrLocation =
    parsed.location && /(?:livraison|agence|magasin)/i.test(content)
      ? extractDeliverySnippet(content) || `Zone : ${parsed.location} — France`
      : parsed.location
        ? `Zone : ${parsed.location} — France`
        : 'France';

  const summaryParts = [
    extracted.priceLabel,
    extracted.availabilityLabel,
    extracted.reference ? `Réf. ${extracted.reference}` : '',
    content.slice(0, 160),
  ].filter(Boolean);

  return {
    id: `tavily-prod-${index}-${url.slice(-28).replace(/\W/g, '')}`,
    productTitle,
    supplierName: supplier,
    url,
    priceEurHt: extracted.priceEurHt,
    priceLabel: extracted.priceLabel,
    unit: extracted.unit,
    availability: extracted.availability,
    availabilityLabel: extracted.availabilityLabel,
    reference: extracted.reference,
    deliveryOrLocation: deliveryOrLocation.slice(0, 120),
    summary: summaryParts.join(' · ').slice(0, 300),
    confidence,
    productPageScore: classification.productPageScore,
    sourceLabel: TAVILY_SOURCE_LABEL,
    resultOrigin: 'real_web',
  };
}

function extractDeliverySnippet(text: string): string | null {
  const m = text.match(/(?:livraison|retrait|disponible)[^.]{0,90}/i);
  return m ? m[0].trim() : null;
}

function rankProductHits(hits: RealWebSearchHit[], parsed: ParsedProcurementQuery): RealWebSearchHit[] {
  const budget = parsed.maxBudgetPerUnit;

  return [...hits].sort((a, b) => {
    const scoreA = productRankScore(a, budget);
    const scoreB = productRankScore(b, budget);
    return scoreB - scoreA;
  });
}

function productRankScore(hit: RealWebSearchHit, budget: number): number {
  let s = hit.productPageScore * 0.35 + hit.confidence * 0.25;
  if (hit.priceEurHt != null && hit.priceEurHt > 0) {
    s += 25;
    if (budget > 0 && hit.priceEurHt <= budget) s += 15;
  }
  if (hit.availability === 'en_stock') s += 12;
  if (hit.availability === 'stock_faible') s += 6;
  if (hit.reference) s += 5;
  return s;
}

function resolveTavilySearchUrl(): string {
  const configured = realSearchConfig.tavily.searchUrl;
  if (configured.startsWith('http')) return configured;
  if (typeof window === 'undefined') return 'https://api.tavily.com/search';
  return configured;
}

async function callTavilyApi(
  query: string,
  includeDomains: string[]
): Promise<TavilyApiPayload> {
  const { apiKey, searchDepth } = realSearchConfig.tavily;
  const searchUrl = resolveTavilySearchUrl();

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const res = await fetch(searchUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query,
      search_depth: searchDepth,
      max_results: TAVILY_FETCH_POOL,
      include_answer: false,
      include_raw_content: true,
      include_domains: includeDomains.length > 0 ? includeDomains : getScrapeAllowedDomains(),
      country: 'france',
      topic: 'general',
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    if (isBlockedHttpStatus(res.status) || isBlockedPageContent(errText)) {
      throw new Error(`blocked:${res.status}`);
    }
    throw new Error(`Tavily ${res.status}: ${errText.slice(0, 200)}`);
  }

  return (await res.json()) as TavilyApiPayload;
}

function dedupeByUrl(hits: RealWebSearchHit[]): RealWebSearchHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const key = h.url.replace(/\/$/, '').toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hitsFromPayload(
  payload: TavilyApiPayload,
  parsed: ParsedProcurementQuery,
  indexOffset = 0
): RealWebSearchHit[] {
  return (payload.results ?? [])
    .map((r, i) => mapTavilyHit(r, i + indexOffset, parsed))
    .filter((h): h is RealWebSearchHit => h !== null);
}

async function fetchHitsForSupplier(
  supplier: BtpSupplierTarget,
  parsed: ParsedProcurementQuery,
  indexOffset: number
): Promise<RealWebSearchHit[]> {
  const query = `${buildTavilyWebQuery(parsed)} ${supplier.name}`.slice(0, 400);
  const domains = supplier.domains.filter(Boolean);
  if (!domains.length) return [];

  try {
    const payload = await callTavilyApi(query, domains);
    return hitsFromPayload(payload, parsed, indexOffset);
  } catch (error) {
    if (isBlockedFetchError(error) || (error instanceof Error && error.message.startsWith('blocked:'))) {
      markSupplierUnavailable(supplier.name, 'automated_requests_blocked');
    } else {
      markSupplierUnavailable(supplier.name, 'fetch_failed');
    }
    return [];
  }
}

async function fetchProductHits(parsed: ParsedProcurementQuery): Promise<{
  hits: RealWebSearchHit[];
  query: string;
  unavailableSuppliers: SupplierUnavailableInfo[];
}> {
  const unavailableSuppliers = dedupeUnavailable(collectPolicyBlockedSuppliers());
  const primaryQuery = buildTavilyWebQuery(parsed);
  const allowedDomains = getScrapeAllowedDomains();
  let hits: RealWebSearchHit[] = [];

  if (allowedDomains.length > 0) {
    try {
      const payload = await callTavilyApi(primaryQuery, allowedDomains);
      hits = dedupeByUrl(hitsFromPayload(payload, parsed));
    } catch (error) {
      console.warn('[SmartChantier] Tavily bulk search failed, continuing per supplier:', error);
    }
  }

  if (hits.length < WEB_PRODUCT_RESULTS_LIMIT) {
    try {
      const fallbackQuery = buildTavilyProductFallbackQuery(parsed);
      const payload2 = await callTavilyApi(fallbackQuery, allowedDomains);
      hits = dedupeByUrl([...hits, ...hitsFromPayload(payload2, parsed, 100)]);
    } catch {
      /* per-supplier pass below */
    }
  }

  if (hits.length < WEB_PRODUCT_RESULTS_LIMIT) {
    const suppliers = getScrapeAllowedSuppliers();
    let offset = 200;
    for (const supplier of suppliers) {
      if (hits.length >= WEB_PRODUCT_RESULTS_LIMIT) break;
      const more = await fetchHitsForSupplier(supplier, parsed, offset);
      offset += 50;
      if (more.length === 0) continue;
      hits = dedupeByUrl([...hits, ...more]);
    }
  }

  const ranked = rankProductHits(hits, parsed).slice(0, WEB_PRODUCT_RESULTS_LIMIT);
  return {
    hits: ranked,
    query: primaryQuery,
    unavailableSuppliers: dedupeUnavailable([...unavailableSuppliers, ...getBlockedSupplierLog()]),
  };
}

/**
 * Recherche web — fiches produit uniquement (liens directs, prix, dispo).
 * Blocked retailers (Leroy Merlin, Adeo) are skipped; search continues with other suppliers.
 */
export async function searchTavilyWeb(
  parsed: ParsedProcurementQuery
): Promise<TavilySearchResponse> {
  if (!realSearchConfig.tavily.enabled) {
    return {
      query: parsed.rawQuery,
      results: [],
      resultOrigin: 'demo',
      providerNote: TAVILY_UNCONFIGURED_MESSAGE,
      unavailableSuppliers: [],
    };
  }

  try {
    const { hits, query, unavailableSuppliers } = await fetchProductHits(parsed);

    const unavailableNote =
      unavailableSuppliers.length > 0
        ? ` ${unavailableSuppliers.map((u) => `${u.supplier}: ${u.message}`).join(' · ')}`
        : '';

    return {
      query,
      results: hits,
      resultOrigin: 'real_web',
      unavailableSuppliers,
      providerNote:
        hits.length > 0
          ? `${TAVILY_SOURCE_LABEL} — ${hits.length} fiche(s) produit (liens directs · France · EUR HT).${unavailableNote}`
          : `Aucune fiche produit trouvée parmi les fournisseurs disponibles.${unavailableNote}`,
    };
  } catch (error) {
    console.error('[SmartChantier] Tavily search error (non-fatal):', error);
    return {
      query: parsed.rawQuery,
      results: [],
      resultOrigin: 'demo',
      providerNote: demoFallbackNote(),
      unavailableSuppliers: dedupeUnavailable(collectPolicyBlockedSuppliers()),
    };
  }
}

export function emptyDemoSearchResponse(note: string): TavilySearchResponse {
  return {
    query: '',
    results: [],
    resultOrigin: 'demo',
    providerNote: note,
    unavailableSuppliers: [],
  };
}

export function demoFallbackNote(): string {
  return `${DEMO_SOURCE_LABEL} — aucune fiche produit web ou erreur Tavily. Données catalogue local.`;
}
