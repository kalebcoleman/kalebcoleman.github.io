import test from 'node:test';
import assert from 'node:assert/strict';
import { ATTRIBUTE_NAMES, parseSentence, validateSentence } from '../assets/build-from-sentence.mjs';

const badgeNames = ['Posterizer', 'Limitless Range', 'Aerial Wizard', 'Deadeye'];
const parse = text => parseSentence(text, { badgeNames });

const cases = [
  ['height apostrophe', `6'8"`, parsed => assert.equal(parsed.body.height, 80)],
  ['height curly quotes', '6’8”', parsed => assert.equal(parsed.body.height, 80)],
  ['height ft', '6ft8', parsed => assert.equal(parsed.body.height, 80)],
  ['height words', '6 foot 8', parsed => assert.equal(parsed.body.height, 80)],
  ['height dash', '6-8', parsed => assert.equal(parsed.body.height, 80)],
  ['height inches', '68"', parsed => assert.equal(parsed.body.height, 68)],
  ['weight lb', '205 lb', parsed => assert.equal(parsed.body.weight, 205)],
  ['weight lbs', '205lbs', parsed => assert.equal(parsed.body.weight, 205)],
  ['weight pounds', '205 pounds', parsed => assert.equal(parsed.body.weight, 205)],
  ['wingspan suffix', `7'0 WS`, parsed => assert.equal(parsed.body.wingspan, 84)],
  ['wingspan prefix', `wingspan 7'`, parsed => assert.equal(parsed.body.wingspan, 84)],
  ['wingspan offset', '+2 wingspan', parsed => assert.equal(parsed.body.wingspanOffset, 2)],
  ['wingspan inches suffix', '80" wingspan', parsed => assert.equal(parsed.body.wingspan, 80)],
  ['position PG', 'PG', parsed => assert.equal(parsed.body.position, 0)],
  ['position guard', 'guard', parsed => assert.equal(parsed.body.position, 0)],
  ['position wing', 'wing', parsed => assert.equal(parsed.body.position, 2)],
  ['position big', 'big', parsed => assert.equal(parsed.body.position, 4)],
  ['position forward', 'forward', parsed => assert.equal(parsed.body.position, 3)],
  ['position center', 'center', parsed => assert.equal(parsed.body.position, 4)],
  ['target plus', '90+ three', parsed => assert.deepEqual(parsed.targets, [{ attribute: 6, requested: 90, mode: 'min' }])],
  ['target bare', '90 three', parsed => assert.deepEqual(parsed.targets, [{ attribute: 6, requested: 90, mode: 'min' }])],
  ['target at least', 'at least 88 perimeter D', parsed => assert.deepEqual(parsed.targets, [{ attribute: 12, requested: 88, mode: 'min' }])],
  ['target max', 'max speed', parsed => assert.deepEqual(parsed.targets, [{ attribute: 17, requested: null, mode: 'max' }])],
  ['target min', 'min 75 pass', parsed => assert.deepEqual(parsed.targets, [{ attribute: 8, requested: 75, mode: 'min' }])],
  ['target synonym swb', '90 swb', parsed => assert.deepEqual(parsed.targets, [{ attribute: 10, requested: 90, mode: 'min' }])],
  ['target synonym rebound', '80 rebound', parsed => assert.deepEqual(parsed.targets, [{ attribute: 15, requested: 80, mode: 'min' }, { attribute: 16, requested: 80, mode: 'min' }])],
  ['breaker budget', '22 cap breakers', parsed => assert.equal(parsed.breakers.budget, 22)],
  ['breaker plus assignment', '+5 on three', parsed => assert.deepEqual(parsed.breakers.assignments, [{ attribute: 6, amount: 5 }])],
  ['breaker use assignment', 'use 3 breakers on steal', parsed => assert.deepEqual(parsed.breakers.assignments, [{ attribute: 13, amount: 3 }])],
  ['badge HOF', 'HOF posterizer', parsed => assert.deepEqual(parsed.badges, [{ name: 'Posterizer', tier: 4, source: 'HOF posterizer' }])],
  ['badge gold alias', 'gold limitless', parsed => assert.deepEqual(parsed.badges, [{ name: 'Limitless Range', tier: 3, source: 'gold limitless' }])],
  ['badge floor', 'no badges below silver', parsed => assert.equal(parsed.badgeFloor, 2)],
  ['contact dunks', 'contact dunks', parsed => assert.equal(parsed.badges[0].name, 'Posterizer')],
  ['multi-target example', `6'8" two-way wing, 90+ three, 88 perimeter D, contact dunks, 22 cap breakers`, parsed => {
    assert.equal(parsed.body.height, 80);
    assert.equal(parsed.body.position, 2);
    assert.deepEqual(parsed.targets.map(target => [target.attribute, target.requested]), [[6, 90], [12, 88]]);
    assert.equal(parsed.breakers.budget, 22);
    assert.equal(parsed.badges[0].name, 'Posterizer');
    assert.deepEqual(parsed.unparsed, ['two-way']);
  }],
  ['nonsense does not invent attributes', 'make me a unicorn with a magic hat', parsed => {
    assert.equal(parsed.targets.length, 0);
    assert.equal(parsed.body.height, null);
    assert.ok(parsed.unparsed.includes('unicorn'));
  }],
  ['misspelling is not guessed', '90+ thre', parsed => {
    assert.equal(parsed.targets.length, 0);
    assert.ok(parsed.unparsed.some(text => /thre/.test(text)));
  }],
  ['all body forms together', `6'8" 205 lb 7'0" wingspan 90 three`, parsed => {
    assert.deepEqual(parsed.body, { position: null, positionSource: null, height: 80, weight: 205, wingspan: 84, wingspanOffset: null });
    assert.equal(parsed.targets[0].attribute, 6);
  }],
];

