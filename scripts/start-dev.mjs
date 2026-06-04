/**
 * Starts API server (port 3001) then Vite (5173).
 * Fixes ECONNREFUSED on /api/* when only `vite` was running.
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const API_PORT = Number(process.env.PORT ?? 3001);
const API_URL = `http://127.0.0.1:${API_PORT}`;

function waitForApi(maxMs = 30_000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(`${API_URL}/api/ai/health`, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) resolve();
        else if (Date.now() - start > maxMs) reject(new Error('API health timeout'));
        else setTimeout(tick, 400);
      });
      req.on('error', () => {
        if (Date.now() - start > maxMs) reject(new Error('API not reachable'));
        else setTimeout(tick, 400);
      });
    };
    tick();
  });
}

function run(command, args, label) {
  const child = spawn(command, args, {
    cwd: root,
    shell: process.platform === 'win32',
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  });
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(`[${label}] exited with code ${code}`);
  });
  return child;
}

console.log('Starting SmartChantier API (npm run api:plan)…');
const api = run('npx', ['tsx', 'server/index.ts'], 'api');

waitForApi()
  .then(() => {
    console.log(`API ready at ${API_URL}`);
    console.log('Starting Vite dev server…');
    run('npx', ['vite'], 'vite');
  })
  .catch((err) => {
    console.error(err.message);
    console.error('Tip: ensure port 3001 is free and Ollama is running (`ollama serve`).');
    api.kill();
    process.exit(1);
  });

function shutdown() {
  api.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
