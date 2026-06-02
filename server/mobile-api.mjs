/**
 * SmartChantier AI — Mobile REST API (demo stub)
 * Run: node server/mobile-api.mjs
 * Endpoints documented in src/services/api/mobileApi.ts
 */
import http from 'node:http';

const PORT = process.env.PORT ?? 3001;

const routes = `
GET  /api/v1/projects
POST /api/v1/projects
GET  /api/v1/projects/:id
PUT  /api/v1/projects/:id
DELETE /api/v1/projects/:id
GET  /api/v1/sites/active | delayed | at-risk
GET  /api/v1/sites/:id/timeline
GET  /api/v1/team
GET  /api/v1/attendance
GET  /api/v1/materials
GET  /api/v1/materials/requests
GET  /api/v1/materials/alerts
GET  /api/v1/documents
POST /api/v1/documents
GET  /api/v1/documents/search?q=
GET  /api/v1/notifications
GET  /api/v1/tasks
GET  /api/v1/photos
GET  /api/v1/risks
GET  /api/v1/reports/daily|weekly|monthly
`;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  if (url.pathname === '/api/v1/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'SmartChantier Mobile API', mode: 'stub' }));
    return;
  }
  if (url.pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`SmartChantier Mobile API\n${routes}\nConnect frontend with VITE_API_URL=http://localhost:${PORT}`);
    return;
  }
  res.writeHead(501, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'Stub server — use in-app demo mode (dataStore) or wire to Express + DB',
      path: url.pathname,
      hint: 'Set VITE_API_URL empty for browser demo; implement persistence in production',
    })
  );
});

server.listen(PORT, () => {
  console.log(`SmartChantier API stub http://localhost:${PORT}`);
});
