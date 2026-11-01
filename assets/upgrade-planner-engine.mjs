// Upgrade Planner math, recovered from the public reference bundle.
//
// The reference exposes the VC ladder and the badge-goal planner on its
// engine object. These helpers keep the same arithmetic but clamp the
// displayed overall to the game's 99 wall, which the raw kernel can exceed
// for cap-max bodies.

export const TIER_VALUE = [0, 0, 1, 4, 9, 14];

export const overallOf = (G, alloc, hb, caps) => Math.min(99, G.upR(alloc, hb, caps));

export const vcOf = (G, alloc, hb, caps) => G.upF(overallOf(G, alloc, hb, caps));

export const capFor = (G, alloc, hb, caps) =>
  Math.min(99, Math.max(85, Math.ceil(overallOf(G, alloc, hb, caps) - 1e-9)));

export function buyTarget(G, current, vc, cap, hb, caps) {
  const now = overallOf(G, current, hb, caps);
  const maxOverall = Math.min(99, G.upR(caps, hb, caps));
  const target = Math.min(cap, maxOverall, G.upFinv(G.upF(now) + Math.max(0, vc)));
  return { now, maxOverall, target, gain: target - now };
}

export function planGoals(G, goals, current, { hb, caps, cap }) {
  const fits = alloc => overallOf(G, alloc, hb, caps) <= cap;
  const cost = alloc => vcOf(G, alloc, hb, caps);
  const start = [...current];
  const f0 = cost(start);
  let currentAlloc = [...start];
  let steps = [];
  const have = [];
  let pending = [];
  for (const goal of goals) {
    if (!G.upNeed(goal, currentAlloc, hb, caps)) have.push(goal);
    else pending.push(goal);
  }
  while (pending.length) {
    let best = null;
    for (const goal of pending) {
      const next = G.upNeed(goal, currentAlloc, hb, caps);
      if (!next || !fits(next)) continue;
      const nextCost = cost(next);
      const delta = Math.max(1, nextCost - cost(currentAlloc));
      if (!best || nextCost < best.nextCost || (nextCost === best.nextCost && delta < best.delta)) {
        best = { goal, next, nextCost, delta };
      }
    }
    if (!best) break;
    steps.push({
      g: best.goal,
      from: currentAlloc,
      to: best.next,
      vc: G.upRound(best.nextCost - cost(currentAlloc)),
      tot: G.upRound(best.nextCost - f0),
      r: overallOf(G, best.next, hb, caps),
    });
    currentAlloc = best.next;
    pending = pending.filter(goal => G.upNeed(goal, currentAlloc, hb, caps));
  }
  const wait = pending.map(goal => {
    const need = G.upNeed(goal, currentAlloc, hb, caps);
    return { g: goal, cap: need ? capFor(G, need, hb, caps) : cap };
  });
  wait.sort((a, b) => a.cap - b.cap || G.BW[b.g.b] - G.BW[a.g.b]);
  return { steps, have, wait, end: currentAlloc, f0 };
}

export function autoGoals(G, current, { position, hb, caps, cap }) {
  const priorities = G.prioT()[position];
  const weights = G.BADGES.map(badge => {
    let rank = 21;
    for (const tier of badge[1]) for (const [attribute] of tier) rank = Math.min(rank, priorities[attribute]);
    return 1 + (21 - rank) / 20;
  });
  const value = alloc => G.BADGES.reduce(
    (sum, _badge, index) => sum + G.BW[index] * weights[index] * TIER_VALUE[G.tierMetAt(index, alloc, hb)],
    0,
  );
  const fits = alloc => overallOf(G, alloc, hb, caps) <= cap;
  const cost = alloc => vcOf(G, alloc, hb, caps);

  const candidates = [];
  for (let badge = 0; badge < G.BADGES.length; badge++) {
    const reachable = G.tierMetAt(badge, caps, hb);
    for (let tier = Math.max(2, G.tierMetAt(badge, current, hb) + 1); tier <= reachable; tier++) {
      candidates.push({ b: badge, t: tier });
    }
  }

  let currentAlloc = [...current];
  const f0 = cost(currentAlloc);
  let currentCost = f0;
  let currentValue = value(currentAlloc);
  const steps = [];
  while (candidates.length) {
    let best = null;
    for (const goal of candidates) {
      const next = G.upNeed(goal, currentAlloc, hb, caps);
      if (!next || !fits(next)) continue;
      const nextCost = cost(next);
      const delta = Math.max(1, nextCost - currentCost);
      const ratio = (value(next) - currentValue) / delta;
      if (!best || ratio > best.ratio || (ratio === best.ratio && nextCost < best.nextCost)) {
        best = { goal, next, nextCost, ratio };
      }
    }
    if (!best) break;
    steps.push({
      g: best.goal,
      from: currentAlloc,
      to: best.next,
      vc: G.upRound(best.nextCost - currentCost),
      tot: G.upRound(best.nextCost - f0),
      r: overallOf(G, best.next, hb, caps),
    });
    currentAlloc = best.next;
    currentCost = best.nextCost;
    currentValue = value(currentAlloc);
    for (let index = candidates.length - 1; index >= 0; index--) {
      const goal = candidates[index];
      if (G.tierMetAt(goal.b, currentAlloc, hb) >= goal.t) candidates.splice(index, 1);
    }
  }
  const wait = candidates.map(goal => {
    const need = G.upNeed(goal, currentAlloc, hb, caps);
    return { g: goal, cap: need ? capFor(G, need, hb, caps) : cap };
  });
  wait.sort((a, b) => a.cap - b.cap || G.BW[b.g.b] - G.BW[a.g.b]);
  return { steps, have: [], wait, end: currentAlloc, f0 };
}

export function changes(from, to) {
  const result = [];
  for (let index = 0; index < 21; index++) {
    if (from[index] !== to[index]) result.push({ index, from: from[index], to: to[index] });
  }
  return result;
}
