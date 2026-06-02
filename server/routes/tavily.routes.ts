import { Router } from 'express';

export const tavilyRouter = Router();

tavilyRouter.post('/search', async (req, res) => {
  const apiKey =
    process.env.TAVILY_API_KEY?.trim() ||
    process.env.VITE_TAVILY_API_KEY?.trim() ||
    '';

  if (!apiKey) {
    res.status(503).json({
      error: 'TAVILY_API_KEY not configured on server',
    });
    return;
  }

  try {
    const upstream = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    const text = await upstream.text();
    res.status(upstream.status).type('application/json').send(text);
  } catch (err) {
    res.status(502).json({
      error: err instanceof Error ? err.message : 'Tavily proxy error',
    });
  }
});
