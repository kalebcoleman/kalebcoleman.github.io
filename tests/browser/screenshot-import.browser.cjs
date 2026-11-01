/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/screenshot-import.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8123/builder', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  // Exercise the real engine mapping and validation functions with a synthetic OCR payload.
  const engine = await page.evaluate(() => {
    const G = window.GBLE;
    let pos = document.getElementById('pos');
    if (!pos) { pos = document.createElement('i'); pos.id = 'pos'; pos.hidden = true; document.body.append(pos); }
    pos.value = '0';
    const attrs = Object.fromEntries(G.ATTRS.map((name, index) => [name, index === 0 ? 77 : 60]));
    const raw = G.ocrToRaw({ ok: true, pos: 0, height: 75, weight: 170, wingspan: 81, attrs, layout: 'A' });
    const checked = G.vetImport(raw);
    return { layout: raw._layout, body: checked.body, got: checked.got, bad: checked.bad };
  });
  console.log('engine', engine);
  if (engine.layout !== 'A' || engine.body?.p !== 0 || engine.got !== 19 || !engine.bad.length) throw new Error('engine OCR mapping/validation failed');

  // Mock only the image decoding and OCR result so the review/apply DOM path is exercised deterministically.
  await page.evaluate(() => {
    const G = window.GBLE;
    G.decodeShot = async () => ({ width: 10, height: 10 });
    G.pixelsOf = () => ({ w: 10, h: 10, data: new Uint8ClampedArray(400) });
    G.ocrTemplates = () => [];
    G.OCR.read = () => ({ ok: true });
    G.ocrToRaw = () => ({ ok: true, _layout: 'A', pos: 0, height: 75, weight: 170, wingspan: 81, attrs: {}, current: {}, unreadable: [], weak: [] });
    G.vetImport = () => ({ vals: Array(21).fill(25), got: 21, missing: [], bad: [], body: { p: 0, h: 75, w: 170, ws: 81 }, over: null, fits: true });
    G.tryCard = () => null;
  });
  const input = page.locator('section[aria-label="Import from screenshot"] input[type=file]');
  const before = await page.locator('.overall').innerText();
  await input.setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  await page.waitForTimeout(1200);
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.waitForTimeout(300);
  if ((await page.locator('.overall').innerText()) !== before) throw new Error('cancel changed the build');

  await input.setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Apply to builder' }).click();
  await page.waitForTimeout(800);
  const after = await page.locator('.overall').innerText();
  console.log('overall before/after', before, after);
  if (!after.startsWith('Overall 25')) throw new Error('apply did not go through the validated builder path');

  // Reject an over-ceiling value and identify the offending attribute.
  await input.setInputFiles({ name: 'shot.png', mimeType: 'image/png', buffer: Buffer.from('89504e470d0a1a0a', 'hex') });
  await page.waitForTimeout(1000);
  const firstAttribute = page.locator('section[aria-label="Import from screenshot"] [data-attribute="3"]');
  await firstAttribute.fill('99');
  await page.getByRole('button', { name: 'Apply to builder' }).click();
  await page.waitForTimeout(500);
  const highlighted = await page.locator('section[aria-label="Import from screenshot"] .apply-warn').count();
  const rejection = await page.locator('section[aria-label="Import from screenshot"] [role=alert]').innerText();
  console.log('rejection', { highlighted, rejection });
  if (!highlighted) throw new Error('rejected apply did not highlight an attribute');
  if (!/Standing Dunk/i.test(rejection)) throw new Error('rejected apply did not name the offending attribute');
  if ((await page.locator('.overall').innerText()) !== after) throw new Error('rejected apply changed the build');
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  await browser.close();
})();
