import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import {
  BANDS,
  DEFAULT_HEIGHT,
  RUNS,
  buildStyleIndex,
  buildView,
  describeView,
  filterRecords,
  formatHeight,
  formatHeightRange,
  formatRecordGate,
  heightOptions,
  normalizeSearch,
  recordsForHeight,
  recommend,
  sortRecords,
  sprintTime,
  sprintTopSpeed,
  sprintTimeKey,
  sprintTopSpeedKey,
  summarizeGroups,
  validateCatalog,
  bandForHeight,
} from '../assets/motion-styles.mjs';

const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('data/motion-styles.json', root), 'utf8'));

const SEVEN_UNTIMED_AT_GUARD = [
  'Damion Baugh',
  'Kendrick Nunn',
  'Kent Bazemore',
  'Kira Lewis Jr.',
  'Malik Beasley',
  'Terence Davis',
  'Terry Rozier III',
].sort();

const SIX_EXTRA_ON_WING = [
  'Kendrick Nunn',
  'Kent Bazemore',
  'Kira Lewis Jr.',
  'Malik Beasley',
  'Terence Davis',
  'Terry Rozier III',
].sort();

test('recovered source counts are exact: 3 groups, 458 rows, 368 unique styles', () => {
  assert.deepEqual(validateCatalog(data), { groups: 3, rows: 458, styles: 368 });
  assert.deepEqual(
    data.groups.map((group) => [group.id, group.label, group.buildHeight, group.rows.length]),
    [
      ['guard', 'Guard', 74, 107],
      ['wing', 'Wing', 78, 238],
      ['big', 'Big', 84, 113],
    ],
  );
  assert.deepEqual(data.runs, ['Offense jog', 'Offense sprint', 'Defense jog', 'Defense sprint']);
  assert.equal(data.about.timingDistanceFt, 47);
  assert.equal(data.about.timingToleranceSeconds, 0.05);
  assert.equal(data.about.counts.heightGroups, 3);
  assert.equal(data.about.counts.rows, 458);
  assert.equal(data.about.counts.uniqueStyles, 368);
});

test('the recovered rows hash still matches the recovered source copy', () => {
  const digest = createHash('sha256').update(JSON.stringify(data.groups)).digest('hex');
  assert.equal(digest, data.about.rowsSha256);
});

test('every style has one consistent height/rating gate and a band-edge range', () => {
  const styles = buildStyleIndex(data);
  assert.equal(styles.size, 368);
  const edges = new Set(BANDS.flatMap((band) => [band.minHeight, band.maxHeight]));

  for (const style of styles.values()) {
    assert.ok(edges.has(style.minHeight), `${style.name} starts off a band edge`);
    assert.ok(edges.has(style.maxHeight), `${style.name} ends off a band edge`);
    assert.ok(style.minHeight <= style.maxHeight, `${style.name} has a reversed range`);
    assert.ok(style.speed >= 0 && style.speed <= 99, `${style.name} Speed ask`);
    assert.ok(style.agility >= 0 && style.agility <= 99, `${style.name} Agility ask`);
  }

  assert.deepEqual(styles.get('Alex Caruso'), {
    name: 'Alex Caruso', minHeight: 69, maxHeight: 81, speed: 66, agility: 71,
  });
  assert.deepEqual(styles.get('Base'), {
    name: 'Base', minHeight: 69, maxHeight: 88, speed: 0, agility: 0,
  });
  assert.ok(styles.has('Luka Dončić'));
  assert.ok(styles.has('Alondes  Williams'), 'source spelling with two spaces is preserved');
});

test('each group has unique names and the three source rows are not copied between builds', () => {
  for (const group of data.groups) {
    const names = group.rows.map((row) => row[0]);
    assert.equal(new Set(names).size, names.length, `${group.label} names are unique`);
  }

  const guard = recordsForHeight(data, 74);
  const wing = recordsForHeight(data, 78);
  const big = recordsForHeight(data, 84);

  assert.deepEqual(guard.records.find((record) => record.name === 'Alex Caruso').row[3], [2.55, 22.9]);
  assert.deepEqual(wing.records.find((record) => record.name === 'Alex Caruso').row[3], [2.54, 22.2]);
  assert.deepEqual(big.records.find((record) => record.name === 'Base').row[3], [3.17, 17.8]);
});

