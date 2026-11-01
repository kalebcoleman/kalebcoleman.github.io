import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const DATA_DIR = new URL('../data/reference-builds/', import.meta.url);
const FILES = ['index.json', 'goats.json', 'goated.json', 'meta-builds.json'];
const GOATS_KEYS = [
  'penny', 'arenas', 'klay', 'melo', 'kirilenko', 'kawhi', 'ad', 'dwight',
  'magic', 'dirk', 'kobe', 'lebron', 'hakeem', 'rose', 'ray-allen', 'jordan',
  'edwards', 'wilt'
];
const GOATED_KEYS = [
  'curry', 'lillard', 'irving', 'nash', 'thomas', 'hardaway', 'kidd',
  'robertson', 'sga', 'luka', 'payton'
];
const META_IDS = [
  'lock-66', 'x-baconmctriple', 'x-alexntweets', 'x-sheprettynice',
  'x-ejlocascio', 'x-magicgiannson', 'x-stellarct', 'x-90sbabyreese',
  'x-dcannon27', 'x-bocbocboog', 'x-touchmyspatulas', 'x-rogdizzlepdx',
  'x-gillie2kstone', 'x-sirdubslot', 'x-curiosojorge704'
];
const GOAT_RECORD_KEYS = [
  'key', 'name', 'positionIndex', 'position', 'heightInches', 'weightLb',
  'wingspanInches', 'unlock', 'attributes', 'normalCeilings', 'jumpshot',
  'jersey', 'animations', 'dunks', 'alleyOops', 'badgeTierThresholds'
];
const GOATED_RECORD_KEYS = [
  'key', 'name', 'teamSeason', 'season', 'positionIndex', 'position',
  'heightInches', 'weightLb', 'wingspanInches', 'attributes', 'capBreakers',
  'card', 'jersey', 'youtubeVideoId', 'bio', 'image'
];
const META_RECORD_KEYS = [
  'id', 'name', 'positionIndex', 'position', 'source', 'heightRangeInches',
  'role', 'why', 'code', 'decodedCode', 'floors', 'avoid'
];

const texts = Object.fromEntries(await Promise.all(
  FILES.map(async (name) => [name, await readFile(new URL(name, DATA_DIR), 'utf8')])
));
const data = Object.fromEntries(
  Object.entries(texts).map(([name, text]) => [name, JSON.parse(text)])
);
const index = data['index.json'];
const goats = data['goats.json'];
const goated = data['goated.json'];
const meta = data['meta-builds.json'];
const attributes = index.extraction.supportingConstants.attributeOrder;

function sha256(text) {
  return createHash('sha256').update(text).digest('hex');
}

function assertAttributeMap(map, label) {
  assert.deepEqual(Object.keys(map), attributes, `${label} attribute order`);
  for (const [attribute, value] of Object.entries(map)) {
    assert.ok(Number.isInteger(value), `${label}.${attribute} is an integer`);
    assert.ok(value >= 0 && value <= 99, `${label}.${attribute} is a rating`);
  }
}

function assertNoFloats(value, path = 'root') {
  if (typeof value === 'number') {
    assert.ok(Number.isInteger(value), `${path} is an integer`);
  } else if (Array.isArray(value)) {
    value.forEach((entry, i) => assertNoFloats(entry, `${path}[${i}]`));
  } else if (value && typeof value === 'object') {
    for (const [key, entry] of Object.entries(value)) {
      assertNoFloats(entry, `${path}.${key}`);
    }
  }
}

test('index counts, file metadata and digests match the data files', () => {
  assert.equal(index.schemaVersion, 1);
  assert.equal(goats.schemaVersion, 1);
  assert.equal(goated.schemaVersion, 1);
  assert.equal(meta.schemaVersion, 1);
  assert.deepEqual(index.counts, { goats: 18, goated: 11, metaBuilds: 15 });
  assert.equal(goats.count, 18);
  assert.equal(goated.count, 11);
  assert.equal(meta.count, 15);
  assert.equal(goats.builds.length, 18);
  assert.equal(goated.builds.length, 11);
  assert.equal(meta.presets.length, 15);

  for (const [key, name, count] of [
    ['goats', 'goats.json', 18],
    ['goated', 'goated.json', 11],
    ['metaBuilds', 'meta-builds.json', 15]
  ]) {
    const entry = index.files[key];
    assert.equal(entry.path, `data/reference-builds/${name}`);
    assert.equal(entry.bytes, Buffer.byteLength(texts[name]));
    assert.equal(entry.sha256, sha256(texts[name]));
    assert.equal(entry.sha256.length, 64);
    assert.ok(count > 0);
  }
});

