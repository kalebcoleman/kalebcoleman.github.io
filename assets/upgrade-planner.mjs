import {
  autoGoals,
  buyTarget,
  capFor,
  changes,
  overallOf,
  planGoals,
} from './upgrade-planner-engine.mjs';

const G = window.GBLE;
const root = document.getElementById('planner');
const STORAGE = 'fb_upgrade_planner_v1';
const DEFAULT_BODY = { p: 1, h: 78, w: 232, s: 82 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const integer = value => Number.isInteger(value);
const format = value => Math.round(Number(value) || 0).toLocaleString('en-US');
const heightText = inches => `${Math.floor(inches / 12)}'${inches % 12}"`;

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'html') node.innerHTML = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === undefined || child === null || child === false) continue;
    node.append(child?.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

if (!G || typeof G.upStart !== 'function' || typeof G.upNeed !== 'function') {
  root.replaceChildren(h('section', { class: 'panel' }, h('h2', {}, 'Upgrade Planner is unavailable'), h('p', { class: 'muted' }, 'The build engine could not load its VC ladder. Reload this page and try again.')));
  throw new Error('The build engine did not initialize.');
}

const bodyData = await fetch('/data/body.json', { cache: 'force-cache' }).then(response => {
  if (!response.ok) throw new Error(`body data: ${response.status}`);
  return response.json();
});
const bands = bodyData.gate.pos;

function bandFor(position, height) {
  return bands.find(band => band.p === position && band.h === height) ?? null;
}

function nearestBand(position, height) {
  const legal = bands.filter(band => band.p === position);
  return legal.reduce((best, band) => !best || Math.abs(band.h - height) < Math.abs(best.h - height) ? band : best, null);
}

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
    if (!saved || !integer(saved.p) || saved.p < 0 || saved.p > 4 || !integer(saved.h)) return null;
    const band = bandFor(saved.p, saved.h);
    if (!band) return null;
    return saved;
  } catch {
    return null;
  }
}

function readUrlBuild() {
  const params = new URLSearchParams(location.search);
  if (!params.has('p') || !params.has('h')) return null;
  const p = Number(params.get('p'));
  const h = Number(params.get('h'));
  const band = bandFor(p, h);
  if (!band) return null;
  const alloc = params.get('v')?.split('.').map(Number);
  return {
    p,
    h,
    w: Number(params.get('w')) || band.wmin,
    s: Number(params.get('s')) || h,
    alloc: Array.isArray(alloc) && alloc.length === 21 && alloc.every(integer) ? alloc : null,
    cap: Number(params.get('cap')) || 85,
    vc: Number(params.get('vc')) || 0,
  };
}

function seed() {
  const fromUrl = readUrlBuild();
  const saved = fromUrl ? null : readSaved();
  const source = fromUrl ?? saved ?? DEFAULT_BODY;
  const band = bandFor(source.p, source.h) ?? nearestBand(source.p, source.h) ?? nearestBand(1, 78);
  const p = band.p;
  const h = band.h;
  const w = clamp(Math.round(Number(source.w) || band.wmin), band.wmin, band.wmax);
  const s = clamp(Math.round(Number(source.s) || h), h, h + 6);
  const caps = G.ceilingsFor(h, w, s);
  const hb = h - 63;
  const start = G.upStart(caps, hb).map((value, index) => clamp(Math.round(value), 25, caps[index]));
  const alloc = Array.isArray(source.alloc) && source.alloc.length === 21
    ? source.alloc.map((value, index) => clamp(Math.round(Number(value) || 25), 25, caps[index]))
    : start;
  return {
    p, h, w, s,
    alloc,
    cap: clamp(Math.round(Number(source.cap) || 85), 85, 99),
    vc: Math.max(0, Math.round(Number(source.vc) || 0)),
    goals: Array.isArray(source.goals) ? source.goals.filter(goal => goal && integer(goal.b) && goal.b >= 0 && goal.b < G.BADGES.length && integer(goal.t) && goal.t >= 1 && goal.t <= 4) : [],
    auto: source.auto !== false,
    tab: source.tab === 'plan' ? 'plan' : 'rates',
  };
}

