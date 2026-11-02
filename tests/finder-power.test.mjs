import test from 'node:test';
import assert from 'node:assert/strict';
import { TOKEN_GROUPS, finderPower, powerLabel, sortFinderResults } from '../assets/finder-power.mjs';

const G = {
  BADGES: [['Alpha'], ['Beta'], ['Gamma']],
  TIERNAME: ['', 'Bronze', 'Silver', 'Gold', 'HOF', 'Legend'],
  badgeTiersOf: () => [3, 0, 4],
  tokensAt: () => [1, 2, 3, 4, 5, 6],
};

const build = { p: 0, h: 79, w: 200, s: 79, alloc: Array(21).fill(50) };

test('finderPower counts earned badge tiers and sums the six token groups', () => {
  const power = finderPower(G, build);
  assert.equal(power.badgeTiers, 2);
  assert.equal(power.tokenBudget, 21);
  assert.equal(power.maxTier, 4);
  assert.deepEqual(power.tokenGroups.map(group => group.name), [...TOKEN_GROUPS]);
  assert.deepEqual(power.tokenGroups.map(group => group.tokens), [1, 2, 3, 4, 5, 6]);
});

test('finderPower sorts the top badges by tier, then name', () => {
  const power = finderPower(G, build);
  assert.deepEqual(
    power.topBadges.map(badge => [badge.name, badge.tier, badge.tierName]),
    [['Gamma', 4, 'HOF'], ['Alpha', 3, 'Gold']],
  );
});

test('finderPower reports unavailable data instead of inventing zeroes', () => {
  const power = finderPower({}, build);
  assert.equal(power.badgeTiers, null);
  assert.equal(power.tokenBudget, null);
  assert.deepEqual(power.topBadges, []);
  assert.equal(finderPower(null, build), null);
});

test('powerLabel names the tier and token totals and the top badges', () => {
  assert.equal(powerLabel(finderPower(G, build)), '2 tiers · 21 tokens · HOF Gamma · Gold Alpha');
  assert.equal(powerLabel(finderPower({}, build)), 'tiers n/a · tokens n/a');
  assert.equal(powerLabel(null), 'Badge and token data unavailable');
});

test('sortFinderResults sorts by true overall, badge tiers and tokens', () => {
  const rows = [
    { name: 'a', trueOvr: 90, power: { badgeTiers: 10, tokenBudget: 20 } },
    { name: 'b', trueOvr: 95, power: { badgeTiers: 5, tokenBudget: 50 } },
    { name: 'c', trueOvr: 92, power: { badgeTiers: 15, tokenBudget: 10 } },
  ];
  assert.deepEqual(sortFinderResults(rows, 'true').map(row => row.name), ['b', 'c', 'a']);
  assert.deepEqual(sortFinderResults(rows, 'badges').map(row => row.name), ['c', 'a', 'b']);
  assert.deepEqual(sortFinderResults(rows, 'tokens').map(row => row.name), ['b', 'a', 'c']);
  assert.deepEqual(sortFinderResults(rows, 'finder').map(row => row.name), ['a', 'b', 'c']);
});

test('sortFinderResults does not mutate the finder rows', () => {
  const rows = [
    { name: 'a', trueOvr: 90, power: { badgeTiers: 10, tokenBudget: 20 } },
    { name: 'b', trueOvr: 95, power: { badgeTiers: 5, tokenBudget: 50 } },
  ];
  const before = rows.map(row => row.name);
  sortFinderResults(rows, 'badges');
  assert.deepEqual(rows.map(row => row.name), before);
});
