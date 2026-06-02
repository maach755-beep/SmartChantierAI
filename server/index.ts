import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { ensureSeed } from './db/seed.js';
import { tenantMiddleware } from './middleware/tenant.js';
import { planExtractionRouter } from './routes/v1/plan-extraction.routes.js';
import { siteDirectorRouter } from './routes/v1/site-director.routes.js';
import { tavilyRouter } from './routes/tavily.routes.js';

ensureSeed();

const app = express();

app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'SmartChantier API',
    version: '4.0.0',
    modules: ['plan-extraction', 'site-director'],
    ocrProvider: env.ai.ocrProvider,
    visionConfigured: Boolean(env.ai.visionApiUrl && env.ai.visionApiKey),
  });
});

app.use('/api/v1/plan-extraction', tenantMiddleware, planExtractionRouter);
app.use('/api/v1/site-director', tenantMiddleware, siteDirectorRouter);
app.use('/api/tavily', tavilyRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(500).json({ error: err.message });
});

app.listen(env.port, () => {
  console.log(`SmartChantier API http://localhost:${env.port}`);
  console.log(`Plan Extraction: http://localhost:${env.port}/api/v1/plan-extraction`);
});
