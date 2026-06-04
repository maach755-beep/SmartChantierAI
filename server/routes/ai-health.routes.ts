import { Router } from 'express';
import { getServerOllamaStatus } from '../services/ai/ollamaClient.js';
import { env } from '../config/env.js';

export const aiHealthRouter = Router();

/** GET /api/ai/health — AI connectivity check (Ollama default). */
aiHealthRouter.get('/health', async (_req, res) => {
  const ollama = await getServerOllamaStatus();
  const openaiConfigured = Boolean(process.env.OPENAI_API_KEY ?? process.env.VITE_OPENAI_API_KEY);
  res.json({
    ok: ollama.online && Boolean(ollama.textModel),
    service: 'SmartChantier AI',
    primaryProvider: 'ollama',
    openaiConfigured,
    openaiOptional: true,
    ollama,
    ocrProvider: env.ai.ocrProvider,
    checkedAt: new Date().toISOString(),
  });
});
