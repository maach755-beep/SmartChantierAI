import { procurementConfig } from '@/services/procurement/config';
import { ollamaChat, ollamaChatJson } from '@/services/ai/ollamaClient';
import { OLLAMA_OFFLINE_MESSAGE, OLLAMA_TEXT_MODEL_MISSING } from '@/services/ai/ollamaConfig';
import type { ParsedProcurementQuery, ProcurementProductResult, ProcurementProjectType } from '@/types/procurementSearch';
import { coerceAiStringField } from '@/utils/safeRenderValue';
import { parseProcurementQuery } from './queryParser';

export type LlmProviderUsed = 'ollama' | 'openai' | null;

interface LlmParseJson {
  materialType?: unknown;
  dimensions?: unknown;
  format?: unknown;
  quantity?: number;
  unit?: string;
  budgetPerUnitEur?: number;
  city?: string;
  projectType?: string;
  category?: string;
}

const PARSE_SYSTEM =
  'Tu es un expert achats BTP France. Extrais les critères de recherche en JSON. ' +
  'Champs: materialType, dimensions, format (ex 60x60), quantity (nombre), unit (m²|ml|u), ' +
  'budgetPerUnitEur, city (France), projectType (terrasse|facade|interieur|renovation|neuf|piscine|autre), category (carrelage|parquet|...). ' +
  'Marché français, prix EUR HT.';

function mergeParseJson(fallback: ParsedProcurementQuery, parsed: LlmParseJson, provider: LlmProviderUsed): ParsedProcurementQuery {
  const projectType = (parsed.projectType as ProcurementProjectType) || fallback.projectType;
  const dimensionsFromAi = coerceAiStringField(
    parsed.dimensions ?? parsed.format,
    fallback.dimensions
  );
  const formatHintFromAi = coerceAiStringField(parsed.format, fallback.formatHint);
  return {
    ...fallback,
    materialType: coerceAiStringField(parsed.materialType, fallback.materialType),
    dimensions: dimensionsFromAi || formatHintFromAi || fallback.dimensions,
    formatHint: formatHintFromAi || dimensionsFromAi || fallback.formatHint,
    quantity: parsed.quantity ?? fallback.quantity,
    unit: parsed.unit?.replace('m2', 'm²') ?? fallback.unit,
    maxBudgetPerUnit: parsed.budgetPerUnitEur ?? fallback.maxBudgetPerUnit,
    location: parsed.city ?? fallback.location,
    projectType,
    category: (parsed.category as ParsedProcurementQuery['category']) || fallback.category,
    parsedByAi: true,
    llmProvider: provider,
  };
}

async function parseQueryWithOllama(raw: string): Promise<ParsedProcurementQuery | null> {
  const json = await ollamaChatJson({ system: PARSE_SYSTEM, user: raw });
  if (!json) return null;
  return mergeParseJson(parseProcurementQuery(raw), json as LlmParseJson, 'ollama');
}

async function parseQueryWithOpenAI(raw: string): Promise<ParsedProcurementQuery | null> {
  if (!procurementConfig.openai.enabled) return null;
  const fallback = parseProcurementQuery(raw);
  try {
    const res = await fetch(`${procurementConfig.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: procurementConfig.openai.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: PARSE_SYSTEM },
          { role: 'user', content: raw },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return mergeParseJson(fallback, JSON.parse(content) as LlmParseJson, 'openai');
  } catch {
    return null;
  }
}

async function generateSummaryWithOllama(
  parsed: ParsedProcurementQuery,
  results: ProcurementProductResult[],
  insightText: string
): Promise<string | null> {
  const top = results.slice(0, 4).map((r) => ({
    name: r.productName,
    supplier: r.supplier,
    price: r.priceEurHt,
    score: r.scores.composite,
    delivery: r.deliveryLabel,
  }));

  const reply = await ollamaChat({
    system:
      'Rédige une recommandation achat BTP concise en français (4-6 phrases). ' +
      'Mentionne quantité, budget, meilleur produit, fournisseur, délai, alternatives. EUR HT uniquement.',
    user: JSON.stringify({ query: parsed.rawQuery, parsed, topProducts: top, engine: insightText }),
  });
  return reply?.content ?? null;
}

async function generateSummaryWithOpenAI(
  parsed: ParsedProcurementQuery,
  results: ProcurementProductResult[],
  insightText: string
): Promise<string | null> {
  if (!procurementConfig.openai.enabled || results.length === 0) return null;
  const top = results.slice(0, 4).map((r) => ({
    name: r.productName,
    supplier: r.supplier,
    price: r.priceEurHt,
    score: r.scores.composite,
    delivery: r.deliveryLabel,
  }));
  try {
    const res = await fetch(`${procurementConfig.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: procurementConfig.openai.model,
        temperature: 0.4,
        messages: [
          {
            role: 'system',
            content:
              'Rédige une recommandation achat BTP concise en français (4-6 phrases). EUR HT uniquement.',
          },
          { role: 'user', content: JSON.stringify({ query: parsed.rawQuery, parsed, topProducts: top, engine: insightText }) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

/** Ollama first, OpenAI optional, then rule-based parser. */
export async function resolveParsedQuery(raw: string): Promise<ParsedProcurementQuery> {
  const ollama = await parseQueryWithOllama(raw);
  if (ollama) return ollama;
  const openai = await parseQueryWithOpenAI(raw);
  if (openai) return openai;
  return { ...parseProcurementQuery(raw), llmProvider: null };
}

export async function generateLlmProcurementSummary(
  parsed: ParsedProcurementQuery,
  results: ProcurementProductResult[],
  insightText: string
): Promise<{ summary: string; provider: LlmProviderUsed; fallbackNote?: string }> {
  if (results.length === 0) {
    return { summary: insightText, provider: null };
  }

  const ollamaSummary = await generateSummaryWithOllama(parsed, results, insightText);
  if (ollamaSummary) return { summary: ollamaSummary, provider: 'ollama' };

  const openaiSummary = await generateSummaryWithOpenAI(parsed, results, insightText);
  if (openaiSummary) return { summary: openaiSummary, provider: 'openai' };

  const note = procurementConfig.openai.enabled
    ? OLLAMA_TEXT_MODEL_MISSING
    : `${OLLAMA_OFFLINE_MESSAGE} — analyse locale utilisée.`;

  return { summary: insightText, provider: null, fallbackNote: note };
}

/** @deprecated use resolveParsedQuery — OpenAI optional */
export { parseQueryWithOpenAI };

/** @deprecated use generateLlmProcurementSummary */
export const generateOpenAiProcurementSummary = async (
  parsed: ParsedProcurementQuery,
  results: ProcurementProductResult[],
  insightText: string
): Promise<string | null> => {
  const r = await generateLlmProcurementSummary(parsed, results, insightText);
  return r.summary;
};
