/**
 * Capture console errors when clicking "Générer Devis PDF" (default empty form).
 */
import puppeteer from 'puppeteer';

const URL = 'http://localhost:5173/assistant-devis-ia';
const consoleErrors = [];
const pageErrors = [];

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();

page.on('console', (msg) => {
  const type = msg.type();
  const text = msg.text();
  if (type === 'error' || text.includes('PDF ERROR') || text.includes('MESSAGE:') || text.includes('STACK:')) {
    consoleErrors.push(`[console.${type}] ${text}`);
  }
});

page.on('pageerror', (err) => {
  pageErrors.push(`[pageerror] ${err.message}\n${err.stack ?? ''}`);
});

await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

const buttons = await page.$$('button');
let clicked = false;
for (const btn of buttons) {
  const text = await page.evaluate((el) => el.textContent ?? '', btn);
  if (text.includes('Générer Devis PDF') || text.includes('Devis PDF')) {
    await btn.click();
    clicked = true;
    break;
  }
}

if (!clicked) {
  console.error('Button "Générer Devis PDF" not found');
  process.exit(1);
}

await new Promise((r) => setTimeout(r, 4000));
await browser.close();

console.log('=== CONSOLE ERRORS ===');
consoleErrors.forEach((l) => console.log(l));
console.log('=== PAGE ERRORS ===');
pageErrors.forEach((l) => console.log(l));

if (consoleErrors.length === 0 && pageErrors.length === 0) {
  console.log('No errors captured — export may have succeeded');
}
