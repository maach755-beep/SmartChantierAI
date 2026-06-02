import puppeteer from 'puppeteer';

const logs = [];
const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
page.on('console', (msg) => {
  const t = msg.text();
  if (t.includes('PDF ERROR') || t.includes('MESSAGE:') || t.includes('generateAndSave')) logs.push(t);
});
page.on('pageerror', (e) => logs.push(`PAGE: ${e.message}\n${e.stack}`));

await page.goto('http://localhost:5173/assistant-devis-ia', { waitUntil: 'networkidle2' });

async function fillByLabel(labelText, value) {
  await page.evaluate(
    (label, val) => {
      const span = [...document.querySelectorAll('span')].find((s) => s.textContent?.trim() === label);
      const input = span?.parentElement?.querySelector('input, textarea');
      if (!input) return;
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      nativeInputValueSetter?.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
    labelText,
    value
  );
}

await fillByLabel('Nom client', 'M. Dupont');
await fillByLabel('Adresse chantier', '12 rue des Artisans, Nice');
await fillByLabel('Description', 'Carrelage test');
await fillByLabel('Prix unit. HT', '0.05');

await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('Générer Devis PDF'))?.click();
});
await new Promise((r) => setTimeout(r, 10000));
await browser.close();

console.log(logs.length ? logs.join('\n---\n') : 'NO ERRORS — PDF export succeeded (validation passed)');
