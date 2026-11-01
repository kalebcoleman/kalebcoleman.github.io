/**
 * Free Fuse planner.
 *
 * Uses the recovered GBLE client rules:
 *   effectivePlan, effectiveFuse, slotCaps, fusePairs, tierCost, tokensAt, maxTierOf.
 *
 * The token ladder is per position and exact height (not the height bucket), so
 * this module passes build.p and build.h to tokensAt. The recovered plan state
 * is global; every render sets it before reading a plan.
 */

const GROUPS = ['Finishing', 'Shooting', 'Playmaking', 'Defense', 'Rebounding', 'Physicals'];
const TIER_LIMIT = 5;

const tierName = (G, tier) => G.TIERNAME?.[tier] ?? `Tier ${tier}`;

function groupOf(G, index) {
  const digit = Number(G.BDISC?.[index]);
  return Number.isFinite(digit) && digit >= 0 && digit < GROUPS.length ? digit : 0;
}

function tiersObject(tiers) {
  const equipped = {};
  for (let index = 0; index < tiers.length; index += 1) {
    if (tiers[index] > 0) equipped[index] = tiers[index];
  }
  return equipped;
}

export function fuseCandidates(G, build, limit = 20) {
  const hb = build.h - 63;
  const tiers = G.BADGES.map((_badge, index) => G.tierMetAt(index, build.alloc, hb));
  const equipped = tiers.map((tier, index) => tier > 0 ? index : -1).filter(index => index >= 0);
  const seen = new Set();
  const pairs = [];
  for (const badge of equipped) {
    for (const partner of G.fusePairs(badge)) {
      if (partner === badge || tiers[partner] <= 0) continue;
      const key = [badge, partner].sort((a, b) => a - b).join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        a: badge,
        b: partner,
        aTier: tiers[badge],
        bTier: tiers[partner],
        cost: (G.tierCost(badge, tiers[badge], build.h) || 0) + (G.tierCost(partner, tiers[partner], build.h) || 0),
      });
    }
  }
  pairs.sort((left, right) => right.cost - left.cost || left.a - right.a);
  return { tiers, equipped, pairs: pairs.slice(0, limit) };
}

export function earnedTiers(G, build) {
  const hb = build.h - 63;
  return G.BADGES.map((_badge, index) => G.tierMetAt(index, build.alloc, hb));
}

export function maxTiers(G, build) {
  return G.BADGES.map((_badge, index) => G.maxTierOf(index, build.alloc, build.h));
}

export function tokenPools(G, build, flexSet) {
  const base = G.tokensAt(build.alloc, build.p, build.h) ?? [0, 0, 0, 0, 0, 0];
  return base.map((value, index) => Number(value) + (Number(flexSet?.[index]) || 0));
}

function setPlanState(G, build, tiers, slots, plusTwo, flexSet, fuseSet) {
  G.S = { p: build.p, h: build.h, w: build.w, ws: build.s };
  G.TIERSET = tiers.slice();
  G.PLANMODE = 'manual';
  G.FLEX = (flexSet ?? []).reduce((sum, value) => sum + (Number(value) || 0), 0);
  G.FLEXSET = (flexSet ?? [0, 0, 0, 0, 0, 0]).slice(0, 6);
  G.SYNN = slots;
  G.SYN2 = plusTwo;
  G.FUSESET = fuseSet;
}

export function bestFuseSlots(G, build, tiers, slots, plusTwo) {
  G.SYNN = slots;
  G.SYN2 = plusTwo;
  G.FUSESET = null;
  const fuse = G.effectiveFuse({ equipped: tiersObject(tiers) }, build.alloc);
  const result = new Array(slots).fill(null);
  for (let index = 0; index < slots; index += 1) {
    const slot = fuse?.slots?.[index];
    if (slot?.i != null) result[index] = { i: slot.i, react: slot.react?.i ?? null };
  }
  return result;
}