for (const [name, text, check] of cases) {
  test(`sentence parser: ${name}`, () => {
    check(parse(text));
  });
}

const fakeG = {
  POSN: ['PG', 'SG', 'SF', 'PF', 'C'],
  ATTRS: ATTRIBUTE_NAMES,
  BADGES: [['Test Badge', [[[0, 80]], [[0, 85]], [[0, 90]], [[0, 95]]], 0]],
  TIERNAME: ['', 'Bronze', 'Silver', 'Gold', 'HOF', 'Legend'],
  heightsFor: () => [80],
  PB: { 2: { 80: { wmin: 180, wmax: 250 } } },
  ceilingsFor: () => Array(21).fill(99),
  upStart: () => Array(21).fill(50),
  settle: () => {},
  ratingOf: alloc => alloc[0] + alloc[1] / 100,
  overallOf: alloc => Math.floor(alloc[0] + alloc[1] / 100),
  trueOvr: alloc => alloc[0] + alloc[1] / 100,
  tierMetAt: () => 0,
  badgeTiersOf: () => Array(21).fill(0),
};

const current = { p: 2, h: 80, w: 200, s: 84, alloc: Array(21).fill(50) };

test('sentence validation reports reachable targets and the chosen body', () => {
  const result = validateSentence(parse('80 three 75 perimeter D'), { G: fakeG, current });
  assert.equal(result.ok, true);
  assert.deepEqual(result.body, { p: 2, h: 80, w: 200, s: 84 });
  assert.equal(result.targetRows.length, 2);
  assert.ok(result.targetRows.every(row => row.reachable));
});

test('sentence validation reports a cap reason instead of clamping silently', () => {
  const capped = { ...fakeG, ceilingsFor: () => { const caps = Array(21).fill(99); caps[6] = 70; return caps; } };
  const result = validateSentence(parse('80 three'), { G: capped, current });
  assert.equal(result.targetRows[0].reachable, false);
  assert.match(result.targetRows[0].reason, /cap 70/);
  assert.equal(result.targetRows[0].actual, 70);
});

test('sentence validation reports breaker shortfall', () => {
  const result = validateSentence(parse('2 cap breakers +5 on three'), { G: fakeG, current });
  assert.equal(result.breakerShortfall, 3);
  assert.equal(result.breakerLevel, 2);
});

test('sentence validation reports an unreachable badge requirement', () => {
  const capped = { ...fakeG, ceilingsFor: () => { const caps = Array(21).fill(99); caps[0] = 70; return caps; } };
  const result = validateSentence(parseSentence('HOF test badge', { badgeNames: ['Test Badge'] }), { G: capped, current });
  assert.equal(result.targetRows[0].reachable, false);
  assert.match(result.targetRows[0].reason, /cap 70/);
});
