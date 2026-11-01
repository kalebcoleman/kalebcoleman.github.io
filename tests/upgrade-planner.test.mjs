import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  autoGoals,
  buyTarget,
  capFor,
  changes,
  overallOf,
  planGoals,
} from '../assets/upgrade-planner-engine.mjs';

const root = new URL('../', import.meta.url);

test('the upgrade planner page mounts the recovered VC engine', async () => {
  for (const file of ['upgrade-planner.html', 'upgrade-planner/index.html']) {
    const html = await readFile(new URL(file, root), 'utf8');
    assert.match(html, /NBA 2K27 Upgrade Planner/);
    assert.match(html, /\/assets\/lab-engine\.js/);
    assert.match(html, /\/assets\/upgrade-planner\.mjs/);
    assert.match(html, /\/assets\/upgrade-planner\.css/);
    assert.match(html, /id="planner"/);
    assert.match(html, /href="\/upgrade-planner"/);
  }
});

// A small, monotonic stand-in for the recovered engine. The real arithmetic is
// exercised in the browser audit; this test guards the planner flow itself.
const G = {
  BADGES: [
    ['First', [[[0, 50]], [[0, 60]], [[0, 70]], [[0, 80]]], 0],
    ['Second', [[[1, 55]], [[1, 65]], [[1, 75]], [[1, 85]]], 0],
    ['Third', [[[2, 50]], [[2, 60]], [[2, 70]], [[2, 80]]], 0],
  ],
  BW: [3, 2, 1],
  upR: alloc => alloc.reduce((sum, value) => sum + value, 0) / 21,
  upF: rating => rating * 1000,
  upFinv: vc => vc / 1000,
  upRound: Math.round,
  upNeed(goal, alloc) {
    const needed = (goal.t + 1) * 10;
    if (alloc[goal.b] >= needed) return null;
    const next = [...alloc];
    next[goal.b] = needed;
    return next;
  },
  tierMetAt(badge, alloc) {
    const thresholds = G.BADGES[badge][1];
    for (let tier = 4; tier >= 1; tier--) {
      if (alloc[badge] >= thresholds[tier - 1][0][1]) return tier;
    }
    return 0;
  },
  prioT: () => [[0, 1, 2], [0, 1, 2], [0, 1, 2], [0, 1, 2], [0, 1, 2]],
};

const caps = Array(21).fill(99);

test('buyTarget reports the overall a VC balance reaches without passing the cap', () => {
  const current = Array(21).fill(25);
  const buy = buyTarget(G, current, 10_000, 99, 0, caps);
  assert.equal(buy.now, 25);
  assert.equal(buy.target, 35);
  assert.equal(buy.gain, 10);
  const capped = buyTarget(G, current, 100_000, 40, 0, caps);
  assert.equal(capped.target, 40);
});

test('planGoals orders the goals and keeps every step under the cap', () => {
  const current = Array(21).fill(25);
  const plan = planGoals(G, [{ b: 0, t: 2 }, { b: 1, t: 2 }], current, { hb: 0, caps, cap: 99 });
  assert.equal(plan.steps.length, 2);
  assert.deepEqual(plan.steps.map(step => step.g.b), [0, 1]);
  assert.ok(plan.steps.every(step => step.vc >= 0 && step.tot >= 0));
  assert.ok(overallOf(G, plan.end, 0, caps) <= 99);
  assert.equal(plan.have.length, 0);
  assert.equal(plan.wait.length, 0);
});

test('autoGoals finds reachable Silver badges and reports cap waits', () => {
  const current = Array(21).fill(25);
  const plan = autoGoals(G, current, { position: 1, hb: 0, caps, cap: 30 });
  assert.ok(plan.steps.length > 0);
  assert.ok(plan.steps.every(step => overallOf(G, step.to, 0, caps) <= 30));
  const loose = autoGoals(G, current, { position: 1, hb: 0, caps, cap: 99 });
  assert.ok(loose.steps.length >= plan.steps.length);
});

test('capFor never returns a cap below 85 or above 99', () => {
  assert.equal(capFor(G, Array(21).fill(25), 0, caps), 85);
  assert.equal(capFor(G, Array(21).fill(99), 0, caps), 99);
});

test('changes lists only the attributes a step raises', () => {
  const from = [25, 25, 25];
  const to = [25, 30, 25];
  assert.deepEqual(changes(from, to), [{ index: 1, from: 25, to: 30 }]);
});
