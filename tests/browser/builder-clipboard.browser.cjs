/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-clipboard.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light', serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'Copy code' }).click();
  await page.waitForTimeout(500);
  const toast = await page.locator('#toast').innerText();
  const selection = await page.evaluate(() => {
    const input = document.querySelector('#view input.inp.code[readonly]');
    return { focused: document.activeElement === input, length: (input?.selectionEnd ?? 0) - (input?.selectionStart ?? 0) };
  });
  console.log({ toast, selection, errors: errors.slice(0, 3) });
  if (!/Copy failed/i.test(toast)) throw new Error('denied clipboard did not explain the fallback');
  if (!selection.focused || selection.length < 20) throw new Error('denied clipboard did not select the code');
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  await browser.close();
})();