test('height bands, build heights and formatter match the reference', () => {
  assert.deepEqual(heightOptions(), Array.from({ length: 20 }, (_, index) => 69 + index));
  assert.equal(formatHeight(69), "5'9\"");
  assert.equal(formatHeight(74), "6'2\"");
  assert.equal(formatHeight(76), "6'4\"");
  assert.equal(formatHeight(78), "6'6\"");
  assert.equal(formatHeight(81), "6'9\"");
  assert.equal(formatHeight(84), "7'0\"");
  assert.equal(formatHeight(88), "7'4\"");
  assert.equal(formatHeightRange(82, 88), "6'10\" to 7'4\"");
  assert.equal(bandForHeight(76).id, 'guard');
  assert.equal(bandForHeight(77).id, 'wing');
  assert.equal(bandForHeight(81).id, 'wing');
  assert.equal(bandForHeight(82).id, 'big');
  assert.equal(bandForHeight(68), null);
  assert.equal(bandForHeight(89), null);
  assert.equal(DEFAULT_HEIGHT, 78);
});

test('height filtering reproduces the 114/107/7 guard and 232/238 wing counts', () => {
  const guard = recordsForHeight(data, 74);
  assert.deepEqual(guard.counts, {
    eligible: 114, timed: 107, untimed: 7, extraTimed: 0, groupRows: 107,
  });
  assert.deepEqual(guard.untimed.map((record) => record.name).sort(), SEVEN_UNTIMED_AT_GUARD);
  assert.ok(guard.untimed.every((record) => record.row === null), 'untimed styles never borrow times');
  assert.ok(guard.untimed.every((record) => record.timedOnBuildHeights.join() === '78'));

  const wing = recordsForHeight(data, 78);
  assert.deepEqual(wing.counts, {
    eligible: 232, timed: 232, untimed: 0, extraTimed: 6, groupRows: 238,
  });
  assert.deepEqual(wing.extraTimed.map((row) => row[0]).sort(), SIX_EXTRA_ON_WING);
  assert.ok(wing.records.every((record) => record.timed));

  const big = recordsForHeight(data, 84);
  assert.deepEqual(big.counts, {
    eligible: 113, timed: 113, untimed: 0, extraTimed: 0, groupRows: 113,
  });
});

test('the recommendation is the fastest combined sprint, ties to the higher top speed', () => {
  const guard = recordsForHeight(data, 74);
  const wing = recordsForHeight(data, 78);
  const big = recordsForHeight(data, 84);

  assert.equal(guard.recommended.name, 'Markelle Fultz');
  assert.equal(wing.recommended.name, 'Drew Eubanks');
  assert.equal(big.recommended.name, 'Danilo Gallinari');
  assert.equal(sprintTime(guard.recommended.row).toFixed(2), '4.76');
  assert.equal(sprintTopSpeed(guard.recommended.row).toFixed(2), '23.50');
  assert.equal(sprintTime(wing.recommended.row).toFixed(2), '4.87');
  assert.equal(sprintTopSpeed(wing.recommended.row).toFixed(2), '22.75');
  assert.equal(sprintTime(big.recommended.row).toFixed(2), '5.60');
  assert.equal(sprintTopSpeed(big.recommended.row).toFixed(2), '19.05');

  // At 6'6", Alex Caruso and Josh Hart both total 4.90 s; Caruso's 23.15 ft/s
  // average top speed beats Hart's 22.90 ft/s, exactly as the reference tie-break says.
  const caruso = wing.records.find((record) => record.name === 'Alex Caruso');
  const hart = wing.records.find((record) => record.name === 'Josh Hart');
  assert.equal(sprintTimeKey(caruso.row), sprintTimeKey(hart.row));
  assert.ok(sprintTopSpeedKey(caruso.row) > sprintTopSpeedKey(hart.row));
  assert.ok(recommend([hart, caruso]).name === 'Alex Caruso');

  const synthetic = [
    { name: 'Slower', timed: true, row: [null, null, [0, 0], [2.0, 20], [0, 0], [2.5, 20]] },
    { name: 'Faster top speed', timed: true, row: [null, null, [0, 0], [2.0, 30], [0, 0], [2.5, 20]] },
    { name: 'Untimed but quicker', timed: false, row: [null, null, [0, 0], [1.0, 99], [0, 0], [1.0, 99]] },
  ];
  assert.equal(recommend(synthetic).name, 'Faster top speed');
});

