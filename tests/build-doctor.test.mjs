import test from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseBadge, diagnoseBuild, planToTarget } from '../assets/build-doctor.mjs';

const G = {
  ATTRS: Array.from({ length: 21 }, (_value, index) => `Attribute ${index + 1}`),
  BADGES: [['Test Badge', [[[0, 60]], [[0, 70]], [[0, 80]], [[0, 90]]], 0]],
  TIERNAME: ['', 'Bronze', 'Silver', 'Gold', 'HOF'],
  ceilingsFor: () => Array(21).fill(99),
  settle: () => {},
  ratingOf: alloc => alloc[0] + alloc[1] / 100,
  overallOf: alloc => Math.floor(alloc[0] + alloc[1] / 100),
  trueOvr: alloc => alloc[0] + alloc[1] / 100,
  tierMetAt: (_index, alloc) => alloc[0] >= 90 ? 4 : alloc[0] >= 80 ? 3 : alloc[0] >= 70 ? 2 : alloc[0] >= 60 ? 1 : 0,
};

const build = (value) => ({ p: 0, h: 75, w: 180, s: 80, alloc: [value, ...Array(20).fill(50)] });

test('diagnoseBuild explains the raw score and suggests legal single-step changes', () => {
  const result = diagnoseBuild(G, build(50), 60);
  assert.equal(result.overall, 50);
  assert.match(result.diagnosis, /raw score is 50\.5000/);
  assert.ok(result.changes.length > 0);
  assert.equal(result.changes[0].kind, 'raise');
  assert.ok(result.changes[0].alloc[0] > 50);
});

test('diagnoseBuild reports an already-reached target', () => {
  const result = diagnoseBuild(G, build(80), 60);
  assert.equal(result.reached, true);
  assert.equal(result.changes.length, 0);
  assert.match(result.diagnosis, /already reaches/);
});

test('diagnoseBadge finds the missing tier requirement', () => {
  const result = diagnoseBadge(G, build(65), 0, 2);
  assert.equal(result.current, 1);
  assert.equal(result.met, false);
  assert.deepEqual(result.needed.map(gap => [gap.attribute, gap.rating]), [[0, 70]]);
});

test('diagnoseBadge marks requirements above the frame ceiling as unreachable', () => {
  const capped = { ...G, ceilingsFor: () => Array(21).fill(80) };
  const result = diagnoseBadge(capped, build(50), 0, 4);
  assert.equal(result.met, false);
  assert.equal(result.needed.length, 0);
  assert.equal(result.unreachable.length, 1);
  assert.equal(result.unreachable[0].rating, 90);
  assert.equal(result.caps[0], 80);
});

test('planToTarget reaches a reachable overall in small steps', () => {
  const result = planToTarget(G, build(50), 60, 300);
  assert.equal(result.ok, true);
  assert.ok(result.steps.length > 0);
  assert.ok(result.result.overall >= 60);
});