test('shared attribute order and positions are consistent', () => {
  assert.equal(attributes.length, 21);
  assert.equal(new Set(attributes).size, 21);
  for (const file of [goats, goated, meta]) {
    assert.deepEqual(file.attributeOrder, attributes);
    assert.equal(file.positions.length, 5);
    assert.deepEqual(file.positions.map((position) => position.abbreviation), ['PG', 'SG', 'SF', 'PF', 'C']);
    assert.deepEqual(
      file.positions.map((position) => position.abbreviation),
      index.extraction.supportingConstants.positions
    );
  }
  assert.deepEqual(index.extraction.supportingConstants.attributeGroups, [
    ['Finishing', 0, 5],
    ['Shooting', 5, 8],
    ['Playmaking', 8, 11],
    ['Defense', 11, 15],
    ['Rebounding', 15, 17],
    ['Physicals', 17, 21]
  ]);
});

test('GOAT builds have the expected stable inventory and shape', () => {
  assert.deepEqual(goats.builds.map((build) => build.key), GOATS_KEYS);
  assert.equal(new Set(GOATS_KEYS).size, GOATS_KEYS.length);
  assert.deepEqual(index.extraction.supportingConstants.unlockGroups, [
    ['now', 'Available now'],
    ['pass', 'Season 2 pass'],
    ['rep', 'REP rewards'],
    ['chal', 'Lifetime Challenges']
  ]);

  for (const build of goats.builds) {
    assert.deepEqual(Object.keys(build), GOAT_RECORD_KEYS, build.key);
    assert.equal(typeof build.name, 'string');
    assert.ok(build.name.length > 0);
    assert.ok(Number.isInteger(build.positionIndex) && build.positionIndex >= 0 && build.positionIndex <= 4);
    assert.equal(build.position, goats.positions[build.positionIndex].abbreviation);
    assert.ok(Number.isInteger(build.heightInches) && build.heightInches >= 63 && build.heightInches <= 93);
    assert.ok(Number.isInteger(build.weightLb) && build.weightLb >= 100);
    assert.ok(Number.isInteger(build.wingspanInches));
    assert.ok(goats.unlockGroups.some((group) => group.key === build.unlock.group));
    assert.equal(typeof build.unlock.label, 'string');
    assert.equal(typeof build.unlock.detail, 'string');
    assertAttributeMap(build.attributes, `${build.key}.attributes`);
    assertAttributeMap(build.normalCeilings, `${build.key}.normalCeilings`);
    assert.equal(Object.keys(build.jumpshot).length, 3);
    assert.ok(Object.values(build.jumpshot).every((value) => typeof value === 'string'));
    assert.equal(build.jersey.colors.length, 6);
    assert.ok(build.jersey.colors.every((color) => typeof color === 'string'));
    assert.ok(build.dunks.length > 0);
    assert.ok(Array.isArray(build.alleyOops));
    assert.ok(build.animations.length > 0);
    for (const group of build.animations) {
      assert.equal(typeof group.group, 'string');
      assert.ok(group.items.length > 0);
      for (const item of group.items) {
        assert.equal(Object.keys(item).length, 2);
        assert.ok(typeof item.category === 'string' && typeof item.name === 'string');
      }
    }
    if (build.badgeTierThresholds !== null) {
      assert.deepEqual(Object.keys(build.badgeTierThresholds), attributes, `${build.key}.badgeTierThresholds`);
      for (const [attribute, values] of Object.entries(build.badgeTierThresholds)) {
        assert.ok(Array.isArray(values), `${build.key}.badgeTierThresholds.${attribute} is an array`);
        assert.ok(values.every((value) => Number.isInteger(value)));
      }
    }
  }

  assert.deepEqual(
    goats.builds.filter((build) => build.badgeTierThresholds !== null).map((build) => build.key),
    ['magic', 'dirk']
  );
});

