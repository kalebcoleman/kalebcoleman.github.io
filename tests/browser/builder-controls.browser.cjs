/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-controls.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8123/builder', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  await page.getByRole('button', { name: 'Reset the build to its starting ratings' }).click();
  await page.waitForTimeout(500);
  if (!(await page.locator('.overall').innerText()).startsWith('Overall 60')) throw new Error('Reset did not return to the starting build');

  await page.getByRole('button', { name: 'Clear the stored cap-breaker level' }).click();
  await page.waitForTimeout(300);
  if (await page.evaluate(() => localStorage.getItem('fb.lbrk')) !== '0') throw new Error('Clear breakers did not clear fb.lbrk');

  await page.locator('#buildName').fill('DOM control test');
  await page.getByRole('button', { name: 'Keep my build name' }).click();
  await page.waitForTimeout(300);
  if (await page.evaluate(() => localStorage.getItem('fb.build.tag')) !== 'DOM control test') throw new Error('Keep name did not persist');

  const before = await page.locator('.overall').innerText();
  await page.getByRole('button', { name: 'Fill the build to the 99 overall wall' }).click();
  await page.waitForTimeout(1200);
  const after = await page.locator('.overall').innerText();
  if (!after.includes('Overall') || after === before) throw new Error('Fill to 99 did not change the build');

  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  console.log({ reset: 'ok', clearBreakers: 'ok', keepName: 'ok', fillTo99: after });
  await browser.close();
})();
