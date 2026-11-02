/* Run with: NODE_PATH=/tmp/freebuilder-browser-test/node_modules node tests/browser/builder-finder.browser.cjs */
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  for (const [label, viewport] of [['desktop', { width: 1280, height: 1100 }], ['mobile', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport, colorScheme: 'light', serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('http://127.0.0.1:8123/builder/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1200);
    const beforeLoad = await page.locator('.overall').innerText();
    await page.getByRole('button', { name: 'Find builds' }).click();
    await page.waitForFunction(() => document.querySelectorAll('.finder-card').length > 0
      || [...document.querySelectorAll('#find p')].some(node => /Search failed/.test(node.textContent)), null, { timeout: 60000 });
    const status = await page.evaluate(() => [...document.querySelectorAll('#find p')].map(node => node.textContent).find(text => /result\(s\)|Search failed/.test(text)));
    const cards = await page.evaluate(() => [...document.querySelectorAll('.finder-card')].map(card => ({
      trueOvr: Number(card.dataset.true),
      badges: Number(card.dataset.badges),
      tokens: Number(card.dataset.tokens),
      text: card.innerText,
      raw: card.querySelector('.finder-true')?.title ?? '',
      badgeText: card.querySelector('.finder-card-badges')?.textContent ?? '',
    })));
    console.log(label, { status, cards: cards.length, first: cards[0] });
    if (!/12 result\(s\).*recovered reference finder/.test(status)) throw new Error(`${label}: finder did not return the recovered reference result`);
    if (cards.length !== 12) throw new Error(`${label}: expected 12 cards, got ${cards.length}`);
    if (!/^raw 9[0-8]\./.test(cards[0].raw)) throw new Error(`${label}: first card is not under the 99 wall: ${cards[0].raw}`);
    if (!Number.isFinite(cards[0].badges) || cards[0].badges <= 0) throw new Error(`${label}: first card has no badge tier count: ${cards[0].badges}`);
    if (!Number.isFinite(cards[0].tokens) || cards[0].tokens <= 0) throw new Error(`${label}: first card has no token count: ${cards[0].tokens}`);
    if (!/Badges \d+ tiers/.test(cards[0].text) || !/Tokens \d+/.test(cards[0].text)) throw new Error(`${label}: card stats missing badges/tokens: ${cards[0].text}`);
    if (!/^(HOF|Legend|Gold|Silver|Bronze) /.test(cards[0].badgeText)) throw new Error(`${label}: card badge summary missing: ${cards[0].badgeText}`);

    const values = async key => page.evaluate(name => [...document.querySelectorAll('.finder-card')].map(card => Number(card.dataset[name])), key);
    const nonIncreasing = (list, name) => {
      for (let index = 1; index < list.length; index += 1) {
        if (list[index] > list[index - 1]) throw new Error(`${label}: ${name} sort is not descending: ${list.join(',')}`);
      }
    };

    await page.selectOption('#finderSort', 'badges');
    await page.waitForTimeout(250);
    nonIncreasing(await values('badges'), 'badge');
    await page.selectOption('#finderSort', 'tokens');
    await page.waitForTimeout(250);
    nonIncreasing(await values('tokens'), 'token');
    await page.selectOption('#finderSort', 'true');
    await page.waitForTimeout(250);
    nonIncreasing(await values('true'), 'true overall');
    await page.selectOption('#finderSort', 'finder');
    await page.waitForTimeout(250);
    const finderOrder = await page.evaluate(() => [...document.querySelectorAll('.finder-card')].map(card => Number(card.dataset.order)));
    if (JSON.stringify(finderOrder) !== JSON.stringify([...Array(12).keys()])) throw new Error(`${label}: Finder order did not restore the engine order: ${finderOrder.join(',')}`);

    await page.selectOption('#finderSort', 'true');
    await page.waitForTimeout(250);
    const first = await page.evaluate(() => {
      const card = document.querySelector('.finder-card');
      return { badges: Number(card.dataset.badges), tokens: Number(card.dataset.tokens) };
    });
    await page.locator('.finder-card .btn').first().click();
    await page.waitForTimeout(700);
    const loaded = await page.evaluate(() => {
      const G = window.GBLE;
      const build = window.__fbGetBuild();
      const tiers = G.badgeTiersOf(build.alloc, build.h - 63);
      const pools = G.tokensAt(build.alloc, build.p, build.h);
      return {
        badges: tiers.filter(Boolean).length,
        tokens: pools.reduce((sum, value) => sum + (Number(value) || 0), 0),
        overall: document.querySelector('.overall')?.textContent ?? '',
      };
    });
    if (loaded.badges !== first.badges) throw new Error(`${label}: loaded badge tiers ${loaded.badges} do not match card ${first.badges}`);
    if (loaded.tokens !== first.tokens) throw new Error(`${label}: loaded tokens ${loaded.tokens} do not match card ${first.tokens}`);
    if (loaded.overall === beforeLoad) throw new Error(`${label}: Load did not change the builder overall`);

    if (label === 'mobile') {
      const sortHeight = await page.locator('#finderSort').evaluate(element => element.getBoundingClientRect().height);
      const loadHeight = await page.locator('.finder-card .btn').first().evaluate(element => element.getBoundingClientRect().height);
      if (sortHeight < 44) throw new Error(`mobile: sort control is ${sortHeight}px, under 44px`);
      if (loadHeight < 44) throw new Error(`mobile: Load button is ${loadHeight}px, under 44px`);
    }
    if (errors.length) throw new Error(`${label}: ${errors.slice(0, 3).join(' | ')}`);
    if (await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth) !== 0) throw new Error(`${label}: horizontal overflow`);
    await context.close();
  }
  await browser.close();
})();