test('GOATED builds have the expected stable inventory, breakers and attribution', () => {
  assert.deepEqual(goated.builds.map((build) => build.key), GOATED_KEYS);
  assert.equal(new Set(GOATED_KEYS).size, GOATED_KEYS.length);
  assert.equal(goated.capBreakerMax, 26);
  assert.equal(index.extraction.supportingConstants.goatedCapBreakerMax, 26);

  for (const build of goated.builds) {
    assert.deepEqual(Object.keys(build), GOATED_RECORD_KEYS, build.key);
    assert.equal(typeof build.name, 'string');
    assert.ok(build.name.length > 0);
    assert.equal(build.position, goated.positions[build.positionIndex].abbreviation);
    assert.ok(Number.isInteger(build.heightInches) && build.heightInches >= 63);
    assert.ok(Number.isInteger(build.weightLb) && build.weightLb >= 100);
    assert.ok(Number.isInteger(build.wingspanInches));
    assertAttributeMap(build.attributes, `${build.key}.attributes`);
    assertAttributeMap(build.card.attributes, `${build.key}.card.attributes`);
    assert.ok(Number.isInteger(build.card.overall) && build.card.overall >= 0 && build.card.overall <= 99);

    const { capBreakers } = build;
    assert.equal(capBreakers.max, 26);
    assert.equal(capBreakers.total, capBreakers.order.length);
    assert.ok(capBreakers.total <= capBreakers.max);
    assert.ok(capBreakers.order.every((value) => Number.isInteger(value) && value >= 0 && value <= 20));
    const counts = new Array(21).fill(0);
    for (const value of capBreakers.order) counts[value]++;
    assert.deepEqual(Object.values(capBreakers.byAttribute), counts);
    assert.deepEqual(Object.keys(capBreakers.byAttribute), attributes);
    assert.ok(counts.every((count) => count <= 5));

    assert.equal(build.jersey.colors.length, 6);
    assert.ok(build.jersey.colors.every((color) => typeof color === 'string'));
    assert.ok(typeof build.youtubeVideoId === 'string' && build.youtubeVideoId.length > 0);
    assert.ok(typeof build.bio === 'string' && build.bio.length > 0);
    if (build.image !== null) {
      assert.equal(typeof build.image.sourcePath, 'string');
      assert.ok(build.image.sourcePath.startsWith('/goated/img/'));
      assert.equal(typeof build.image.author, 'string');
      assert.equal(typeof build.image.license, 'string');
      assert.match(build.image.sourceUrl, /^https:\/\/commons\.wikimedia\.org\//);
      if (build.image.edge !== undefined) assert.equal(typeof build.image.edge, 'string');
    }
  }

  assert.equal(goated.builds.filter((build) => build.image !== null).length, 9);
  assert.deepEqual(goated.builds.find((build) => build.key === 'curry').image, {
    sourcePath: '/goated/img/curry.webp?v=9305d6a5',
    author: 'Keith Allison',
    license: 'CC BY-SA 2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Stephen_Curry_dribbling_2016.jpg'
  });
  assert.ok(goated.builds.every((build) => build.position === 'PG'));
});

test('META_BUILDS presets decode to the stored shape and code', () => {
  assert.deepEqual(meta.presets.map((preset) => preset.id), META_IDS);
  assert.equal(new Set(META_IDS).size, META_IDS.length);
  assert.deepEqual(meta.sources, ['user', 'community']);

  for (const preset of meta.presets) {
    assert.deepEqual(Object.keys(preset), META_RECORD_KEYS, preset.id);
    assert.equal(typeof preset.name, 'string');
    assert.ok(meta.sources.includes(preset.source));
    assert.equal(preset.position, meta.positions[preset.positionIndex].abbreviation);
    assert.ok(preset.heightRangeInches.min <= preset.heightRangeInches.max);
    assert.equal(typeof preset.role, 'string');
    assert.equal(typeof preset.why, 'string');
    assert.equal(typeof preset.code, 'string');

    const query = new URLSearchParams(preset.code);
    const codePosition = Number(query.get('p'));
    const codeAttributes = query.get('v').split('.').map(Number);
    const codeBreakers = (query.get('o') || '').split('.').filter(Boolean).map(Number);
    assert.equal(codePosition, preset.positionIndex);
    assert.equal(Number(query.get('h')), preset.decodedCode.heightInches);
    assert.equal(Number(query.get('w')), preset.decodedCode.weightLb);
    assert.equal(Number(query.get('s')), preset.decodedCode.wingspanInches);
    assert.equal(preset.decodedCode.positionIndex, preset.positionIndex);
    assert.equal(preset.decodedCode.position, preset.position);
    assert.equal(codeAttributes.length, 21);
    assertAttributeMap(preset.decodedCode.attributes, `${preset.id}.decodedCode.attributes`);
    assert.deepEqual(Object.values(preset.decodedCode.attributes), codeAttributes);
    assert.equal(preset.decodedCode.capBreakers.total, codeBreakers.length);
    assert.deepEqual(preset.decodedCode.capBreakers.order, codeBreakers);
    assert.ok(
      preset.decodedCode.heightInches >= preset.heightRangeInches.min
      && preset.decodedCode.heightInches <= preset.heightRangeInches.max
    );

    for (const field of ['floors', 'avoid']) {
      const values = preset[field];
      assert.ok(Object.keys(values).length > 0, `${preset.id}.${field} is not empty`);
      for (const [attribute, value] of Object.entries(values)) {
        assert.ok(attributes.includes(attribute), `${preset.id}.${field} uses a known attribute`);
        assert.ok(Number.isInteger(value) && value >= 0 && value <= 99);
      }
    }
  }

  assert.equal(meta.presets.filter((preset) => preset.source === 'user').length, 1);
  assert.equal(meta.presets.filter((preset) => preset.source === 'community').length, 14);
});

test('provenance and literal digests are complete', () => {
  assert.equal(index.snapshotDate, '2026-11-01');
  assert.equal(index.source.snapshotDate, '2026-11-01');
  assert.equal(index.source.archive, 'goated-reference-2026-11-01.zip');
  assert.equal(index.source.enginePath, 'public-bundle/engine.js');
  assert.equal(index.source.engineBytes, 1136304);
  assert.equal(index.source.engineSha256, '2171862d065f778eca9fb95e5772482d7ba0400310a29207f3cd38e7a197f74c');
  assert.equal(index.source.archiveSha256, '43da5d3c59fbb425ff74f61608303661de393b02be21e4ed19b53d98521099c3');
  assert.match(index.source.engineUrl, /^https:\/\/www\.goatedbuildlab\.com\/engine\/engine\.js\?v=/);
  assert.match(index.extraction.method, /no app bundle code was executed/i);

  const expected = {
    GOATS: ['GBLE.GOATS', 'Ne', 975263, 1022464, 'e7d16bf4c0926db6dcc238dd31d2a27e53bbf9cfee75c9bf3b8cd497eb8a3019'],
    GOATED: ['GBLE.GOATED', 'ye', 1042564, 1050376, 'b9c04fc8d5eedfc42f77f04d9d1c6ec2c3d239f72c30db0ac6c1350a9eed116e'],
    META_BUILDS: ['GBLE.META_BUILDS', 'FY', 893745, 903794, '64d2ab627333fc3e2dec1fedd3cbe7274a19ac38448ea7fd53655337173fc7af']
  };
  for (const [name, [exportName, symbol, start, end, digest]] of Object.entries(expected)) {
    const module = index.extraction.modules[name];
    assert.equal(module.export, exportName);
    assert.equal(module.minifiedSymbol, symbol);
    assert.equal(module.arrayStartOffset, start);
    assert.equal(module.arrayEndOffset, end);
    assert.equal(module.literalSha256, digest);
    assert.equal(module.declarationOffset, start - `var ${symbol}=`.length);
  }

  for (const [file, symbol, moduleKey] of [
    [goats, 'GBLE.GOATS', 'GOATS'],
    [goated, 'GBLE.GOATED', 'GOATED'],
    [meta, 'GBLE.META_BUILDS', 'META_BUILDS']
  ]) {
    assert.equal(file.source.engineSha256, index.source.engineSha256);
    assert.equal(file.source.archiveSha256, index.source.archiveSha256);
    assert.equal(file.source.symbol, symbol);
    assert.equal(file.source.literal.sha256, index.extraction.modules[moduleKey].literalSha256);
    assert.match(file.source.literal.sha256, /^[a-f0-9]{64}$/);
    assert.ok(file.source.literal.end > file.source.literal.start);
  }
});

test('JSON is canonical, deterministic and contains no floating-point numbers', () => {
  for (const name of FILES) {
    const text = texts[name];
    assert.ok(text.endsWith('\n'), `${name} ends with a newline`);
    assert.ok(!text.includes('\r'), `${name} has LF newlines`);
    assert.equal(text, `${JSON.stringify(data[name], null, 2)}\n`, `${name} uses canonical formatting`);
    assertNoFloats(data[name], name);
  }
});
