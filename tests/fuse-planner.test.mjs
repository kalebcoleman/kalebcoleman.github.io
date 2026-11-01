import test from 'node:test';
import assert from 'node:assert/strict';
import { bestPlan, planSummary, tokenPools } from '../assets/fuse-planner.mjs';

const G = {
  BADGES: [['A'], ['B'], ['C']],
  BDISC: '000',
  BW: [1, 1, 1],
  TIERNAME: ['', 'Bronze', 'Silver', 'Gold', 'HOF', 'Legend'],
  slotCaps: () => [3, 3, 3, 3, 3, 3],
  tokensAt: () => [5, 0, 0, 0, 0, 0],
  tierCost: (_index, tier) => tier,
  maxTierOf: () => 3,
  tierMetAt: () => 0,
  fusePairs: () => [],
  effectiveFuse: () => ({ slots: [{ i: 0, tier: 3, boost: 2, gain: 10, react: { i: 1, tier: 2 } }, null] }),
  effectivePlan: () => ({
    equipped: { 0: 3, 1: 2 },
    discs: [
      { disc: 'Finishing', spent: 5, picks: [] },
      { disc: 'Shooting', spent: 0, picks: [] },
      { disc: 'Playmaking', spent: 0, picks: [] },
      { disc: 'Defense', spent: 0, picks: [] },
      { disc: 'Rebounding', spent: 0, picks: [] },
      { disc: 'Physicals', spent: 0, picks: [] },
    ],
    dropped: [],
  }),
};

const build = { p: 0, h: 75, w: 180, s: 80, alloc: Array(21).fill(60) };

test('token pools add flex tokens to the recovered per-group pool', () => {
  assert.deepEqual(tokenPools(G, build, [1, 0, 0, 0, 0, 0]), [6, 0, 0, 0, 0, 0]);
  assert.deepEqual(tokenPools(G, build, null), [5, 0, 0, 0, 0, 0]);
});

test('best plan keeps its picks inside the token budget and group cap', () => {
  const result = bestPlan(G, build, { slots: 0, plusTwo: 0, flexSet: [0, 0, 0, 0, 0, 0], caps: [3, 3, 3, 3, 3, 3] });
  assert.equal(result.tiers.length, 3);
  assert.ok(result.tiers.some(tier => tier > 0));
  const spent = result.tiers.reduce((sum, tier) => sum + G.tierCost(0, tier), 0);
  assert.ok(spent <= 5, `expected <= 5 tokens, got ${spent}`);
  assert.ok(result.tiers.filter(tier => tier > 0).length <= 3);
});

test('plan summary reports spent, pools, equipped badges and fuse results', () => {
  const summary = planSummary(
    G,
    build,
    [3, 2, 0],
    [{ i: 0, react: 1 }, null],
    1,
    [0, 0, 0, 0, 0, 0],
  );
  assert.equal(summary.totalSpent, 5);
  assert.deepEqual(summary.pools, [5, 0, 0, 0, 0, 0]);
  assert.equal(summary.totalTiers, 5);
  assert.equal(summary.equipped.length, 2);
  assert.equal(summary.slots.length, 2);
  assert.equal(summary.slots[0].result, 5);
  assert.equal(summary.slots[0].reactName, 'B');
});
