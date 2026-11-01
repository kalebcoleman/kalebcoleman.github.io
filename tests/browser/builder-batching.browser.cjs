/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-batching.browser.cjs */
const { chromium } = require('playwright');

function valueOf(code) {
  const params = new URLSearchParams(code);
  return Number((params.get('v') || '').split('.')[0]);
}

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: 'light', serviceWorkers: 'block', permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  async function reset() {
    await page.evaluate(() => {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('fb-load-') || key.startsWith('fb.load') || key === 'fb.history.v1' || key === 'fb.versions.v1') localStorage.removeItem(key);
      }
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1600);
    await page.getByRole('button', { name: 'Reset the build to its starting ratings' }).click();
    await page.waitForTimeout(600);
    const step = page.locator('button[aria-label="Raise Close Shot"]');
    await step.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    return step.boundingBox();
  }

  async function taps(box, count, gap = 60) {
    for (let index = 0; index < count; index += 1) {
      await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(gap);
    }
  }

  const code = () => page.evaluate(() => [...document.querySelectorAll('#view input.inp.code')].find(input => input.value.startsWith('p='))?.value ?? '');

  // 1. Copy code immediately after a burst.
  let box = await reset();
  await taps(box, 5);
  await page.getByRole('button', { name: 'Copy code' }).click();
  await page.waitForTimeout(400);
  const copyCode = await code();
  if (valueOf(copyCode) !== 56) throw new Error(`copy used a pre-batch value: ${valueOf(copyCode)}`);

  // 2. Save to this device immediately after a burst.
  box = await reset();
  await taps(box, 3);
  await page.getByRole('button', { name: 'Save to this device' }).click();
  await page.waitForTimeout(500);
  const saved = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(name => name.startsWith('fb-load-') || name.startsWith('fb.load'));
    return { key, value: key ? localStorage.getItem(key) : '', keys: Object.keys(localStorage) };
  });
  if (valueOf(saved.value) !== 54) throw new Error(`save used a pre-batch value: ${valueOf(saved.value)}`);

  // 3. Undo immediately after a burst: the final state must be in history.
  box = await reset();
  await taps(box, 4);
  await page.getByRole('button', { name: 'Undo the last build change' }).click();
  await page.waitForTimeout(500);
  const history = await page.evaluate(() => JSON.parse(localStorage.getItem('fb.history.v1') || '[]'));
  if (!history.some(entry => valueOf(entry.code) === 55)) throw new Error('history did not capture the final burst value');
  if (valueOf(await code()) !== 51) throw new Error('undo did not restore the previous build');

  // 4. Range pointerdown cancels a pending stepper preview.
  box = await reset();
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(20);
  await page.locator('#attr-0').dispatchEvent('pointerdown');
  await page.locator('#attr-0').dispatchEvent('pointerup');
  await page.waitForTimeout(250);
  if (await page.locator('#attr-0').inputValue() !== '51') throw new Error('pending stepper was not cancelled by range pointerdown');
  if (valueOf(await code()) !== 51) throw new Error('cancelled stepper still reached the share code');

  if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error('horizontal overflow');
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  console.log({ copy: valueOf(copyCode), save: valueOf(saved.value), history: 'captured 55', cancel: '51', errors: 0 });
  await browser.close();
})();