const state = seed();
let caps = G.ceilingsFor(state.h, state.w, state.s);
const bodyLine = () => h('p', { class: 'muted' }, `${G.POSN[state.p]} · ${heightText(state.h)} · ${state.w} lb · ${heightText(state.s)} wingspan`);

function save() {
  try {
    localStorage.setItem(STORAGE, JSON.stringify({
      p: state.p, h: state.h, w: state.w, s: state.s,
      alloc: state.alloc, cap: state.cap, vc: state.vc,
      goals: state.goals, auto: state.auto, tab: state.tab,
    }));
  } catch {
    // Storage is optional; the planner still works without it.
  }
}

function recomputeCaps(reset = false) {
  caps = G.ceilingsFor(state.h, state.w, state.s);
  if (!Array.isArray(caps) || caps.length !== 21) {
    caps = Array(21).fill(99);
  }
  if (reset) {
    state.alloc = G.upStart(caps, state.h - 63).map((value, index) => clamp(Math.round(value), 25, caps[index]));
  } else {
    state.alloc = state.alloc.map((value, index) => clamp(Math.round(value), 25, caps[index]));
  }
  const hb = state.h - 63;
  state.goals = state.goals
    .map(goal => ({ ...goal, t: Math.min(goal.t, G.tierMetAt(goal.b, caps, hb)) }))
    .filter(goal => goal.t > 0);
}

function changeBody(next) {
  const p = next.p ?? state.p;
  let band = bandFor(p, next.h ?? state.h) ?? nearestBand(p, next.h ?? state.h) ?? nearestBand(p, 78);
  const h = band.h;
  const w = clamp(Math.round(next.w ?? state.w), band.wmin, band.wmax);
  const s = clamp(Math.round(next.s ?? state.s), h, h + 6);
  state.p = p;
  state.h = h;
  state.w = w;
  state.s = s;
  recomputeCaps(true);
  renderAll();
  save();
}

function setAlloc(index, value) {
  const rating = clamp(Math.round(Number(value) || 25), 25, caps[index]);
  state.alloc[index] = rating;
  renderSummary();
  save();
  return rating;
}

function renderBodyControls() {
  const band = bandFor(state.p, state.h) ?? nearestBand(state.p, state.h);
  return h('div', { class: 'up-body-row' },
    h('div', { class: 'fieldset' },
      h('label', { class: 'lbl' }, 'Position',
        h('select', { class: 'sel', id: 'upPos', 'aria-label': 'Position', onchange: event => changeBody({ p: Number(event.target.value) }) },
          G.POSN.map((name, index) => h('option', { value: index, selected: index === state.p }, name))))),
    h('div', { class: 'fieldset' },
      h('label', { class: 'lbl' }, 'Height',
        h('select', { class: 'sel', id: 'upHeight', 'aria-label': 'Height', onchange: event => changeBody({ h: Number(event.target.value) }) },
          bands.filter(item => item.p === state.p).map(item => h('option', { value: item.h, selected: item.h === state.h }, `${heightText(item.h)} (${item.wmin}–${item.wmax} lb)`))))),
    h('div', { class: 'fieldset' },
      h('label', { class: 'lbl' }, 'Weight',
        h('input', { class: 'inp', id: 'upWeight', type: 'number', min: band?.wmin ?? 145, max: band?.wmax ?? 300, value: state.w, 'aria-label': 'Weight', onchange: event => changeBody({ w: Number(event.target.value) }) }))),
    h('div', { class: 'fieldset' },
      h('label', { class: 'lbl' }, 'Wingspan',
        h('input', { class: 'inp', id: 'upSpan', type: 'number', min: state.h, max: state.h + 6, value: state.s, 'aria-label': 'Wingspan', onchange: event => changeBody({ s: Number(event.target.value) }) }))));
}