function bestGroupTiers(G, build, budgets, caps, fused) {
  const max = maxTiers(G, build);
  const tiers = new Array(G.BADGES.length).fill(0);
  for (let group = 0; group < GROUPS.length; group += 1) {
    const items = [];
    for (let index = 0; index < G.BADGES.length; index += 1) {
      if (groupOf(G, index) !== group || max[index] <= 0) continue;
      items.push(index);
    }
    if (!items.length) continue;
    const budget = Math.max(0, Math.min(999, Number(budgets[group]) || 0));
    const cap = Math.max(0, Math.min(9, Number(caps[group]) || 0));
    const dp = Array.from({ length: cap + 1 }, () => new Array(budget + 1).fill(-Infinity));
    dp[0][0] = 0;
    const choices = [];
    for (const index of items) {
      const maxTier = Math.max(0, Math.min(5, Number(max[index]) || 0));
      if (!maxTier) continue;
      const next = dp.map(row => row.slice());
      const pick = Array.from({ length: cap + 1 }, () => new Array(budget + 1).fill(0));
      const weight = Number(G.BW?.[index]) || 1;
      for (let count = 0; count < cap; count += 1) {
        if (!dp[count]) continue;
        for (let spent = 0; spent <= budget; spent += 1) {
          if (!Number.isFinite(dp[count][spent])) continue;
          for (let tier = 1; tier <= maxTier; tier += 1) {
            const cost = fused.has(index) ? 0 : (Number(G.tierCost(index, tier, build.h)) || 0);
            if (!Number.isFinite(cost) || spent + cost > budget) continue;
            const value = dp[count][spent] + tier * weight;
            if (!next[count + 1] || value <= next[count + 1][spent + cost]) continue;
            next[count + 1][spent + cost] = value;
            pick[count + 1][spent + cost] = tier;
          }
        }
      }
      choices.push({ index, pick });
      for (let count = 0; count <= cap; count += 1) dp[count] = next[count];
    }
    let bestCount = 0;
    let bestSpent = 0;
    let bestValue = -Infinity;
    for (let count = 0; count <= cap; count += 1) {
      for (let spent = 0; spent <= budget; spent += 1) {
        if (dp[count][spent] > bestValue) {
          bestValue = dp[count][spent];
          bestCount = count;
          bestSpent = spent;
        }
      }
    }
    let count = bestCount;
    let spent = bestSpent;
    for (let cursor = choices.length - 1; cursor >= 0; cursor -= 1) {
      const { index, pick } = choices[cursor];
      const tier = pick[count][spent];
      if (tier > 0) {
        tiers[index] = tier;
        spent -= fused.has(index) ? 0 : G.tierCost(index, tier, build.h);
        count -= 1;
      }
    }
  }
  return tiers;
}

function clampGroupCaps(G, tiers, caps) {
  const result = tiers.slice();
  for (let group = 0; group < GROUPS.length; group += 1) {
    const cap = Math.max(0, Math.min(9, Number(caps[group]) || 0));
    const indexes = [];
    for (let index = 0; index < result.length; index += 1) {
      if (groupOf(G, index) === group && result[index] > 0) indexes.push(index);
    }
    if (indexes.length <= cap) continue;
    indexes.sort((a, b) => result[b] - result[a]);
    for (const index of indexes.slice(cap)) result[index] = 0;
  }
  return result;
}

export function bestPlan(G, build, { slots = 8, plusTwo = 6, flexSet = [0, 0, 0, 0, 0, 0], caps = G.slotCaps() } = {}) {
  const budgets = tokenPools(G, build, flexSet);
  let fused = new Set();
  let tiers = bestGroupTiers(G, build, budgets, caps, fused);
  let fuseSlots = bestFuseSlots(G, build, tiers, slots, plusTwo);
  for (let pass = 0; pass < 2; pass += 1) {
    fused = new Set(fuseSlots.filter(Boolean).map(slot => slot.i));
    tiers = bestGroupTiers(G, build, budgets, caps, fused);
    fuseSlots = bestFuseSlots(G, build, tiers, slots, plusTwo);
  }
  return { tiers, fuseSlots, budgets };
}