test('search is case-insensitive, diacritic-insensitive and whitespace-tolerant', () => {
  assert.equal(normalizeSearch('  LUKA   Dončić '), 'luka doncic');

  const curry = buildView(data, { height: 74, query: 'curry' });
  assert.deepEqual(curry.shown.map((record) => record.name).sort(), ['Seth Curry', 'Stephen Curry']);
  assert.equal(curry.counts.shown, 2);
  assert.equal(
    describeView(curry),
    `114 styles fit 6'2" (Guard band) · 107 timed on the 6'2" build · 2 matches`,
  );

  assert.deepEqual(
    buildView(data, { height: 74, query: 'doncic' }).shown.map((record) => record.name),
    ['Luka Dončić'],
  );
  assert.deepEqual(
    buildView(data, { height: 74, query: 'alondes williams' }).shown.map((record) => record.name),
    ['Alondes  Williams'],
  );
  assert.equal(buildView(data, { height: 74, query: 'no-such-style' }).counts.shown, 0);
});

test('a style that does not fit the selected height is suggested with its real range', () => {
  const view = buildView(data, { height: 74, query: 'wembanyama' });
  assert.equal(view.counts.shown, 0);
  assert.deepEqual(view.suggestions.map((style) => style.name), ['Victor Wembanyama']);
  assert.equal(formatHeightRange(view.suggestions[0].minHeight, view.suggestions[0].maxHeight), "6'10\" to 7'4\"");

  assert.deepEqual(
    buildView(data, { height: 84, query: 'jokic' }).shown.map((record) => record.name),
    ['Nikola Jokić'],
  );
});

test('Speed and Agility filters use the recovered minimum asks and keep no-ask styles', () => {
  const strict = buildView(data, { height: 78, speed: 0, agility: 0 });
  assert.deepEqual(strict.shown.map((record) => record.name), ['Base']);

  const sixty = buildView(data, { height: 78, speed: 60, agility: 60 });
  assert.equal(sixty.counts.shown, 109);
  assert.ok(sixty.shown.every((record) => record.speed <= 60 && record.agility <= 60));

  const eighty = buildView(data, { height: 78, speed: 80, agility: 80 });
  assert.equal(eighty.counts.shown, 231);
  assert.ok(eighty.shown.every((record) => record.speed <= 80 && record.agility <= 80));

  const onlySpeed = filterRecords(recordsForHeight(data, 78).records, { speed: 40 });
  assert.ok(onlySpeed.every((record) => record.speed <= 40));
  assert.ok(onlySpeed.some((record) => record.name === 'Base'));
});

test('sorting is correct for combined, single-run, top-speed and name modes', () => {
  const combined = buildView(data, { height: 78, sort: 'time', run: 'both' });
  assert.equal(combined.shown.length, 232);
  assert.equal(combined.shown[0].name, 'Drew Eubanks');
  for (let index = 1; index < combined.shown.length; index += 1) {
    assert.ok(sprintTimeKey(combined.shown[index - 1].row) <= sprintTimeKey(combined.shown[index].row));
  }

  const speed = buildView(data, { height: 78, sort: 'speed', run: 'both' });
  assert.equal(speed.shown[0].name, 'Alex Caruso');
  for (let index = 1; index < speed.shown.length; index += 1) {
    assert.ok(sprintTopSpeedKey(speed.shown[index - 1].row) >= sprintTopSpeedKey(speed.shown[index].row));
  }

  const offenseSprint = buildView(data, { height: 78, sort: 'time', run: 'offense-sprint' });
  assert.equal(offenseSprint.shown[0].name, 'Josh Hart');
  for (let index = 1; index < offenseSprint.shown.length; index += 1) {
    assert.ok(offenseSprint.shown[index - 1].row[3][0] <= offenseSprint.shown[index].row[3][0]);
  }

  const defenseSprint = buildView(data, { height: 78, sort: 'speed', run: 'defense-sprint' });
  assert.equal(defenseSprint.shown[0].name, 'Josh Giddey');
  for (let index = 1; index < defenseSprint.shown.length; index += 1) {
    assert.ok(defenseSprint.shown[index - 1].row[5][1] >= defenseSprint.shown[index].row[5][1]);
  }

  const names = buildView(data, { height: 78, sort: 'name' }).shown.map((record) => record.name);
  assert.deepEqual(names, names.slice().sort((a, b) => a.localeCompare(b)));
  assert.equal(names.at(-1), 'Zion Williamson');
});

