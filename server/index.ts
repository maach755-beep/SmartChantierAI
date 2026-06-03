import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ensureSeed } from './db/seed.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { planExtractionRouter } from './routes/v1/plan-extraction.routes.js';
import { siteDirectorRouter } from './routes/v1/site-director.routes.js';
import { tavilyRouter } from './routes/tavily.routes.js';
import { ollamaRouter } from './routes/ollama.routes.js';

ensureSeed();

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  const { getServerOllamaStatus } = await import('./services/ai/ollamaClient.js');
  const ollama = await getServerOllamaStatus();
  res.json({
    ok: true,
    service: 'SmartChantier API',
    version: '4.1.0',
    modules: ['plan-extraction', 'site-director', 'ollama'],
    aiDefault: 'ollama',
    openaiOptional: true,
    ocrProvider: env.ai.ocrProvider,
    ollama,
    visionApiConfigured: Boolean(env.ai.visionApiUrl && env.ai.visionApiKey),
  });
});

app.use('/api/ollama', ollamaRouter);

app.use('/api/v1/plan-extraction', tenantMiddleware, planExtractionRouter);
app.use('/api/v1/site-director', tenantMiddleware, siteDirectorRouter);
app.use('/api/tavily', tavilyRouter);

app.use((err: Error, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  void next;
  res.status(500).json({ error: err.message });
});

app.listen(env.port, () => {
  console.log(`SmartChantier API http://localhost:${env.port}`);
  console.log(`Plan Extraction: http://localhost:${env.port}/api/v1/plan-extraction`);
});
