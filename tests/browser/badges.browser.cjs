/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/badges.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('http://127.0.0.1:8123/badges/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  const cards = await page.locator('.badge').count();
  const icons = await page.locator('.badge .badge-icon').count();
  const tierLabels = await page.locator('#ptabpanel').innerText();
  const missingTiers = ['Bronze', 'Silver', 'Gold', 'HOF', 'Legend'].filter(tier => !tierLabels.includes(tier));
  const cardsWithRequirements = await page.locator('.badge .list li').count();
  const missingMasks = await page.locator('.badge .badge-icon').evaluateAll(nodes => nodes.filter(node => !node.style.getPropertyValue('--badge-mask')).length);
  const legend = await page.locator('.badge-icon-legend').count();
  console.log({ cards, icons, cardsWithRequirements, missingTiers, missingMasks, legend });
  if (cards !== 53 || icons !== 53 || cardsWithRequirements < 53 || missingTiers.length || missingMasks || !legend) throw new Error('badge coverage failed');

  await page.locator('#ptab-plan').click();
  await page.waitForTimeout(1000);
  const planText = await page.locator('#ptabpanel').innerText();
  if (await page.locator('.badge').count() !== 0 || !/next badge tier/i.test(planText)) throw new Error('plan tab did not render');

  await page.locator('#ptab-next').click();
  await page.waitForTimeout(500);
  const nextText = await page.locator('#ptabpanel').innerText();
  if (!/next tier at/i.test(nextText)) throw new Error('next tab did not render');

  await page.locator('#ptab-badges').click();
  await page.waitForTimeout(500);
  if (await page.locator('.badge').count() !== 53) throw new Error('all badges tab did not return');

  const light = await page.evaluate(() => {
    const silver = document.querySelector('.tier-silver');
    const gold = document.querySelector('.tier-gold');
    return { silver: silver && getComputedStyle(silver).color, gold: gold && getComputedStyle(gold).color };
  });
  console.log('light tier colors', light);
  if (errors.length) throw new Error(errors.slice(0, 3).join(' | '));
  await browser.close();
})();
