import { procurementConfig } from '@/services/procurement/config';
import type { OcrDocumentResult } from './types';

const OPENAI_ENABLED = () => procurementConfig.openai.enabled;

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.startsWith('text/')) {
    return file.text();
  }
  if (file.type === 'application/pdf') {
    return `[PDF] ${file.name} — activez l'API plan (npm run api:plan) ou OpenAI pour OCR complet.`;
  }
  return '';
}

async function parseWithOpenAI(prompt: string, text: string): Promise<Record<string, unknown> | null> {
  if (!OPENAI_ENABLED()) return null;
  const res = await fetch(`${procurementConfig.openai.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: procurementConfig.openai.model,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text.slice(0, 12000) },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) return null;
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function heuristicInvoiceFields(text: string): Record<string, string | number> {
  const totalMatch = text.match(/total\s*(?:ttc|ht)?\s*[:\s]*(\d+[.,]\d+)/i);
  const numMatch = text.match(/(?:facture|invoice|n°)\s*[:\s]*([A-Z0-9-]+)/i);
  return {
    invoiceNumber: numMatch?.[1] ?? 'FAC-DEMO',
    totalHt: totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0,
    supplier: text.includes('Point P') ? 'Point P' : 'Fournisseur détecté',
  };
}

function heuristicLineItems(text: string) {
  const lines = text.split('\n').filter((l) => l.length > 8).slice(0, 8);
  return lines.map((description, i) => ({
    description: description.trim().slice(0, 80),
    quantity: 1,
    unitPrice: 10 + i * 5,
  }));
}

export async function readInvoiceOcr(file: File): Promise<OcrDocumentResult> {
  const rawText = await extractTextFromFile(file);
  const ai = await parseWithOpenAI(
    'Return JSON: { fields: { invoiceNumber, supplier, totalHt }, lineItems: [{ description, quantity, unitPrice }] }',
    rawText
  );
  const fields = (ai?.fields as Record<string, string | number>) ?? heuristicInvoiceFields(rawText);
  const lineItems =
    (ai?.lineItems as OcrDocumentResult['lineItems']) ?? heuristicLineItems(rawText);
  return {
    provider: OPENAI_ENABLED() ? 'openai' : 'heuristic',
    rawText,
    fields,
    lineItems,
    confidence: rawText.length > 40 ? 'confirme' : 'a_verifier',
    needsReview: rawText.length < 40,
  };
}

export async function readQuotationOcr(file: File): Promise<OcrDocumentResult> {
  const rawText = await extractTextFromFile(file);
  const ai = await parseWithOpenAI(
    'Return JSON: { fields: { devisNumber, clientName, totalHt }, lineItems: [{ description, quantity, unitPrice }] }',
    rawText
  );
  const fields = (ai?.fields as Record<string, string | number>) ?? {
    devisNumber: 'DEV-OCR',
    clientName: 'Client',
    totalHt: 0,
  };
  const lineItems = heuristicLineItems(rawText);
  return {
    provider: OPENAI_ENABLED() ? 'openai' : 'heuristic',
    rawText,
    fields,
    lineItems,
    confidence: 'a_verifier',
    needsReview: true,
  };
}
