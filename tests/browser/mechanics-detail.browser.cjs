/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/mechanics-detail.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, colorScheme: 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:8123/mechanics/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);
    const first = page.locator('#mechanics .grid .card').first();
    const name = await first.locator('h2').innerText();
    await first.click();
    await page.waitForTimeout(300);
    const detail = page.locator('section[aria-label="Mechanics detail"]');
    if (await detail.count() !== 1 || await detail.isHidden()) throw new Error(`${label}: detail did not open`);
    const text = await detail.innerText();
    const tierRows = await detail.locator('table tbody tr').count();
    console.log(label, { name, tierRows, detail: text.slice(0, 160).replace(/\n/g, ' | ') });
    if (!text.includes(name) || tierRows !== 4) throw new Error(`${label}: detail is missing badge tier rows`);
    await detail.getByRole('button', { name: 'Back to results' }).click();
    if (!(await detail.isHidden())) throw new Error(`${label}: detail did not close`);
    if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error(`${label}: horizontal overflow`);
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
  await browser.close();
})();
