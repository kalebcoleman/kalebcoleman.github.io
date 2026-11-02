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
      dd: document.querySelector('#attr-2')?.value ?? '',
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
    const apply = panel().locator('.sentence-actions .btn.primary');
    if (await apply.count() !== 1) throw new Error(`${label}: Apply missing`);
    if (label === 'mobile' && (await apply.evaluate(button => button.getBoundingClientRect().height)) < 44) throw new Error('mobile Apply is under 44px');
    await apply.click();
    await page.waitForTimeout(700);
    const after = await read();
    if (after.overall === before.overall) throw new Error(`${label}: Apply did not change the overall`);
    if (Number(after.three) < 80 || Number(after.perimeter) < 75) throw new Error(`${label}: applied attributes are wrong: ${JSON.stringify(after)}`);
    if (after.cap !== '22') throw new Error(`${label}: breaker budget was not stored: ${after.cap}`);
    if (!(await apply.isDisabled())) throw new Error(`${label}: Apply stayed enabled after success`);
    if ((await apply.innerText()).trim() !== 'Applied') throw new Error(`${label}: Apply was not replaced by a confirmed state`);
    const receipt = panel().locator('.sentence-receipt');
    if (await receipt.count() !== 1 || !(await receipt.isVisible())) throw new Error(`${label}: applied receipt missing`);
    if (!/^Applied /.test((await receipt.innerText()).trim())) throw new Error(`${label}: applied receipt has the wrong text: ${await receipt.innerText()}`);
    if ((await panel().locator('.sentence-actions').getByRole('button', { name: 'Undo' }).count()) !== 1) throw new Error(`${label}: Undo missing after apply`);
    if ((await panel().locator('.sentence-actions').getByRole('button', { name: 'Clear review' }).count()) !== 1) throw new Error(`${label}: Clear review missing after apply`);
    await page.evaluate(() => {
      const button = document.querySelector('.sentence-actions .btn.primary');
      button.click();
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
    await page.waitForTimeout(300);
    if (await panel().locator('.sentence-receipt').count() !== 1) throw new Error(`${label}: double Apply stacked receipts`);
    const afterDouble = await read();
    if (afterDouble.overall !== after.overall || afterDouble.three !== after.three || afterDouble.perimeter !== after.perimeter) throw new Error(`${label}: double Apply changed the build again`);
    await panel().locator('.sentence-actions').getByRole('button', { name: 'Undo' }).click();
    await page.waitForTimeout(700);
    const afterUndo = await read();
    if (afterUndo.overall !== before.overall || afterUndo.three !== before.three) throw new Error(`${label}: Undo did not restore the build`);
    if (Number(afterUndo.cap || 0) !== 0) throw new Error(`${label}: Undo did not restore the breaker level: ${afterUndo.cap}`);
    await panel().locator('.sentence-actions .btn.primary').click();
    await page.waitForTimeout(700);
    const afterReapply = await read();
    if (afterReapply.overall !== after.overall || afterReapply.three !== after.three) throw new Error(`${label}: reapplying after Undo did not restore the applied build`);
    await panel().locator('.sentence-actions').getByRole('button', { name: 'Clear review' }).click();
    await page.waitForTimeout(300);
    const cancelStatus = (await panel().locator('.sentence-status').innerText()).trim();
    if (!/applied build stays/.test(cancelStatus) || /not changed/.test(cancelStatus)) throw new Error(`${label}: clear-review message lied: ${cancelStatus}`);
    const afterCancel = await read();
    if (afterCancel.overall !== after.overall) throw new Error(`${label}: clearing the review changed the applied build`);

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

    // Badge-only request: badge-derived rows are labelled, the impossible tier is reported once,
    // and nothing is applied until the user confirms.
    await open();
    const beforeBadge = await read();
    await review(`6'4 PG HOF posterizer`);
    const badgeText = await panel().locator('.sentence-review').innerText();
    const badgeSources = await panel().locator('.sentence-source').allInnerTexts();
    if (badgeSources.length !== 2 || badgeSources.some(text => text.trim() !== 'from Posterizer')) throw new Error(`${label}: badge-derived rows are not labelled: ${JSON.stringify(badgeSources)}`);
    if ((badgeText.match(/unreachable on this body/g) ?? []).length !== 1) throw new Error(`${label}: badge unreachable was not reported exactly once: ${badgeText}`);
    if (!/HOF Posterizer is unreachable on this body: needs Driving Dunk 99 \(cap 90\)/.test(badgeText)) throw new Error(`${label}: badge unreachable detail missing: ${badgeText}`);
    if (/Unreachable:/.test(badgeText)) throw new Error(`${label}: badge-only request used the explicit-target warning: ${badgeText}`);
    const badgeApplyLabel = (await panel().locator('.sentence-actions .btn.primary').innerText()).trim();
    if (badgeApplyLabel !== 'Apply to builder') throw new Error(`${label}: badge-only request was labelled ${badgeApplyLabel}`);
    const duringBadge = await read();
    if (duringBadge.overall !== beforeBadge.overall || duringBadge.dd !== beforeBadge.dd) throw new Error(`${label}: badge review changed the build`);
    await panel().locator('.sentence-actions .btn.primary').click();
    await page.waitForTimeout(700);
    const afterBadge = await read();
    if (afterBadge.overall === beforeBadge.overall) throw new Error(`${label}: badge Apply did not change the build`);
    if (afterBadge.dd !== '90') throw new Error(`${label}: badge Apply did not set Driving Dunk to the cap: ${afterBadge.dd}`);

    // External History Undo then Clear review: the message must not claim the applied build is current.
    await open();
    const beforeExternalUndo = await read();
    await review(`6'8" wing 205 lb 7'0" wingspan 80 three 75 perimeter D 22 cap breakers`);
    await panel().locator('.sentence-actions .btn.primary').click();
    await page.waitForTimeout(700);
    await page.evaluate(() => window.__fbUndo());
    await page.waitForTimeout(700);
    const afterExternalUndo = await read();
    if (afterExternalUndo.overall !== beforeExternalUndo.overall) throw new Error(`${label}: external Undo did not restore the build`);
    await panel().locator('.sentence-actions').getByRole('button', { name: 'Clear review' }).click();
    await page.waitForTimeout(300);
    const externalStatus = (await panel().locator('.sentence-status').innerText()).trim();
    if (!/no longer the current build/.test(externalStatus) || /applied build stays/.test(externalStatus)) throw new Error(`${label}: clear-review message ignored the external Undo: ${externalStatus}`);

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
