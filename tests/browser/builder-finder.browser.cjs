/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-finder.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, colorScheme: 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    await page.getByRole('button', { name: 'Find builds' }).click();
    await page.waitForFunction(() => [...document.querySelectorAll('#find p')].some(node => /result\(s\)|Search failed/.test(node.textContent)), null, { timeout: 60000 });
    const status = await page.evaluate(() => [...document.querySelectorAll('#find p')].map(node => node.textContent).find(text => /result\(s\)|Search failed/.test(text)));
    const rows = await page.evaluate(() => [...document.querySelectorAll('#find table tbody tr')].map(row => ({
      cells: [...row.cells].map(cell => cell.textContent.trim()),
      raw: row.cells[2]?.title ?? '',
    })));
    console.log(label, { status, rows: rows.length, first: rows[0] });
    if (!/12 result\(s\).*recovered reference finder/.test(status)) throw new Error(`${label}: finder did not return the recovered reference result`);
    if (rows.length !== 12) throw new Error(`${label}: expected 12 rows, got ${rows.length}`);
    if (!/^raw 9[0-8]\./.test(rows[0].raw)) throw new Error(`${label}: first row is not under the 99 wall: ${rows[0].raw}`);
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error(`${label}: horizontal overflow`);
    await context.close();
  }
  await browser.close();
})();
