/**
 * AI + API smoke tests — run with API server up: npm run api:plan
 */
import http from 'node:http';

const BASE = process.env.API_BASE ?? 'http://127.0.0.1:3001';
const TENANT = 'tenant_default';

const results = { passed: [], failed: [], fixed: [] };

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const payload = body ? JSON.stringify(body) : undefined;
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT,
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, json: data ? JSON.parse(data) : {} });
          } catch {
            resolve({ status: res.statusCode, json: { raw: data } });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    results.passed.push(name);
    console.log(`PASS  ${name}`);
  } catch (e) {
    results.failed.push({ name, error: e instanceof Error ? e.message : String(e) });
    console.log(`FAIL  ${name} — ${e instanceof Error ? e.message : e}`);
  }
}

const snapshot = {
  chantiers: [
    {
      id: 'ch_test',
      name: 'Test Chantier',
      client: 'Client Demo',
      status: 'active',
      progress: 45,
      budgetPlanned: 100000,
      budgetConsumed: 52000,
      delayDays: 3,
      riskLevel: 'orange',
      manager: 'Chef Projet',
    },
  ],
  tasks: [],
  materials: [],
  suppliers: [],
  risks: [],
  team: [],
  attendance: [{ present: true, absent: false, chantierId: 'ch_test' }],
  modifications: [],
  materialRequests: [],
};

await test('GET /api/ai/health', async () => {
  const { status, json } = await request('GET', '/api/ai/health');
  if (status !== 200) throw new Error(`status ${status}`);
  if (!json.ollama) throw new Error('missing ollama payload');
});

await test('GET /api/health', async () => {
  const { status, json } = await request('GET', '/api/health');
  if (status !== 200 || !json.ok) throw new Error(`status ${status}`);
});

await test('GET /api/ollama/status', async () => {
  const { status, json } = await request('GET', '/api/ollama/status');
  if (status !== 200) throw new Error(`status ${status}`);
  if (json.defaultProvider !== 'ollama') throw new Error('wrong default provider');
});

await test('POST /api/v1/site-director/analyze (project analysis)', async () => {
  const { status, json } = await request('POST', '/api/v1/site-director/analyze', {
    snapshot,
    focusProjectId: 'ch_test',
  });
  if (status !== 200 || !json.data?.briefing) throw new Error(`status ${status}`);
});

await test('GET /api/v1/plan-extraction/projects', async () => {
  const { status, json } = await request('GET', '/api/v1/plan-extraction/projects');
  if (status !== 200 || !Array.isArray(json.data)) throw new Error(`status ${status}`);
});

await test('POST /api/v1/plan-extraction/assistant', async () => {
  const { status: listStatus, json: list } = await request('GET', '/api/v1/plan-extraction/projects');
  if (listStatus !== 200 || !list.data?.length) throw new Error('no projects seeded');
  const projectId = list.data[0].id;
  const { status, json } = await request('POST', '/api/v1/plan-extraction/assistant', {
    projectId,
    question: 'Quelle surface S1 restante ?',
    lang: 'fr',
  });
  if (status !== 200 || !json.data?.answer) throw new Error(`status ${status}`);
});

console.log('\n--- Summary ---');
console.log(`Passed: ${results.passed.length}`);
console.log(`Failed: ${results.failed.length}`);
if (results.failed.length) process.exit(1);
