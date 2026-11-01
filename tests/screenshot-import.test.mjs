import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCandidate, normalizeScreenshot } from '../assets/screenshot-import.mjs';

const ATTRS = [
  'Close Shot', 'Driving Layup', 'Driving Dunk', 'Standing Dunk', 'Post Control',
  'Mid-Range', 'Three-Point', 'Free Throw', 'Pass Accuracy', 'Ball Handle',
  'Speed w/ Ball', 'Interior D', 'Perimeter D', 'Steal', 'Block',
  'Off Rebound', 'Def Rebound', 'Speed', 'Agility', 'Strength', 'Vertical',
];

test('screenshot review maps a partial read and keeps unreadable fields explicit', () => {
  globalThis.window = { GBLE: { ATTRS, POSN: ['PG', 'SG', 'SF', 'PF', 'C'] } };
  const current = { p: 1, h: 78, w: 232, s: 82, alloc: Array.from({ length: 21 }, (_value, index) => 30 + index) };
  const raw = {
    ok: true,
    _layout: 'A',
    pos: 'PG',
    height: 75,
    weight: 170,
    wingspan: 81,
    attrs: Object.fromEntries(ATTRS.map((name, index) => [name, index === 0 ? 77 : 60])),
  };
  const checked = {
    vals: ATTRS.map((_name, index) => index === 0 ? 77 : 60),
    got: 20,
    missing: ['Vertical'],
    bad: ['Close Shot read as "??"'],
    body: { p: 0, h: 75, w: 170, ws: 81 },
    over: 99.4,
    fits: false,
  };
  const review = normalizeScreenshot(raw, checked, current);
  assert.equal(review.layout, '2K HQ app');
  assert.deepEqual(review.body, { p: 0, h: 75, w: 170, ws: 81 });
  assert.equal(review.values[0], 77);
  assert.equal(review.values[20], current.alloc[20], 'a missing attribute falls back to the current build');
  assert.deepEqual(review.missing, ['Vertical']);
  assert.deepEqual(review.bad, ['Close Shot']);
  assert.equal(review.over, 99.4);
  assert.equal(review.fits, false);
});

test('screenshot review falls back to the current body when the body was not read', () => {
  globalThis.window = { GBLE: { ATTRS, POSN: ['PG', 'SG', 'SF', 'PF', 'C'] } };
  const current = { p: 2, h: 79, w: 210, s: 84, alloc: Array(21).fill(40) };
  const review = normalizeScreenshot({ _layout: 'C', attrs: {} }, { vals: Array(21).fill(40), got: 21, missing: [], bad: [], body: null }, current);
  assert.equal(review.layout, 'Attribute Editor');
  assert.equal(review.body, null);
  assert.deepEqual(review.values, Array(21).fill(40));
});

test('screenshot candidates preserve body and attribute values for the builder validator', () => {
  assert.deepEqual(buildCandidate({ p: '0', h: '75', w: '170', ws: '81' }, [25, 60]), {
    p: 0, h: 75, w: 170, s: 81, alloc: [25, 60],
  });
});
