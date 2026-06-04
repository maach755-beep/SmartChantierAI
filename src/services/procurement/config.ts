/** Configuration fournisseurs / APIs — Ollama par défaut, OpenAI optionnel. */

import { readAppEnv } from '@/utils/env';

export const procurementConfig = {
  country: 'France' as const,
  currency: 'EUR' as const,
  ollama: {
    enabled: true,
    textModel: readAppEnv('VITE_OLLAMA_TEXT_MODEL', 'llama3.1'),
    visionModel: readAppEnv('VITE_OLLAMA_VISION_MODEL', 'llava'),
  },
  openai: {
    enabled: Boolean(readAppEnv('VITE_OPENAI_API_KEY')),
    model: readAppEnv('VITE_OPENAI_MODEL', 'gpt-4o-mini'),
    baseUrl: readAppEnv('VITE_OPENAI_BASE_URL', 'https://api.openai.com/v1'),
  },
  supabase: {
    enabled: Boolean(readAppEnv('VITE_SUPABASE_URL') && readAppEnv('VITE_SUPABASE_ANON_KEY')),
    catalogTable: readAppEnv('VITE_SUPABASE_CATALOG_TABLE', 'procurement_catalog'),
  },
  supplierApi: {
    enabled: Boolean(readAppEnv('VITE_SUPPLIER_API_URL')),
    baseUrl: readAppEnv('VITE_SUPPLIER_API_URL'),
  },
  simulateNetworkMs: 650,
} as const;
