/** Configuration fournisseurs / APIs — Ollama par défaut, OpenAI optionnel. */

export const procurementConfig = {
  country: 'France' as const,
  currency: 'EUR' as const,
  ollama: {
    enabled: true,
    textModel: import.meta.env.VITE_OLLAMA_TEXT_MODEL ?? 'llama3.1',
    visionModel: import.meta.env.VITE_OLLAMA_VISION_MODEL ?? 'llava',
  },
  openai: {
    enabled: Boolean(import.meta.env.VITE_OPENAI_API_KEY),
    model: import.meta.env.VITE_OPENAI_MODEL ?? 'gpt-4o-mini',
    baseUrl: import.meta.env.VITE_OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  },
  supabase: {
    enabled: Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY),
    catalogTable: import.meta.env.VITE_SUPABASE_CATALOG_TABLE ?? 'procurement_catalog',
  },
  supplierApi: {
    enabled: Boolean(import.meta.env.VITE_SUPPLIER_API_URL),
    baseUrl: import.meta.env.VITE_SUPPLIER_API_URL ?? '',
  },
  simulateNetworkMs: 650,
} as const;