function renderAll() {
  const left = h('section', { class: 'up-card', 'aria-label': 'What your VC buys' },
    h('h2', {}, 'What your VC buys'),
    bodyLine(),
    renderBodyControls(),
    h('div', { class: 'up-ovr-wrap' },
      h('div', { class: 'up-ovr' }, h('span', {}, 'Overall'), h('b', { id: 'upOvrNow' }, '--')),
      h('div', { class: 'up-meta' },
        h('span', {}, 'Overall now ', h('b', { id: 'upOvrRaw' }, '')),
        h('span', {}, 'Build max ', h('b', { id: 'upMax' }, '--')))),
    h('div', { class: 'up-cap' },
      h('span', {}, 'Overall cap'),
      h('span', { class: 'up-cap-control' },
        h('button', { type: 'button', id: 'upCapDn', 'aria-label': 'Lower the cap', onclick: () => { state.cap = Math.max(85, state.cap - 1); renderSummary(); save(); } }, '−'),
        h('b', { id: 'upCapValue' }, state.cap),
        h('button', { type: 'button', id: 'upCapUp', 'aria-label': 'Raise the cap', onclick: () => { state.cap = Math.min(99, state.cap + 1); renderSummary(); save(); } }, '+'))),
    h('p', { class: 'up-note' }, '85, then one more for each MyPOINTS step, up to 99.'),
    h('div', { id: 'upCosts' }),
    h('label', { class: 'lbl', for: 'upVc' }, 'VC you have'),
    h('input', { class: 'inp', id: 'upVc', type: 'number', min: 0, step: 1000, value: state.vc || '', placeholder: '0', inputmode: 'numeric', oninput: event => { state.vc = Math.max(0, Math.round(Number(event.target.value) || 0)); renderSummary(); save(); } }),
    h('p', { class: 'up-vc-out', id: 'upVcOut' }),
    h('div', { class: 'up-actions' },
      h('a', { class: 'btn', href: `/builder?p=${state.p}&h=${state.h}&w=${state.w}&s=${state.s}&v=${state.alloc.join('.')}` }, 'Change the build'),
      h('button', { class: 'btn', type: 'button', onclick: () => { state.alloc = G.upStart(caps, state.h - 63).map((value, index) => clamp(Math.round(value), 25, caps[index])); state.goals = []; renderAll(); save(); } }, 'Reset to a new player')),
    h('p', { class: 'up-note' }, '4,000 VC per point of Overall below 70, 10,000 from 70 to 85, 13,214 above 85.'));

  const right = h('section', { class: 'up-card', 'aria-label': 'Ratings and plan' },
    h('div', { class: 'up-tabs', role: 'group', 'aria-label': 'Show' },
      h('button', { type: 'button', 'aria-pressed': state.tab === 'rates', onclick: () => { state.tab = 'rates'; renderAll(); save(); } }, 'Ratings'),
      h('button', { type: 'button', 'aria-pressed': state.tab === 'plan', onclick: () => { state.tab = 'plan'; renderAll(); save(); } }, 'Plan')),
    h('div', { id: 'upRatings', hidden: state.tab !== 'rates' }),
    h('div', { id: 'upPlanView', hidden: state.tab !== 'plan' }));

  root.replaceChildren(h('div', { class: 'up-layout' }, left, right));
  renderRatings();
  renderSummary();
}

function renderRatings() {
  const host = root.querySelector('#upRatings');
  if (!host) return;
  host.replaceChildren(...G.GROUPS.map(([name, start, end]) => h('div', { class: 'up-group' },
    h('h4', {}, name),
    Array.from({ length: end - start }, (_value, offset) => {
      const index = start + offset;
      return h('label', { class: 'up-attr' },
        h('span', {}, G.ATTRS[index]),
        h('input', { type: 'number', min: 25, max: caps[index], value: state.alloc[index], 'aria-label': `${G.ATTRS[index]} now`, dataset: { i: index }, oninput: event => { event.target.value = setAlloc(index, event.target.value); } }),
        h('small', {}, `/ ${caps[index]}`));
    }))));
}

