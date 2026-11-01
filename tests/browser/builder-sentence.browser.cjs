/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-sentence.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 900 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, isMobile: label === 'mobile', hasTouch: label === 'mobile', colorScheme: 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.stack || error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    const open = async () => {
      await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(1600);
    };
    const panel = () => page.locator('section[aria-label="Build from a sentence"]');
    const read = () => page.evaluate(() => ({
      overall: document.querySelector('.overall')?.textContent ?? '',
      three: document.querySelector('#attr-6')?.value ?? '',
      perimeter: document.querySelector('#attr-12')?.value ?? '',
      rowTop: Math.round((document.querySelector('[data-row="0"]')?.getBoundingClientRect().top ?? 0) + window.scrollY),
      cap: localStorage.getItem('fb.lbrk'),
    }));
    const review = async text => {
      await panel().locator('textarea').fill(text);
      await panel().getByRole('button', { name: 'Review sentence' }).click();
      await page.waitForTimeout(400);
    };

    await open();
    if (await panel().count() !== 1) throw new Error(`${label}: sentence panel missing`);
    if (!/Type a request/.test(await panel().locator('.sentence-review').innerText())) throw new Error(`${label}: empty review placeholder missing`);

    // Reachable request.
    const before = await read();
    await review(`6'8" wing 205 lb 7'0" wingspan 80 three 75 perimeter D 22 cap breakers`);
    const during = await read();
    const reviewText = await panel().locator('.sentence-review').innerText();
    if (!/SF · 6'8" · 205 lb · 7'0" wingspan/.test(reviewText)) throw new Error(`${label}: body was not parsed: ${reviewText}`);
    if (!/Three-Point/.test(reviewText) || !/Perimeter D/.test(reviewText)) throw new Error(`${label}: targets missing`);
    if (!/reachable/.test(reviewText)) throw new Error(`${label}: reachable target not marked`);
    if (during.overall !== before.overall || during.three !== before.three || during.perimeter !== before.perimeter) throw new Error(`${label}: review changed the build`);
    if (during.rowTop !== before.rowTop) throw new Error(`${label}: review shifted the attribute rows`);
    const apply = panel().locator('.sentence-actions').getByRole('button', { name: /Apply/ });
    if (await apply.count() !== 1) throw new Error(`${label}: Apply missing`);
    if (label === 'mobile' && (await apply.evaluate(button => button.getBoundingClientRect().height)) < 44) throw new Error('mobile Apply is under 44px');
    await apply.click();
    await page.waitForTimeout(700);
    const after = await read();
    if (after.overall === before.overall) throw new Error(`${label}: Apply did not change the overall`);
    if (Number(after.three) < 80 || Number(after.perimeter) < 75) throw new Error(`${label}: applied attributes are wrong: ${JSON.stringify(after)}`);
    if (after.cap !== '22') throw new Error(`${label}: breaker budget was not stored: ${after.cap}`);

    // Unreachable request: review must show the cap reason, and apply the closest legal value.
    await page.evaluate(() => localStorage.removeItem('fb.lbrk'));
    await open();
    const beforeUnreachable = await read();
    await review(`6'8" wing 185 lb 80" wingspan 90 three 88 perimeter D`);
    const unreachableText = await panel().locator('.sentence-review').innerText();
    if (!/Perimeter D/.test(unreachableText) || !/cap 87/.test(unreachableText)) throw new Error(`${label}: unreachable cap reason missing: ${unreachableText}`);
    if (!/Apply closest legal build/.test(await panel().locator('.sentence-actions').innerText())) throw new Error(`${label}: closest-legal apply label missing`);
    const beforeApply = await read();
    if (beforeApply.perimeter !== beforeUnreachable.perimeter) throw new Error(`${label}: unreachable review changed the build`);
    await panel().locator('.sentence-actions').getByRole('button', { name: /Apply closest legal build/ }).click();
    await page.waitForTimeout(700);
    const afterApply = await read();
    if (Number(afterApply.perimeter) > 87) throw new Error(`${label}: applied an over-cap perimeter value: ${afterApply.perimeter}`);

    // Nonsense: only the didn't-understand list, no Apply.
    await open();
    const beforeNonsense = await read();
    await review('make me a unicorn with a magic hat');
    const nonsenseText = await panel().locator('.sentence-review').innerText();
    if (!/I didn't understand:/.test(nonsenseText) || !/unicorn/.test(nonsenseText)) throw new Error(`${label}: unparsed list missing: ${nonsenseText}`);
    if (await panel().locator('.sentence-actions').count()) throw new Error(`${label}: nonsense offered Apply`);
    const afterNonsense = await read();
    if (afterNonsense.overall !== beforeNonsense.overall) throw new Error(`${label}: nonsense changed the build`);

    if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error(`${label}: horizontal overflow`);
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    console.log(label, { reachable: after, unreachable: afterApply, nonsense: 'no apply', errors: 0 });
    await context.close();
  }
  await browser.close();
})();