test('untimed styles sort last except in name order, and search never changes the recommendation', () => {
  const guard = buildView(data, { height: 74, sort: 'time', run: 'both' });
  assert.equal(guard.shown.length, 114);
  assert.ok(guard.shown.slice(-7).every((record) => record.timed === false));
  assert.deepEqual(guard.shown.slice(-7).map((record) => record.name), SEVEN_UNTIMED_AT_GUARD);

  const guardByName = buildView(data, { height: 74, sort: 'name' });
  assert.equal(guardByName.shown.length, 114);
  const names = guardByName.shown.map((record) => record.name);
  assert.deepEqual(names, names.slice().sort((a, b) => a.localeCompare(b)));
  assert.ok(guardByName.shown.some((record) => !record.timed));

  const filtered = buildView(data, { height: 74, query: 'curry', sort: 'time' });
  assert.equal(filtered.catalog.recommended.name, 'Markelle Fultz');
  assert.deepEqual(filtered.shown.map((record) => record.name).sort(), ['Seth Curry', 'Stephen Curry']);
});

test('group summary exposes the three bands and each build row count', () => {
  const groups = summarizeGroups(data);
  assert.deepEqual(groups.map((group) => [group.id, group.counts.eligible, group.counts.timed,
    group.counts.untimed, group.counts.extraTimed, group.counts.groupRows]), [
    ['guard', 114, 107, 7, 0, 107],
    ['wing', 232, 232, 0, 6, 238],
    ['big', 113, 113, 0, 0, 113],
  ]);
  assert.deepEqual(groups.map((group) => group.recommended.name),
    ['Markelle Fultz', 'Drew Eubanks', 'Danilo Gallinari']);
});

test('gate labels preserve the recovered height, Speed and Agility requirements', () => {
  const wing = recordsForHeight(data, 78);
  const caruso = wing.records.find((record) => record.name === 'Alex Caruso');
  const base = wing.records.find((record) => record.name === 'Base');
  assert.equal(formatRecordGate(caruso), `MyPLAYER 5'9" to 6'9" · Speed 66+ · Agility 71+`);
  assert.equal(formatRecordGate(base), `MyPLAYER 5'9" to 7'4" · No Speed or Agility requirement`);
});

test('a truncated row count and a conflicting gate are rejected', () => {
  const truncated = structuredClone(data);
  truncated.groups[0].rows.pop();
  assert.throws(() => validateCatalog(truncated), /recorded row count|recorded unique-style count/);

  const conflicting = structuredClone(data);
  conflicting.groups[1].rows[0][1] = [69, 88, 1, 1];
  assert.throws(() => validateCatalog(conflicting), /conflicting height gates/);
});

test('the standalone page is local-only and carries labelled, live-region controls', async () => {
  const html = await readFile(new URL('motion-styles/index.html', root), 'utf8');
  const app = await readFile(new URL('motion-styles/app.mjs', root), 'utf8');
  const css = await readFile(new URL('motion-styles/styles.css', root), 'utf8');
  const sw = await readFile(new URL('motion-styles/sw.js', root), 'utf8');

  assert.match(html, /<html lang="en">/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /class="skip" href="#main"/);
  assert.match(html, /<a class="brand" href="\.\.\/">/);
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css">/);
  assert.match(html, /<script type="module" src="\.\/app\.mjs"><\/script>/);
  assert.match(html, /<p id="motion-status" class="status" role="status" aria-live="polite">/);
  assert.match(html, /<form id="motion-filters" class="filters" role="search" aria-labelledby="filters-heading" novalidate>/);
  assert.match(html, /<ol id="motion-results" class="style-list" aria-label="Motion styles for the selected height">/);

  for (const control of ['motion-search', 'motion-height', 'motion-run', 'motion-sort', 'motion-speed', 'motion-agility']) {
    assert.match(html, new RegExp(`<label for="${control}"`), `${control} has a label`);
    assert.match(html, new RegExp(`id="${control}"`), `${control} exists`);
  }

  assert.doesNotMatch(html, /(?:src|href)="https?:/);
  assert.doesNotMatch(html, /@import/);
  assert.doesNotMatch(css, /url\(\s*['"]?https?:/);
  assert.doesNotMatch(app, /fetch\(\s*['"]https?:/);
  assert.match(app, /new URL\('\.\.\/data\/motion-styles\.json', import\.meta\.url\)/);

  for (const asset of ['./index.html', './styles.css', './app.mjs', '../assets/motion-styles.mjs', '../data/motion-styles.json']) {
    const resolved = new URL(asset, new URL('motion-styles/sw.js', root));
    const info = await stat(resolved);
    assert.ok(info.isFile(), `${asset} exists`);
    assert.ok(sw.includes(asset), `${asset} is precached`);
  }
});
