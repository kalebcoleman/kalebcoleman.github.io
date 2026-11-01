import test from 'node:test';
import assert from 'node:assert/strict';
import { fuseCandidates } from '../assets/fuse-panel.mjs';

const G = {
  BADGES: [['A'], ['B'], ['C'], ['D']],
  TIERNAME: ['', 'Bronze', 'Silver', 'Gold', 'HOF'],
  tierMetAt(badge) { return [2, 1, 3, 0][badge]; },
  fusePairs(badge) { return badge === 0 ? [1, 3] : badge === 1 ? [0] : []; },
  tierCost(badge, tier) { return badge * 10 + tier; },
};

test('fuse candidates list equipped compatible pairs once and ignore unequipped partners', () => {
  const result = fuseCandidates(G, { h: 75, alloc: Array(21).fill(25) });
  assert.deepEqual(result.tiers, [2, 1, 3, 0]);
  assert.deepEqual(result.equipped, [0, 1, 2]);
  assert.equal(result.pairs.length, 1);
  assert.deepEqual(result.pairs[0], { a: 0, b: 1, aTier: 2, bTier: 1, cost: 13 });
});

test('fuse candidates return an empty list when no compatible pair is equipped', () => {
  const result = fuseCandidates({ ...G, fusePairs: () => [] }, { h: 75, alloc: Array(21).fill(25) });
  assert.equal(result.pairs.length, 0);
  assert.equal(result.equipped.length, 3);
});
