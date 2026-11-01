/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/build-doctor-history.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, colorScheme: 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack || error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1800);
    const doctor = page.locator('section[aria-label="Build Doctor"]');
    const history = page.locator('section[aria-label="Build history"]');
    if (await doctor.count() !== 1 || await history.count() !== 1) throw new Error(`${label}: doctor/history missing`);
    if (!/Overall/.test(await doctor.locator('.fb-doctor-status').innerText())) throw new Error(`${label}: doctor status missing`);

    await page.getByRole('button', { name: 'Reset the build to its starting ratings' }).click();
    await page.waitForTimeout(500);
    await doctor.getByRole('button', { name: 'Diagnose' }).click();
    await page.waitForTimeout(400);
    const changes = await doctor.locator('.fb-doctor-change').count();
    if (!changes) throw new Error(`${label}: doctor found no suggestions after reset`);
    const before = await page.locator('.overall').innerText();
    await doctor.locator('.fb-doctor-change').first().getByRole('button', { name: 'Apply' }).click();
    await page.waitForTimeout(700);
    const applied = await page.locator('.overall').innerText();
    if (applied === before) throw new Error(`${label}: doctor Apply did not change the build`);
    await page.getByRole('button', { name: 'Undo the last build change' }).click();
    await page.waitForTimeout(700);
    if ((await page.locator('.overall').innerText()) !== before) throw new Error(`${label}: history Undo did not restore the build`);

    await doctor.getByRole('button', { name: 'Plan to target' }).click();
    await page.waitForTimeout(800);
    const planText = await doctor.locator('.fb-doctor-plan').innerText();
    if (!/Reached 99/.test(planText)) throw new Error(`${label}: plan did not reach 99: ${planText}`);
    await doctor.locator('.fb-doctor-plan').getByRole('button', { name: 'Apply plan' }).click();
    await page.waitForTimeout(800);
    if (!(await page.locator('.overall').innerText()).startsWith('Overall 99')) throw new Error(`${label}: plan apply did not reach Overall 99`);

    await page.locator('.fb-doctor-badge summary').click();
    await page.locator('select[aria-label="Badge to diagnose"]').selectOption('0');
    await page.locator('select[aria-label="Badge tier to diagnose"]').selectOption('4');
    await page.getByRole('button', { name: 'Check badge' }).click();
    await page.waitForTimeout(400);
    const badgeText = await page.locator('.fb-doctor-badge-result').innerText();
    if (!/unreachable on this frame/i.test(badgeText)) throw new Error(`${label}: HOF unreachable state was not explained: ${badgeText}`);
    if (await page.locator('.fb-doctor-badge-result').getByRole('button', { name: /Write/ }).count()) throw new Error(`${label}: HOF still offers a dead write button`);
    if (!(await page.locator('.fb-doctor-badge-result').getByRole('link', { name: 'Find a body' }).count())) throw new Error(`${label}: HOF has no body/finder escape`);

    await page.locator('.fb-versions summary').click();
    await page.locator('input[aria-label="Version name"]').fill('Test version');
    await page.getByRole('button', { name: 'Save version' }).click();
    await page.waitForTimeout(300);
    if (!(await page.locator('.fb-version-list li').innerText()).includes('Test version')) throw new Error(`${label}: named version was not saved`);
    if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error(`${label}: horizontal overflow`);
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    await context.close();
  }
  await browser.close();
})();
