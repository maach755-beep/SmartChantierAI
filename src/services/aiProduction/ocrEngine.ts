import { ollamaChatJson } from '@/services/ai/ollamaClient';
import { getOllamaStatus, isOllamaTextReady } from '@/services/ai/ollamaClient';
import { OLLAMA_OFFLINE_MESSAGE, OLLAMA_TEXT_MODEL_MISSING } from '@/services/ai/ollamaConfig';
import { procurementConfig } from '@/services/procurement/config';
import type { OcrDocumentResult } from './types';

async function extractTextFromFile(file: File): Promise<string> {
  if (file.type.startsWith('text/')) {
    return file.text();
  }
  if (file.type === 'application/pdf') {
    return `[PDF] ${file.name} — utilisez l'API plan (npm run api:plan) avec Ollama llava pour l'OCR image, ou un PDF avec couche texte.`;
  }
  return '';
}

async function parseWithOpenAI(prompt: string, text: string): Promise<Record<string, unknown> | null> {
  if (!procurementConfig.openai.enabled) return null;
  try {
    const res = await fetch(`${procurementConfig.openai.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: procurementConfig.openai.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: prompt },
          { role: 'user', content: text.slice(0, 12000) },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function parseWithOllama(prompt: string, text: string): Promise<Record<string, unknown> | null> {
  const status = await getOllamaStatus();
  if (!isOllamaTextReady(status)) return null;
  return ollamaChatJson({ system: prompt, user: text.slice(0, 12000) });
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

async function parseDocument(
  prompt: string,
  rawText: string
): Promise<{ data: Record<string, unknown> | null; provider: string; fallbackNote?: string }> {
  const ollama = await parseWithOllama(prompt, rawText);
  if (ollama) return { data: ollama, provider: 'ollama' };

  const openai = await parseWithOpenAI(prompt, rawText);
  if (openai) return { data: openai, provider: 'openai-optional' };

  const status = await getOllamaStatus();
  const fallbackNote = !status.online
    ? OLLAMA_OFFLINE_MESSAGE
    : !status.textModel
      ? OLLAMA_TEXT_MODEL_MISSING
      : 'Analyse heuristique locale (sans LLM).';

  return { data: null, provider: 'heuristic', fallbackNote };
}

export async function readInvoiceOcr(file: File): Promise<OcrDocumentResult> {
  const rawText = await extractTextFromFile(file);
  const { data, provider, fallbackNote } = await parseDocument(
    'Return JSON: { fields: { invoiceNumber, supplier, totalHt }, lineItems: [{ description, quantity, unitPrice }] }',
    rawText
  );
  const fields = (data?.fields as Record<string, string | number>) ?? heuristicInvoiceFields(rawText);
  const lineItems =
    (data?.lineItems as OcrDocumentResult['lineItems']) ?? heuristicLineItems(rawText);
  return {
    provider,
    rawText: fallbackNote ? `${rawText}\n\nNote: ${fallbackNote}` : rawText,
    fields,
    lineItems,
    confidence: rawText.length > 40 && data ? 'confirme' : 'a_verifier',
    needsReview: rawText.length < 40 || !data,
  };
}

export async function readQuotationOcr(file: File): Promise<OcrDocumentResult> {
  const rawText = await extractTextFromFile(file);
  const { data, provider, fallbackNote } = await parseDocument(
    'Return JSON: { fields: { devisNumber, clientName, totalHt }, lineItems: [{ description, quantity, unitPrice }] }',
    rawText
  );
  const fields = (data?.fields as Record<string, string | number>) ?? {
    devisNumber: 'DEV-OCR',
    clientName: 'Client',
    totalHt: 0,
  };
  const lineItems = heuristicLineItems(rawText);
  return {
    provider,
    rawText: fallbackNote ? `${rawText}\n\nNote: ${fallbackNote}` : rawText,
    fields,
    lineItems,
    confidence: 'a_verifier',
    needsReview: true,
  };
}
