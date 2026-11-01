/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/cap-row.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, colorScheme: 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:8123/cap-breakers/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    const first = page.locator('#reference-cap-finder table tbody tr').first();
    const href = await first.getByRole('link', { name: /Build a/ }).getAttribute('href');
    if (!href || !href.includes('cbp=0') || !href.includes('cba=2')) throw new Error(`${label}: missing cap-breaker row handoff`);
    await first.getByRole('link', { name: /Build a/ }).click();
    await page.waitForURL(/\/builder/);
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => ({
      overall: document.querySelector('.overall')?.textContent ?? '',
      dunk: Number(document.querySelector('#attr-2')?.value),
      note: [...document.querySelectorAll('p')].map(node => node.textContent).find(text => /cap-breaker row/i.test(text)) ?? '',
      cap: localStorage.getItem('fb.lbrk'),
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    console.log(label, state);
    if (state.dunk < 77) throw new Error(`${label}: row landing was not applied`);
    if (!/raw 9[0-8]\./.test(state.overall)) throw new Error(`${label}: row build exceeds the wall: ${state.overall}`);
    if (!/Driving Dunk 28 → 77/.test(state.note) || !/5 cap breakers/.test(state.note)) throw new Error(`${label}: breaker plan was not labelled`);
    if (state.cap !== '5') throw new Error(`${label}: cap-breaker level was not stored`);
    if (state.overflow !== 0) throw new Error(`${label}: horizontal overflow`);
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
  await browser.close();
})();
