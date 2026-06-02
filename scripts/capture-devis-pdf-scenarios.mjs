/**
 * Capture PDF export error with partially filled form.
 */
import puppeteer from 'puppeteer';

async function capture(label, fillFn) {
  const consoleErrors = [];
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.includes('PDF ERROR FULL') || text.includes('MESSAGE:') || text.includes('STACK:')) {
      consoleErrors.push(text);
    }
  });
  page.on('pageerror', (err) => consoleErrors.push(`PAGE: ${err.message}`));

  await page.goto('http://localhost:5173/assistant-devis-ia', { waitUntil: 'networkidle2' });
  await fillFn(page);

  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate((el) => el.textContent ?? '', btn);
    if (text.includes('Générer Devis PDF')) {
      await btn.click();
      break;
    }
  }
  await new Promise((r) => setTimeout(r, 3000));
  await browser.close();
  console.log(`\n=== ${label} ===`);
  consoleErrors.forEach((l) => console.log(l));
}

await capture('client+site filled, line empty', async (page) => {
  const inputs = await page.$$('input');
  // clientName, city, siteAddress based on form order
  await inputs[0].type('Dupont');
  await inputs[2].type('12 rue Test Nice');
});

await capture('all mandatory filled', async (page) => {
  const inputs = await page.$$('input');
  await inputs[0].type('Dupont');
  await inputs[2].type('12 rue Test');
  // line fields in card - find description input in lines section
  await page.evaluate(() => {
    const labels = [...document.querySelectorAll('span')];
    const descLabel = labels.find((s) => s.textContent?.trim() === 'Description');
    const input = descLabel?.parentElement?.querySelector('input');
    if (input) {
      input.value = 'Carrelage test';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const priceLabels = labels.filter((s) => s.textContent?.trim() === 'Prix unit. HT');
    const priceInput = priceLabels[0]?.parentElement?.querySelector('input');
    if (priceInput) {
      priceInput.value = '0.05';
      priceInput.dispatchEvent(new Event('input', { bubbles: true }));
      priceInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
});
