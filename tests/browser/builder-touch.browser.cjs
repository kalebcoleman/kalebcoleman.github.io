/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-touch.browser.cjs */
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
  await page.getByRole('button', { name: 'Reset the build to its starting ratings' }).click();
  await page.waitForTimeout(500);
  const slider = page.locator('#attr-0');
  await slider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const box = await slider.boundingBox();
  const scrollBefore = await page.evaluate(() => scrollY);
  const cdp = await context.newCDPSession(page);
  const x0 = box.x + box.width * 0.2;
  const y0 = box.y + box.height / 2;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x0, y: y0, id: 1 }] });
  for (let index = 1; index <= 8; index += 1) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x0 + index * 8, y: y0, id: 1 }] });
    await page.waitForTimeout(25);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  const dragged = Number(await page.locator('#attr-0').inputValue());
  if (dragged <= 51) throw new Error(`touch drag did not raise the attribute: ${dragged}`);
  if (await page.evaluate(() => scrollY) !== scrollBefore) throw new Error('touch drag scrolled the page');
  if (await slider.evaluate(node => getComputedStyle(node).touchAction) !== 'pan-y pinch-zoom') throw new Error('range touch-action is not pan-y');

  const step = page.locator('button[aria-label="Raise Close Shot"]');
  const stepBox = await step.boundingBox();
  const beforeStep = Number(await page.locator('#attr-0').inputValue());
  await page.touchscreen.tap(stepBox.x + stepBox.width / 2, stepBox.y + stepBox.height / 2);
  await page.waitForTimeout(400);
  const afterStep = Number(await page.locator('#attr-0').inputValue());
  if (afterStep !== beforeStep + 1) throw new Error(`stepper did not move exactly one point: ${beforeStep} -> ${afterStep}`);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  const wallSlider = page.locator('#attr-0');
  await wallSlider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const wallBox = await wallSlider.boundingBox();
  await page.mouse.move(wallBox.x + wallBox.width * 0.3, wallBox.y + wallBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(wallBox.x + wallBox.width * 0.9, wallBox.y + wallBox.height / 2, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(500);
  if (Number(await page.locator('#attr-0').inputValue()) !== 70) throw new Error('a rejected wall raise did not settle back to the legal value');

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.getByRole('button', { name: 'Reset the build to its starting ratings' }).click();
  await page.waitForTimeout(600);
  const steadySlider = page.locator('#attr-0');
  await steadySlider.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const steadyStep = page.locator('button[aria-label="Raise Close Shot"]');
  const steadyBox = await steadyStep.boundingBox();
  const steadyBefore = await page.evaluate(() => ({
    rowTop: Math.round(document.querySelector('[data-row="0"]').getBoundingClientRect().top),
    scrollY: Math.round(scrollY),
    value: Number(document.querySelector('#attr-0').value),
  }));
  for (let index = 0; index < 10; index += 1) {
    await page.touchscreen.tap(steadyBox.x + steadyBox.width / 2, steadyBox.y + steadyBox.height / 2);
    await page.waitForTimeout(60);
  }
  await page.waitForTimeout(700);
  const steadyAfter = await page.evaluate(() => ({
    rowTop: Math.round(document.querySelector('[data-row="0"]').getBoundingClientRect().top),
    scrollY: Math.round(scrollY),
    value: Number(document.querySelector('#attr-0').value),
  }));
  if (steadyAfter.rowTop !== steadyBefore.rowTop || steadyAfter.scrollY !== steadyBefore.scrollY) throw new Error(`burst moved the row/scroll: ${JSON.stringify({ steadyBefore, steadyAfter })}`);
  if (steadyAfter.value !== steadyBefore.value + 10) throw new Error(`burst did not apply every tap: ${steadyBefore.value} -> ${steadyAfter.value}`);
  if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error('horizontal overflow');
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  console.log({ drag: `${51} -> ${dragged}`, step: `${beforeStep} -> ${afterStep}`, wall: 'settled at 70', errors: 0 });
  await browser.close();
})();