function renderSummary() {
  const hb = state.h - 63;
  const now = overallOf(G, state.alloc, hb, caps);
  const maxOverall = Math.min(99, G.upR(caps, hb, caps));
  const capAtMax = capFor(G, caps, hb, caps);
  const buy = buyTarget(G, state.alloc, state.vc, state.cap, hb, caps);
  const capTarget = Math.min(state.cap, maxOverall);
  const toCap = Math.max(0, G.upF(capTarget) - G.upF(now));
  const toMax = Math.max(0, G.upF(maxOverall) - G.upF(now));
  const set = (selector, value) => { const node = root.querySelector(selector); if (node) node.textContent = value; };
  set('#upOvrNow', String(Math.floor(now)));
  set('#upOvrRaw', now.toFixed(2));
  set('#upMax', String(Math.floor(maxOverall)));
  set('#upCapValue', String(state.cap));
  const down = root.querySelector('#upCapDn');
  const up = root.querySelector('#upCapUp');
  if (down) down.disabled = state.cap <= 85;
  if (up) up.disabled = state.cap >= 99;
  const costs = root.querySelector('#upCosts');
  if (costs) {
    costs.replaceChildren(
      h('div', { class: 'up-meta' },
        h('span', {}, `Up to the ${state.cap} cap `, h('b', {}, now < state.cap ? `${format(toCap)} VC` : 'reached')),
        h('span', {}, `Everything maxed (${Math.floor(maxOverall)}) `, h('b', {}, `${format(toMax)} VC`), capAtMax > state.cap ? h('small', { class: 'up-note' }, ` · needs the cap at ${capAtMax}`) : null)),
    );
  }
  const out = root.querySelector('#upVcOut');
  if (out) {
    if (state.vc > 0 && buy.gain > 0) {
      out.replaceChildren('buys ', h('b', {}, `+${buy.gain.toFixed(2)} Overall`), ', to ', h('b', {}, buy.target.toFixed(2)), buy.target >= Math.min(state.cap, maxOverall) ? ' (the cap)' : '');
    } else if (state.vc > 0) {
      out.textContent = 'nothing fits under the cap';
    } else {
      out.textContent = 'Type the VC you have to see what it buys.';
    }
  }
  renderPlanView();
}

function badgeName(badge) {
  return G.BADGES[badge]?.[0] ?? `Badge ${badge + 1}`;
}

function tierName(tier) {
  return G.TIERNAME[tier] ?? `Tier ${tier}`;
}

function planForState() {
  const hb = state.h - 63;
  return state.auto
    ? autoGoals(G, state.alloc, { position: state.p, hb, caps, cap: state.cap })
    : planGoals(G, state.goals, state.alloc, { hb, caps, cap: state.cap });
}

function renderPlanView() {
  const host = root.querySelector('#upPlanView');
  if (!host) return;
  const hb = state.h - 63;
  const plan = planForState();
  const maxOverall = Math.min(99, G.upR(caps, hb, caps));
  const endCost = G.upF(overallOf(G, plan.end, hb, caps));
  const rest = Math.max(0, G.upF(maxOverall) - endCost);
  const cut = state.vc > 0 ? plan.steps.findIndex(step => step.tot > state.vc) : -1;
  const stepNodes = [];
  plan.steps.forEach((step, index) => {
    if (index === cut) stepNodes.push(h('div', { class: 'up-cut' }, `Your ${format(state.vc)} VC gets you this far`));
    const changed = changes(step.from, step.to).map(({ index: attribute, from, to }) => `${G.ATTRS[attribute]} ${from} → ${to}`);
    stepNodes.push(h('li', { class: `up-step${cut >= 0 && index >= cut ? ' dim' : ''}` },
      h('span', { class: 'up-step-n' }, String(index + 1)),
      h('div', {},
        h('b', {}, `${badgeName(step.g.b)} ${tierName(step.g.t)}`),
        h('small', {}, changed.length ? changed.join(', ') : 'nothing to buy')),
      h('span', { class: 'up-step-vc' }, `${format(step.vc)} VC`, h('small', {}, `${format(step.tot)} total · Overall ${Math.floor(step.r)}`))));
  });
  if (state.vc > 0 && cut < 0 && plan.steps.length) {
    stepNodes.push(h('p', { class: 'up-wait' }, `Your ${format(state.vc)} VC covers all of it.`));
  }
  const waitNodes = plan.wait.map(item => h('p', { class: 'up-wait' },
    h('b', {}, `${badgeName(item.g.b)} ${tierName(item.g.t)}`),
    ` needs the cap at ${item.cap}`,
    item.cap > state.cap ? ` (${item.cap - state.cap} MyPOINTS step${item.cap - state.cap === 1 ? '' : 's'})` : ''));
  const haveNodes = plan.have.map(goal => h('p', { class: 'up-wait' }, `${badgeName(goal.b)} ${tierName(goal.t)}: you have it already`));
  const mode = h('div', { class: 'up-tabs', role: 'group', 'aria-label': 'How to plan' },
    h('button', { type: 'button', 'aria-pressed': !state.auto, onclick: () => { state.auto = false; renderAll(); save(); } }, 'Pick my badges'),
    h('button', { type: 'button', 'aria-pressed': state.auto, onclick: () => { state.auto = true; renderAll(); save(); } }, 'Plan it for me'));
  const manual = state.auto ? null : renderGoalPicker();
  const note = state.auto
    ? h('p', { class: 'up-note' }, 'Every badge this build can reach at Silver or better, the ones its position and height need most for the least VC first.')
    : h('p', { class: 'up-note' }, 'Tap the ones you want first. The plan puts them in the order that gets the most of them soonest.');
  const empty = !plan.steps.length && !plan.wait.length && !plan.have.length
    ? h('p', { class: 'up-empty' }, 'This build reaches no new badge at Silver or better.')
    : null;
  host.replaceChildren(...[
    mode,
    note,
    manual,
    plan.steps.length ? h('ol', { class: 'up-plan' }, stepNodes) : null,
    empty,
    plan.steps.length || plan.wait.length || plan.have.length ? h('div', { class: 'up-wait' }, waitNodes, haveNodes,
      h('p', {}, 'Then everything else to the max: ', h('b', {}, `${format(rest)} VC`))) : null,
  ].filter(Boolean));
}

