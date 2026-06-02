import { procurementConfig } from '@/services/procurement/config';
import type { ParsedProcurementQuery, ProcurementProjectType } from '@/types/procurementSearch';
import type { ProcurementProductResult } from '@/types/procurementSearch';
import { parseProcurementQuery } from './queryParser';

interface OpenAiParseJson {
  materialType?: string;
  dimensions?: string;
  format?: string;
  quantity?: number;
  unit?: string;
  budgetPerUnitEur?: number;
  city?: string;
  projectType?: string;
  category?: string;
}

export async function parseQueryWithOpenAI(raw: string): Promise<ParsedProcurementQuery | null> {
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
          {
            role: 'system',
            content:
              'Tu es un expert achats BTP France. Extrais les critères de recherche en JSON. ' +
              'Champs: materialType, dimensions, format (ex 60x60), quantity (nombre), unit (m²|ml|u), ' +
              'budgetPerUnitEur, city (France), projectType (terrasse|facade|interieur|renovation|neuf|piscine|autre), category (carrelage|parquet|...). ' +
              'Uniquement marché français, prix en EUR HT.',
          },
          { role: 'user', content: raw },
        ],
      }),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content) as OpenAiParseJson;
    const projectType = (parsed.projectType as ProcurementProjectType) || fallback.projectType;

    return {
      ...fallback,
      materialType: parsed.materialType ?? fallback.materialType,
      dimensions: parsed.dimensions ?? parsed.format ?? fallback.dimensions,
      formatHint: parsed.format ?? fallback.formatHint,
      quantity: parsed.quantity ?? fallback.quantity,
      unit: parsed.unit?.replace('m2', 'm²') ?? fallback.unit,
      maxBudgetPerUnit: parsed.budgetPerUnitEur ?? fallback.maxBudgetPerUnit,
      location: parsed.city ?? fallback.location,
      projectType,
      category: (parsed.category as ParsedProcurementQuery['category']) || fallback.category,
      parsedByAi: true,
    };
  } catch {
    return null;
  }
}

export async function generateOpenAiProcurementSummary(
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
              'Rédige une recommandation achat BTP concise en français (4-6 phrases). ' +
              'Mentionne quantité, budget, meilleur produit, fournisseur, délai, alternatives. EUR HT uniquement.',
          },
          {
            role: 'user',
            content: JSON.stringify({ query: parsed.rawQuery, parsed, topProducts: top, engine: insightText }),
          },
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

export async function resolveParsedQuery(raw: string): Promise<ParsedProcurementQuery> {
  const ai = await parseQueryWithOpenAI(raw);
  if (ai) return ai;
  return parseProcurementQuery(raw);
}
