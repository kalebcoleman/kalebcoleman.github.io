/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/fuse-planner.browser.cjs */
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
    await page.waitForTimeout(1500);
    const panel = page.locator('section[aria-label="Fuse planner"]');
    if (await panel.count() !== 1) throw new Error(`${label}: fuse planner missing`);
    const initial = await panel.locator('.fuse-summary').innerText();
    if (!/planned tiers/.test(initial) || !/tokens/.test(initial)) throw new Error(`${label}: summary missing: ${initial}`);
    if (await panel.locator('.fuse-slot-table tbody tr').count() !== 8) throw new Error(`${label}: expected 8 fuse slots`);
    await panel.getByRole('button', { name: 'My picks' }).click();
    await panel.locator('select[aria-label="Fuse slots"]').selectOption('4');
    await panel.locator('select[aria-label="+2 fuse slots"]').selectOption('2');
    const labels = await panel.locator('.fuse-slot-table tbody tr td:first-child').allInnerTexts();
    if (labels.join('|') !== '1 +2|2 +2|3 +1|4 +1') throw new Error(`${label}: slot boosts wrong: ${labels.join('|')}`);
    await panel.locator('.fuse-pins summary').click();
    const pin = panel.locator('.fuse-pin select').first();
    const pinValues = await pin.locator('option').evaluateAll(options => options.map(option => option.value));
    if (pinValues.length > 1) await pin.selectOption(pinValues[1]);
    await panel.locator('.fuse-flex summary').click();
    const flex = panel.locator('.fuse-flex-row input').first();
    await flex.fill('2');
    await flex.dispatchEvent('change');
    const after = await panel.locator('.fuse-summary').innerText();
    if (!/52 tokens/.test(after)) throw new Error(`${label}: flex tokens not applied: ${after}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error(`${label}: horizontal overflow`);
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
  await browser.close();
})();
