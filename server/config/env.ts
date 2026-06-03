export const env = {
  port: Number(process.env.PORT ?? 3001),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  dataDir: process.env.DATA_DIR ?? 'server/data',
  defaultTenantId: process.env.DEFAULT_TENANT_ID ?? 'tenant_default',
  ai: {
    /** ollama (default) | heuristic | vision_api — OpenAI optional */
    ocrProvider: process.env.OCR_PROVIDER ?? 'ollama',
    visionApiUrl: process.env.VISION_API_URL ?? '',
    visionApiKey: process.env.VISION_API_KEY ?? '',
    colorApiUrl: process.env.COLOR_API_URL ?? '',
    openaiApiKey: process.env.OPENAI_API_KEY ?? '',
  },
  upload: {
    maxMb: Number(process.env.UPLOAD_MAX_MB ?? 25),
    dir: process.env.UPLOAD_DIR ?? 'server/uploads',
  },
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  tavilyApiKey: process.env.TAVILY_API_KEY ?? process.env.VITE_TAVILY_API_KEY ?? '',
};

export function isVisionApiConfigured(): boolean {
  return Boolean(env.ai.visionApiUrl && env.ai.visionApiKey);
}