export function planSummary(G, build, tiers, fuseSlots, plusTwo, flexSet) {
  const slots = fuseSlots.length;
  const fuseSet = fuseSlots.map(slot => slot ? { i: slot.i, react: slot.react ?? null } : null);
  setPlanState(G, build, tiers, slots, plusTwo, flexSet, fuseSet);
  const plan = G.effectivePlan(build.alloc);
  const fuse = G.effectiveFuse(plan ?? { equipped: tiersObject(tiers) }, build.alloc);
  const pools = tokenPools(G, build, flexSet);
  const spent = (plan?.discs ?? []).map(disc => Number(disc.spent) || 0);
  const totalSpent = spent.reduce((sum, value) => sum + value, 0);
  const totalBudget = pools.reduce((sum, value) => sum + value, 0);
  const equipped = Object.entries(plan?.equipped ?? {})
    .map(([index, tier]) => ({
      i: Number(index),
      tier: Number(tier),
      name: G.BADGES[Number(index)][0],
      cost: G.tierCost(Number(index), Number(tier), build.h),
      group: GROUPS[groupOf(G, Number(index))],
    }))
    .sort((a, b) => b.tier - a.tier || a.i - b.i);
  const slotsOut = (fuse?.slots ?? []).slice(0, slots).map((slot, index) => {
    if (!slot) return null;
    return {
      slot: index + 1,
      i: slot.i,
      name: G.BADGES[slot.i][0],
      tier: slot.tier,
      boost: slot.boost,
      result: Math.min(TIER_LIMIT, slot.tier + slot.boost),
      react: slot.react?.i ?? null,
      reactName: slot.react ? G.BADGES[slot.react.i][0] : null,
      reactTier: slot.react?.tier ?? null,
      gain: slot.gain ?? 0,
    };
  });
  const over = spent.map((value, index) => value > pools[index]);
  const totalTiers = equipped.reduce((sum, row) => sum + row.tier, 0);
  const fuseGain = slotsOut.filter(Boolean).reduce((sum, slot) => sum + slot.gain, 0);
  return {
    plan,
    fuse,
    pools,
    spent,
    totalSpent,
    totalBudget,
    over,
    equipped,
    slots: slotsOut,
    totalTiers,
    fuseGain,
    dropped: plan?.dropped ?? [],
    auto: plan?.auto ?? false,
  };
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function option(value, label, selected) {
  const element = document.createElement('option');
  element.value = String(value);
  element.textContent = label;
  element.selected = !!selected;
  return element;
}

function label(text, control) {
  const element = node('label', 'lbl');
  element.append(text, control);
  return element;
}

export function mountFusePlanner(root, { getBuild }) {
  const panel = node('section', 'panel fuse-planner');
  panel.setAttribute('aria-label', 'Fuse planner');
  const head = node('div', 'panel-head');
  head.append(node('h2', null, 'Fuse planner'), node('span', 'muted', 'Recovered client rules'));
  const note = node('p', 'muted', 'A Fuse slot raises its badge 1 or 2 tiers for the whole game and costs no tokens. It is the only way to Legend. Its Reaction badge goes up when the Fuse badge triggers.');
  const mode = node('div', 'fb-mode');
  mode.setAttribute('role', 'group');
  mode.setAttribute('aria-label', 'Fuse plan mode');
  const bestButton = node('button', 'btn', 'Best fit');
  bestButton.type = 'button';
  const mineButton = node('button', 'btn', 'My picks');
  mineButton.type = 'button';
  mode.append(bestButton, mineButton);
  const controls = node('div', 'fieldset fuse-controls');
  const slotsSelect = document.createElement('select');
  slotsSelect.className = 'sel';
  slotsSelect.setAttribute('aria-label', 'Fuse slots');
  for (let value = 0; value <= 9; value += 1) slotsSelect.append(option(value, `${value} slot${value === 1 ? '' : 's'}`));
  const plusSelect = document.createElement('select');
  plusSelect.className = 'sel';
  plusSelect.setAttribute('aria-label', '+2 fuse slots');
  for (let value = 0; value <= 6; value += 1) plusSelect.append(option(value, `${value} +2 slot${value === 1 ? '' : 's'}`));
  const reset = node('button', 'btn', 'Reset to earned');
  reset.type = 'button';
  const useBest = node('button', 'btn', 'Use best picks');
  useBest.type = 'button';
  controls.append(label('Fuse slots', slotsSelect), label('+2 slots', plusSelect), reset, useBest);
  const summary = node('p', 'fuse-summary');
  summary.setAttribute('role', 'status');
  summary.setAttribute('aria-live', 'polite');
  const budgetsHost = node('div');
  const slotsHost = node('div');
  const pins = document.createElement('details');
  pins.className = 'fuse-pins';
  pins.append(node('summary', null, 'Tier pins'));
  const pinHost = node('div', 'fuse-pin-grid');
  pins.append(pinHost);
  const flexDetails = document.createElement('details');
  flexDetails.className = 'fuse-flex';
  flexDetails.append(node('summary', null, 'Flex tokens and group caps'));
  const flexHost = node('div', 'fuse-flex-grid');
  flexDetails.append(flexHost);
  const pairsHost = node('div');
  const honesty = node('p', 'muted fuse-note', 'The in-game Fuse result table is the final authority. This planner uses the recovered client rules and never spends tokens.');
  panel.append(head, note, mode, controls, summary, budgetsHost, slotsHost, pins, flexDetails, pairsHost, honesty);
  root.append(panel);

  const state = {
    mode: 'best',
    slots: 8,
    plusTwo: 6,
    flexSet: [0, 0, 0, 0, 0, 0],
    caps: [3, 3, 3, 3, 3, 3],
    tiers: [],
    fuseSlots: [],
    signature: '',
  };

  function build() {
    return getBuild();
  }

  function signatureOf(build) {
    return `${build.p}:${build.h}:${build.w}:${build.s}:${build.alloc.join('.')}`;
  }

  function currentPlan(build) {
    if (state.mode === 'best') {
      const best = bestPlan(window.GBLE, build, { slots: state.slots, plusTwo: state.plusTwo, flexSet: state.flexSet, caps: state.caps });
      state.tiers = best.tiers;
      state.fuseSlots = best.fuseSlots;
    }
    const tiers = clampGroupCaps(window.GBLE, state.tiers, state.caps);
    state.tiers = tiers;
    return planSummary(window.GBLE, build, tiers, state.fuseSlots, state.plusTwo, state.flexSet);
  }

  function setMode(next) {
    if (state.mode === next) return;
    if (next === 'mine') {
      const buildValue = build();
      if (!state.tiers.length) {
        const best = bestPlan(window.GBLE, buildValue, { slots: state.slots, plusTwo: state.plusTwo, flexSet: state.flexSet, caps: state.caps });
        state.tiers = best.tiers;
        state.fuseSlots = best.fuseSlots;
      }
    }
    state.mode = next;
    render();
  }

  function resizeSlots() {
    const next = new Array(state.slots).fill(null);
    for (let index = 0; index < Math.min(next.length, state.fuseSlots.length); index += 1) next[index] = state.fuseSlots[index];
    state.fuseSlots = next;
  }

  function renderBudgets(summaryValue) {
    const table = node('table', 'tbl fuse-budget');
    const headRow = node('tr');
    for (const text of ['Group', 'Pool', 'Flex', 'Budget', 'Spent', 'Status']) headRow.append(node('th', null, text));
    const thead = node('thead');
    thead.append(headRow);
    const tbody = node('tbody');
    GROUPS.forEach((group, index) => {
      const row = node('tr');
      const pool = summaryValue.pools[index] - (Number(state.flexSet[index]) || 0);
      const flex = Number(state.flexSet[index]) || 0;
      const spent = summaryValue.spent[index] ?? 0;
      const status = spent > summaryValue.pools[index] ? 'over' : spent === summaryValue.pools[index] ? 'full' : 'ok';
      row.append(
        node('td', null, group),
        node('td', null, String(pool)),
        node('td', null, String(flex)),
        node('td', null, String(summaryValue.pools[index])),
        node('td', null, String(spent)),
        node('td', `fuse-${status}`, status),
      );
      tbody.append(row);
    });
    table.append(thead, tbody);
    const wrap = node('div', 'tbl-wrap');
    wrap.append(table);
    budgetsHost.replaceChildren(wrap);
  }

  function renderSlots(summaryValue) {
    const table = node('table', 'tbl fuse-slot-table');
    const headRow = node('tr');
    for (const text of ['Slot', 'Fuse badge', 'Reaction', 'Result', 'Gain', 'Tokens']) headRow.append(node('th', null, text));
    const thead = node('thead');
    thead.append(headRow);
    const tbody = node('tbody');
    const equipped = summaryValue.equipped;
    for (let index = 0; index < state.slots; index += 1) {
      const slot = summaryValue.slots[index] ?? state.fuseSlots[index] ?? null;
      const row = node('tr');
      const slotLabel = node('td', null, `${index + 1}${index < state.plusTwo ? ' +2' : ' +1'}`);
      const badgeSelect = document.createElement('select');
      badgeSelect.className = 'sel';
      badgeSelect.setAttribute('aria-label', `Fuse badge for slot ${index + 1}`);
      badgeSelect.append(option('', 'None', !slot));
      const used = new Set(state.fuseSlots.filter(Boolean).map(item => item.i));
      for (const badge of equipped) {
        if (used.has(badge.i) && badge.i !== slot?.i) continue;
        badgeSelect.append(option(badge.i, `${badge.name} (${tierName(window.GBLE, badge.tier)})`, badge.i === slot?.i));
      }
      badgeSelect.addEventListener('change', () => {
        state.mode = 'mine';
        const value = badgeSelect.value === '' ? null : Number(badgeSelect.value);
        state.fuseSlots[index] = value == null ? null : { i: value, react: null };
        render();
      });
      const reactSelect = document.createElement('select');
      reactSelect.className = 'sel';
      reactSelect.setAttribute('aria-label', `Reaction badge for slot ${index + 1}`);
      reactSelect.append(option('', 'None', !slot?.react));
      if (slot) {
        for (const partner of window.GBLE.fusePairs(slot.i)) {
          if (!equipped.some(badge => badge.i === partner)) continue;
          reactSelect.append(option(partner, window.GBLE.BADGES[partner][0], partner === slot.react));
        }
      }
      reactSelect.addEventListener('change', () => {
        state.mode = 'mine';
        if (!state.fuseSlots[index]) return;
        state.fuseSlots[index] = { ...state.fuseSlots[index], react: reactSelect.value === '' ? null : Number(reactSelect.value) };
        render();
      });
      const result = node('td', null, slot ? `${slot.name} ${tierName(window.GBLE, slot.tier)} → ${tierName(window.GBLE, slot.result)}` : '—');
      const gain = node('td', null, slot ? String(Math.round(slot.gain * 10) / 10) : '—');
      const tokens = node('td', null, slot ? '0' : '—');
      const badgeCell = node('td');
      badgeCell.append(badgeSelect);
      const reactCell = node('td');
      reactCell.append(reactSelect);
      row.append(slotLabel, badgeCell, reactCell, result, gain, tokens);
      tbody.append(row);
    }
    table.append(thead, tbody);
    const wrap = node('div', 'tbl-wrap');
    wrap.append(table);
    slotsHost.replaceChildren(wrap);
  }

  function renderPins(summaryValue) {
    const max = maxTiers(window.GBLE, build());
    const grid = node('div', 'fuse-pin-grid');
    const seen = new Set();
    for (const badge of summaryValue.equipped) {
      seen.add(badge.i);
      const select = document.createElement('select');
      select.className = 'sel';
      select.setAttribute('aria-label', `${badge.name} tier pin`);
      for (let tier = 0; tier <= max[badge.i]; tier += 1) select.append(option(tier, tierName(window.GBLE, tier), tier === badge.tier));
      select.addEventListener('change', () => {
        state.mode = 'mine';
        state.tiers[badge.i] = Number(select.value);
        render();
      });
      const row = node('label', 'fuse-pin');
      row.append(node('span', null, badge.name), select);
      grid.append(row);
    }
    for (let index = 0; index < window.GBLE.BADGES.length; index += 1) {
      if (seen.has(index) || max[index] <= 0) continue;
      const select = document.createElement('select');
      select.className = 'sel';
      select.setAttribute('aria-label', `${window.GBLE.BADGES[index][0]} tier pin`);
      for (let tier = 0; tier <= max[index]; tier += 1) select.append(option(tier, tierName(window.GBLE, tier), tier === (state.tiers[index] ?? 0)));
      select.addEventListener('change', () => {
        state.mode = 'mine';
        state.tiers[index] = Number(select.value);
        render();
      });
      const row = node('label', 'fuse-pin');
      row.append(node('span', null, window.GBLE.BADGES[index][0]), select);
      grid.append(row);
    }
    pinHost.replaceChildren(grid);
  }

  function renderFlex() {
    const grid = node('div', 'fuse-flex-grid');
    GROUPS.forEach((group, index) => {
      const input = document.createElement('input');
      input.className = 'inp num';
      input.type = 'number';
      input.min = '0';
      input.max = '99';
      input.value = String(state.flexSet[index] ?? 0);
      input.setAttribute('aria-label', `${group} flex tokens`);
      input.addEventListener('change', () => {
        state.flexSet[index] = Math.max(0, Math.min(99, Number(input.value) || 0));
        render();
      });
      const cap = document.createElement('input');
      cap.className = 'inp num';
      cap.type = 'number';
      cap.min = '0';
      cap.max = '9';
      cap.value = String(state.caps[index] ?? 3);
      cap.setAttribute('aria-label', `${group} group cap`);
      cap.addEventListener('change', () => {
        state.caps[index] = Math.max(0, Math.min(9, Number(cap.value) || 0));
        render();
      });
      const row = node('label', 'fuse-flex-row');
      row.append(node('span', null, group), input, cap);
      grid.append(row);
    });
    const hint = node('p', 'muted', 'Flex adds tokens to a group. Group caps limit how many badges the plan keeps in that group.');
    flexHost.replaceChildren(grid, hint);
  }

  function renderPairs(buildValue) {
    const { pairs } = fuseCandidates(window.GBLE, buildValue, 6);
    if (!pairs.length) {
      pairsHost.replaceChildren(node('p', 'muted', 'No compatible fuse pair is equipped. Raise two compatible badges to their first tier first.'));
      return;
    }
    const table = node('table', 'tbl fuse-pairs');
    const headRow = node('tr');
    for (const text of ['Badge A', 'Tier', 'Badge B', 'Tier', 'Current cost']) headRow.append(node('th', null, text));
    const thead = node('thead');
    thead.append(headRow);
    const tbody = node('tbody');
    for (const pair of pairs) {
      const row = node('tr');
      row.append(
        node('td', null, window.GBLE.BADGES[pair.a][0]),
        node('td', null, tierName(window.GBLE, pair.aTier)),
        node('td', null, window.GBLE.BADGES[pair.b][0]),
        node('td', null, tierName(window.GBLE, pair.bTier)),
        node('td', null, String(pair.cost)),
      );
      tbody.append(row);
    }
    table.append(thead, tbody);
    const wrap = node('div', 'tbl-wrap');
    wrap.append(table);
    pairsHost.replaceChildren(node('h3', null, 'Compatible pairs'), wrap);
  }

  let rendering = false;

  function render() {
    if (rendering) return;
    rendering = true;
    try {
      renderNow();
    } finally {
      rendering = false;
    }
  }

  function renderNow() {
    const buildValue = build();
    const signature = signatureOf(buildValue);
    if (signature !== state.signature) {
      state.signature = signature;
      if (state.mode === 'best' || !state.tiers.length) {
        const best = bestPlan(window.GBLE, buildValue, { slots: state.slots, plusTwo: state.plusTwo, flexSet: state.flexSet, caps: state.caps });
        state.tiers = best.tiers;
        state.fuseSlots = best.fuseSlots;
      }
    }
    bestButton.classList.toggle('primary', state.mode === 'best');
    mineButton.classList.toggle('primary', state.mode === 'mine');
    bestButton.setAttribute('aria-pressed', String(state.mode === 'best'));
    mineButton.setAttribute('aria-pressed', String(state.mode === 'mine'));
    slotsSelect.value = String(state.slots);
    plusSelect.value = String(state.plusTwo);
    useBest.disabled = state.mode !== 'best';
    const summaryValue = currentPlan(buildValue);
    const over = summaryValue.over.filter(Boolean).length;
    summary.textContent = `${summaryValue.totalTiers} planned tiers · ${summaryValue.slots.filter(Boolean).length} fuse slot${summaryValue.slots.filter(Boolean).length === 1 ? '' : 's'} · ${summaryValue.totalSpent} / ${summaryValue.totalBudget} tokens${over ? ` · ${over} group${over === 1 ? '' : 's'} over` : ''}`;
    summary.className = over ? 'fuse-summary warn' : 'fuse-summary';
    renderBudgets(summaryValue);
    renderSlots(summaryValue);
    renderPins(summaryValue);
    renderFlex();
    renderPairs(buildValue);
  }

  bestButton.addEventListener('click', () => setMode('best'));
  mineButton.addEventListener('click', () => setMode('mine'));
  slotsSelect.addEventListener('change', () => {
    state.slots = Number(slotsSelect.value);
    state.plusTwo = Math.min(state.plusTwo, state.slots);
    resizeSlots();
    render();
  });
  plusSelect.addEventListener('change', () => {
    state.plusTwo = Math.min(state.slots, Number(plusSelect.value));
    render();
  });
  reset.addEventListener('click', () => {
    state.mode = 'mine';
    state.tiers = earnedTiers(window.GBLE, build());
    state.fuseSlots = new Array(state.slots).fill(null);
    render();
  });
  useBest.addEventListener('click', () => {
    const buildValue = build();
    const best = bestPlan(window.GBLE, buildValue, { slots: state.slots, plusTwo: state.plusTwo, flexSet: state.flexSet, caps: state.caps });
    state.tiers = best.tiers;
    state.fuseSlots = best.fuseSlots;
    state.mode = 'mine';
    render();
  });

  render();
  let renderTimer = 0;
  const scheduleRender = () => {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => {
      if (document.documentElement.dataset.fbDragging === '1') {
        scheduleRender();
        return;
      }
      render();
    }, 220);
  };
  const overall = document.querySelector('.overall');
  if (overall) new MutationObserver(scheduleRender).observe(overall, { childList: true, subtree: true, characterData: true });
  return { render };
}
