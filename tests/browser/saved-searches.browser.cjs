/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/saved-searches.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 }, colorScheme: 'light', serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.locator('.fb-saved-searches summary').click();
  await page.locator('#finder-target-6').fill('60');
  await page.locator('input[aria-label="Saved search name"]').fill('3PT 60');
  await page.getByRole('button', { name: 'Save current' }).click();
  await page.waitForTimeout(300);
  if (!(await page.locator('.fb-saved-list li').first().innerText()).includes('3PT 60')) throw new Error('saved search did not appear');
  await page.locator('#finder-target-6').fill('0');
  await page.locator('.fb-saved-list li').first().getByRole('button', { name: 'Load saved search 3PT 60' }).click();
  await page.waitForTimeout(300);
  if (await page.locator('#finder-target-6').inputValue() !== '60') throw new Error('saved search did not load its target');
  await page.locator('.fb-saved-list li').first().getByRole('button', { name: 'Run saved search 3PT 60' }).click();
  await page.waitForFunction(() => [...document.querySelectorAll('#find p')].some(node => /result\(s\)/.test(node.textContent)), null, { timeout: 60000 });
  const status = await page.evaluate(() => [...document.querySelectorAll('#find p')].map(node => node.textContent).find(text => /result\(s\)/.test(text)));
  if (!/12 result\(s\)/.test(status)) throw new Error(`saved search run failed: ${status}`);

  await page.getByRole('button', { name: 'Copy link' }).click();
  await page.waitForTimeout(400);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const shared = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: 'light', serviceWorkers: 'block' });
  const sharedPage = await shared.newPage();
  await sharedPage.goto(link, { waitUntil: 'networkidle' });
  await sharedPage.waitForTimeout(1800);
  if (await sharedPage.locator('#finder-target-6').inputValue() !== '60') throw new Error('shared search link did not prefill the target');
  if (await sharedPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error('shared search page overflows at 390');
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  console.log({ saved: 'ok', loaded: 'ok', run: status, shared: 'ok' });
  await browser.close();
})();
