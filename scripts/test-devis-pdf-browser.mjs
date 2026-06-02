import puppeteer from 'puppeteer';
import { mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const downloadDir = join(process.cwd(), 'tmp', 'puppeteer-downloads');
mkdirSync(downloadDir, { recursive: true });

const errors = [];
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox'],
});

const page = await browser.newPage();
const client = await page.createCDPSession();
await client.send('Page.setDownloadBehavior', {
  behavior: 'allow',
  downloadPath: downloadDir,
});

page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (msg) => {
  if (msg.type() === 'error' && !msg.text().includes('same key')) errors.push(msg.text());
});

await page.goto('http://localhost:5173/assistant-devis-ia', { waitUntil: 'networkidle2' });

async function fillByLabel(labelText, value) {
  await page.evaluate(
    (label, val) => {
      const span = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === label);
      const input = span?.parentElement?.querySelector('input, textarea');
      if (!input) throw new Error(`Input not found for label: ${label}`);
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    labelText,
    value
  );
}

await fillByLabel('Nom client', 'Test Client');
await fillByLabel('Adresse chantier', 'Chantier Nice');
await fillByLabel('Description', 'test');
await fillByLabel('Prix unit. HT', '0.05');

await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Générer Devis PDF'))?.click();
});

await new Promise((r) => setTimeout(r, 12000));
await browser.close();

const pdfs = readdirSync(downloadDir).filter((f) => f.endsWith('.pdf'));
const okPdf = pdfs.find((f) => {
  const buf = readFileSafe(join(downloadDir, f));
  return buf && buf.length > 20000 && buf.subarray(0, 5).toString('ascii') === '%PDF-';
});

function readFileSafe(p) {
  try {
    return require('node:fs').readFileSync(p);
  } catch {
    return null;
  }
}

if (errors.length) {
  console.error('FAILED — page errors:', errors.join('\n'));
  process.exit(1);
}
if (!okPdf) {
  console.error('FAILED — no valid PDF in', downloadDir, 'files:', pdfs);
  process.exit(1);
}
console.log('OK — PDF downloaded:', okPdf, `(${readFileSafe(join(downloadDir, okPdf)).length} bytes), no errors`);
