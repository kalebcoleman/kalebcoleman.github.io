import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('jumpshot-trainer/index.html', root), 'utf8');
const css = await readFile(new URL('jumpshot-trainer/trainer.css', root), 'utf8');
const app = await readFile(new URL('assets/trainer-app.mjs', root), 'utf8');
const engine = await readFile(new URL('assets/trainer-engine.mjs', root), 'utf8');
const tabs = ['shooting', 'free-throws', 'calibration', 'recommendations', 'setup'];

function attributesOf(source, attribute) {
  return [...source.matchAll(new RegExp(`${attribute}="([^"]+)"`, 'g'))].map((match) => match[1]);
}

test('page loads only local trainer assets and the same-origin animation table', () => {
  assert.match(html, /<title>[^<]*Jumpshot Practice Lab[^<]*<\/title>/i);
  assert.match(html, /<script type="module" src="\/assets\/trainer-app\.mjs"><\/script>/);
  assert.match(html, /href="\/jumpshot-trainer\/trainer\.css"/);
  assert.match(html, /href="\/assets\/main-pW0vUW4U\.css"/);
  assert.match(html, /<link rel="manifest" href="\/manifest\.webmanifest">/);
  assert.match(html, /<main id="main">/);

  for (const source of [html, app, engine, css]) {
    assert.equal(/https?:\/\//.test(source), false, 'no external runtime URLs');
  }
  for (const source of [app, engine]) {
    assert.equal(/url\(\s*['"]?https?:/i.test(source), false, 'no external stylesheet URLs');
  }
  const fetches = [...app.matchAll(/fetch\(([^)]+)\)/g)].map((match) => match[1].trim());
  assert.deepEqual(fetches, ["'/data/animations.json', { cache: 'force-cache' }"]);
  assert.equal(/XMLHttpRequest|WebSocket|EventSource/.test(app), false);
});

test('page has the complete free workflow and local-only disclaimers', () => {
  for (const required of [
    'Start jump shot',
    'Free throws',
    'Ten-rep free-throw ladder',
    'Calibration',
    'Recommendations',
    'Shot setup',
    'Export practice data',
    'Import practice data',
    'No sign-in',
    'No account',
    'not NBA 2K measurements',
    'not an NBA 2K measurement',
    'not captured game tuning',
    'No account, subscription or server is involved',
  ]) {
    const haystack = required === 'not an NBA 2K measurement' || required === 'not captured game tuning'
      ? `${html}\n${app}\n${engine}`
      : html;
    assert.match(haystack, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), required);
  }
  assert.match(html, /fb\.jumpshotTrainer\.v1/);
  assert.equal(/type="password"|sign[ -]?in form|subscribe/i.test(html), false);
  assert.match(engine, /export const STORAGE_KEY = 'fb\.jumpshotTrainer\.v1'/);
  assert.match(engine, /not NBA 2K tuning data/i);
});

test('every static byId reference in the app exists in the markup', () => {
  const ids = [...app.matchAll(/byId\('([^']+)'\)/g)].map((match) => match[1]);
  assert.ok(new Set(ids).size > 50);
  const missing = [...new Set(ids)].filter((id) => !new RegExp(`id="${id}"`).test(html));
  assert.deepEqual(missing, []);
});

test('all five tabs and panels are wired with accessible tab semantics', () => {
  assert.equal(tabs.length, 5);
  assert.match(html, /role="tablist"/);
  assert.equal((html.match(/role="tab"/g) || []).length, tabs.length);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, tabs.length);
  assert.equal((html.match(/aria-selected="true"/g) || []).length, 1);
  assert.equal((html.match(/aria-selected="false"/g) || []).length, tabs.length - 1);

  const controls = attributesOf(html, 'aria-controls');
  assert.equal(controls.length, tabs.length);
  for (const panelId of controls) {
    assert.match(html, new RegExp(`id="${panelId}" role="tabpanel"`), panelId);
  }
  const labelled = attributesOf(html, 'aria-labelledby');
  for (const tabId of labelled.filter((id) => id.startsWith('tab-'))) {
    assert.match(html, new RegExp(`id="${tabId}"[^>]*role="tab"`), tabId);
  }
  for (const tab of tabs) {
    assert.match(html, new RegExp(`id="tab-${tab}"`), `tab-${tab}`);
    assert.match(html, new RegExp(`id="panel-${tab}"`), `panel-${tab}`);
  }
  assert.match(app, /role="tab"/);
  assert.match(app, /ArrowRight/);
  assert.match(app, /ArrowLeft/);
});

test('keyboard, pointer, live feedback and form labels are present', () => {
  assert.match(html, /<button class="shot-pad" id="shotPad" type="button" aria-describedby="shotPadHint meterReadout">/);
  assert.match(html, /id="feedback" role="status" aria-live="polite"/);
  assert.match(html, /id="ftStatus" role="status" aria-live="polite"/);
  assert.match(html, /id="srAnnouncer" role="status" aria-live="polite"/);
  assert.match(html, /<kbd>Space<\/kbd>/);
  assert.match(html, /<kbd>Esc<\/kbd>/);
  assert.match(html, /<kbd>Tab<\/kbd>/);
  assert.match(app, /shotPad\.addEventListener\('click'/);
  assert.match(app, /document\.addEventListener\('keydown'/);
  assert.match(app, /event\.key === 'Escape'/);
  assert.match(app, /dom\.shotPad\.focus/);
  assert.match(app, /new Option|document\.createElement\('option'\)/);
  assert.match(app, /document\.createElement\('label'\)/);
  assert.match(html, /<label for="calibrationOffset">Manual local offset<\/label>/);
  assert.match(html, /<label class="toggle-line" for="autoAdvanceToggle">/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /prefers-contrast/);
});

test('settings expose the recovered shot vocabulary and the local practice controls', () => {
  for (const setting of [
    'shotType',
    'base',
    'release1',
    'release2',
    'speed',
    'input',
    'cue',
    'difficulty',
    'context',
    'hand',
    'sprint',
    'meter',
    'meterSide',
    'cueBar',
    'freeThrowRating',
    'sound',
    'autoAdvance',
    'offsetMs',
  ]) {
    assert.match(app, new RegExp(`'${setting}'`), setting);
  }
  assert.match(app, /Free-throw rating/);
  assert.match(app, /does not change the local timing estimate/i);
  assert.match(app, /animation names label the plan only/i);
  assert.match(app, /Audio cue/);
  assert.match(app, /Cue bar band/);
});

test('the app imports the engine API and the engine imports nothing external', () => {
  const importBlock = app.match(/import \{([\s\S]*?)\} from '\.\/trainer-engine\.mjs';/);
  assert.ok(importBlock, 'engine import block');
  const importedNames = importBlock[1]
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  assert.ok(importedNames.includes('computeCalibration'));
  assert.ok(importedNames.includes('buildRecommendations'));
  assert.ok(importedNames.includes('saveStoredState'));
  for (const name of importedNames) {
    assert.match(
      engine,
      new RegExp(`export (?:const|function|class) ${name}\\b`),
      `${name} is exported`,
    );
  }
  assert.equal(/^\s*import\s/m.test(engine), false, 'engine has no runtime imports');
  assert.equal(/^\s*export .* from /m.test(engine), false, 'engine has no re-exports');
});

test('storage, honesty and test commands are documented for integration', async () => {
  const readme = await readFile(new URL('jumpshot-trainer/README.md', root), 'utf8');
  assert.match(readme, /node --test tests\/trainer-engine\.test\.mjs tests\/trainer-page\.test\.mjs/);
  assert.match(readme, /node --check assets\/trainer-engine\.mjs/);
  assert.match(readme, /not an NBA 2K measurement/i);
  assert.match(readme, /no backend/i);
  assert.match(readme, /jumpshot-trainer\//);
});