function renderGoalPicker() {
  const maxTierFor = badge => G.tierMetAt(badge, caps, state.h - 63);
  const badgeOptions = G.BADGES
    .map((badge, index) => ({ badge, index }))
    .filter(({ index }) => maxTierFor(index) > 0)
    .map(({ badge, index }) => h('option', { value: index }, badge[0]));
  const badgeSelect = h('select', { class: 'sel', 'aria-label': 'Badge' }, badgeOptions);
  const tierSelect = h('select', { class: 'sel', 'aria-label': 'Tier' });
  const refreshTiers = () => {
    const max = Math.max(1, maxTierFor(Number(badgeSelect.value)));
    const current = Number(tierSelect.value) || 1;
    tierSelect.replaceChildren(...Array.from({ length: max }, (_value, offset) => h('option', { value: offset + 1, selected: offset + 1 === current }, tierName(offset + 1))));
  };
  badgeSelect.addEventListener('change', refreshTiers);
  refreshTiers();
  const add = () => {
    const goal = { b: Number(badgeSelect.value), t: Number(tierSelect.value) };
    if (!state.goals.some(item => item.b === goal.b && item.t === goal.t)) state.goals.push(goal);
    renderAll();
    save();
  };
  const goals = state.goals.map((goal, index) => {
    const max = Math.max(1, maxTierFor(goal.b));
    const select = h('select', { 'aria-label': `${badgeName(goal.b)} tier`, onchange: event => { state.goals[index].t = Number(event.target.value); renderAll(); save(); } },
      Array.from({ length: max }, (_value, offset) => h('option', { value: offset + 1, selected: offset + 1 === goal.t }, tierName(offset + 1))));
    return h('span', { class: 'up-chip' }, h('span', { class: 'up-badge' }, String(goal.b + 1)), badgeName(goal.b), select,
      h('button', { type: 'button', 'aria-label': `Remove ${badgeName(goal.b)}`, onclick: () => { state.goals.splice(index, 1); renderAll(); save(); } }, '×'));
  });
  return h('div', {},
    h('h3', {}, 'Badges you want'),
    h('div', { class: 'up-form' },
      badgeSelect,
      tierSelect,
      h('button', { class: 'btn', type: 'button', onclick: add }, 'Add')),
    goals.length ? h('div', { class: 'up-goals' }, goals) : h('p', { class: 'up-empty' }, 'No badge goals picked yet. The plan will be empty until you add one.'));
}

renderAll();
