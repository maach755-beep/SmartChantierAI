import { Router } from 'express';
import { getServerOllamaStatus } from '../services/ai/ollamaClient.js';

export const ollamaRouter = Router();

ollamaRouter.get('/status', async (_req, res) => {
  const status = await getServerOllamaStatus();
  res.json({
    ok: status.online,
    defaultProvider: 'ollama',
    openaiRequired: false,
    ...status,
  });
});
