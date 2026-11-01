/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-clipboard.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });

  async function denied(viewport, isMobile, expected, forbidden) {
    const context = await browser.newContext({ viewport, isMobile, hasTouch: isMobile, colorScheme: 'light', serviceWorkers: 'block' });
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
    await context.close();
    return { toast, selection, errors };
  }

  const mobile = await denied({ width: 390, height: 844 }, true, 'use your copy menu', 'Ctrl/Cmd');
  const desktop = await denied({ width: 1280, height: 900 }, false, 'press Ctrl/Cmd+C', 'use your copy menu');
  console.log({ mobile, desktop });
  for (const [label, result, expected, forbidden] of [['mobile', mobile, 'use your copy menu', 'Ctrl/Cmd'], ['desktop', desktop, 'press Ctrl/Cmd+C', 'use your copy menu']]) {
    if (!result.toast.includes(expected)) throw new Error(`${label}: missing fallback copy: ${result.toast}`);
    if (result.toast.includes(forbidden)) throw new Error(`${label}: wrong fallback copy: ${result.toast}`);
    if (!result.selection.focused || result.selection.length < 20) throw new Error(`${label}: code was not selected`);
    if (result.errors.length) throw new Error(`${label}: ${result.errors.slice(0, 3).join(' | ')}`);
  }
  await browser.close();
})();
