import { n as loadKernel } from './kernel-BWpHXNaH.js';
import { t as bridge } from './bridge-D0YB3AWd.js';
import { buildLink, findReferenceBuilds } from './reference-finder.mjs';

const ATTRIBUTES = [
  'Close Shot', 'Driving Layup', 'Driving Dunk', 'Standing Dunk', 'Post Control',
  'Mid-Range', 'Three-Point', 'Free Throw', 'Pass Accuracy', 'Ball Handle',
  'Speed w/ Ball', 'Interior D', 'Perimeter D', 'Steal', 'Block',
  'Off Rebound', 'Def Rebound', 'Speed', 'Agility', 'Strength', 'Vertical',
];
const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const TIER_FALLBACK = ['Bronze', 'Silver', 'Gold', 'HOF'];
const PRESETS = [
  { id: 'wing', name: 'Slashing 3-and-D wing', position: 2, summary: 'Driving Dunk 5 · Shooting 4 · Perimeter D 3', targets: { 2: 90, 5: 85, 6: 85, 12: 78 }, levels: { 'Driving Dunk': 5, Shooting: 4, 'Perimeter D': 3 } },
  { id: 'floor', name: 'Floor general', position: 0, summary: 'Ball Handling 5 · Passing 5 · Shooting 3', targets: { 8: 90, 9: 90, 5: 75, 6: 78 }, levels: { Shooting: 3, Passing: 5, 'Ball Handling': 5 } },
  { id: 'stretch', name: 'Stretch five', position: 4, summary: 'Shooting 4 · Interior D 3 · Rebounding 3', targets: { 5: 85, 6: 85, 11: 78, 15: 78, 16: 78 }, levels: { Shooting: 4, 'Interior D': 3, Rebounding: 3 } },
  { id: 'post', name: 'Post scorer', position: 3, summary: 'Post 5 · Close Shot 3 · Strength 3 · Rebounding 3', targets: { 4: 90, 0: 78, 19: 78, 15: 78, 16: 78 }, levels: { Post: 5, 'Close Shot': 3, Strength: 3, Rebounding: 3 } },
  { id: 'lockdown', name: 'Lockdown guard', position: 1, summary: 'Perimeter D 5 · Shooting 3 · Athleticism 3', targets: { 12: 90, 5: 78, 6: 78, 17: 78, 18: 78, 20: 78 }, levels: { 'Perimeter D': 5, Shooting: 3, Athleticism: 3 } },
  { id: 'rim', name: 'Rim runner', position: 4, summary: 'Standing Dunk 5 · Interior D 4 · Rebounding 3', targets: { 3: 90, 11: 85, 15: 78, 16: 78 }, levels: { 'Standing Dunk': 5, 'Interior D': 4, Rebounding: 3 } },
];

function el(tag, textOrAttrs, classNameOrChildren, children = []) {
  const node = document.createElement(tag);
  if (textOrAttrs && typeof textOrAttrs === 'object') {
    for (const [key, value] of Object.entries(textOrAttrs)) {
      if (key === 'text') node.textContent = value;
      else if (key === 'class') node.className = value;
      else if (key === 'dataset') Object.assign(node.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, String(value));
    }
    const kids = Array.isArray(classNameOrChildren) ? classNameOrChildren : [];
    node.append(...kids);
    return node;
  }
  if (textOrAttrs != null) node.textContent = textOrAttrs;
  if (typeof classNameOrChildren === 'string') node.className = classNameOrChildren;
  const kids = Array.isArray(classNameOrChildren) ? classNameOrChildren : children;
  node.append(...kids);
  return node;
}

function feetInches(inches) {
  const value = Number(inches);
  if (!Number.isFinite(value)) return '—';
  return `${Math.floor(value / 12)}'${value % 12}"`;
}

function badgeTier(badge, alloc) {
  for (let tier = 4; tier >= 1; tier -= 1) {
    const requirements = badge?.[1]?.[tier - 1];
    if (!Array.isArray(requirements) || !requirements.length) continue;
    const met = badge[2]
      ? requirements.some(([attribute, rating]) => (alloc[attribute] ?? 0) >= rating)
      : requirements.every(([attribute, rating]) => (alloc[attribute] ?? 0) >= rating);
    if (met) return tier;
  }
  return 0;
}

let descNamePromise = null;

function ensureDescName() {
  if (typeof window !== 'undefined' && window.DescName?.describe) return Promise.resolve(window.DescName);
  if (descNamePromise) return descNamePromise;
  descNamePromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/assets/lab-engine.js';
    script.onload = () => window.DescName?.describe ? resolve(window.DescName) : reject(new Error('DescName did not initialise'));
    script.onerror = () => reject(new Error('the recovered name table could not load'));
    document.head.append(script);
  });
  return descNamePromise;
}

async function init() {
  const root = document.querySelector('#finder-page');
  if (!root) return;
  const kernel = await loadKernel();
  let descName = null;
  try { descName = await ensureDescName(); } catch { /* the local bridge name remains available */ }
  const tierNames = kernel.env.badges.tiers ?? TIER_FALLBACK;
  let position = 0;
  let anyPosition = true;
  let searching = false;
  let activePreset = null;
  let lastResults = [];

  const positionButtons = POSITIONS.map((name, index) => {
    const button = el('button', { class: 'btn', type: 'button', text: name, 'aria-pressed': 'false' });
    button.addEventListener('click', () => {
      anyPosition = false;
      position = index;
      for (const [i, candidate] of positionButtons.entries()) candidate.setAttribute('aria-pressed', String(i === index));
      anyButton.setAttribute('aria-pressed', 'false');
    });
    return button;
  });
  const anyButton = el('button', { class: 'btn', type: 'button', text: 'Any', 'aria-pressed': 'true' });
  anyButton.addEventListener('click', () => {
    anyPosition = true;
    anyButton.setAttribute('aria-pressed', 'true');
    for (const button of positionButtons) button.setAttribute('aria-pressed', 'false');
  });

  const height = el('select', null, 'sel');
  height.setAttribute('aria-label', 'Height');
  const anyHeight = el('option', 'Any height');
  anyHeight.value = '';
  height.append(anyHeight);
  for (let inches = 69; inches <= 88; inches += 1) {
    const option = el('option', feetInches(inches));
    option.value = String(inches);
    height.append(option);
  }

  const caps = el('select', null, 'sel');
  caps.setAttribute('aria-label', 'Cap breakers');
  const autoCaps = el('option', 'Auto: have the finder tell me');
  autoCaps.value = 'auto';
  caps.append(autoCaps);
  for (let value = 0; value <= 26; value += 1) {
    const option = el('option', `${value} cap breaker${value === 1 ? '' : 's'}`);
    option.value = String(value);
    caps.append(option);
  }
  caps.value = 'auto';

  const targets = ATTRIBUTES.map((name, index) => {
    const input = el('input', { class: 'inp num', type: 'number', min: 0, max: 99, value: 0, 'aria-label': `${name} target` });
    return { name, index, input };
  });

  const targetGrid = el('div', { class: 'target-grid' }, targets.map(({ name, input }) => {
    input.addEventListener('input', () => { activePreset = null; });
    return el('label', { class: 'lbl' }, [name, input]);
  }));
  const advanced = el('details', { class: 'target-details' }, [
    el('summary', 'Advanced exact attributes'),
    el('p', { class: 'muted', text: 'Blank or 0 means "no target". The recovered finder treats a target as a minimum.' }),
    targetGrid,
  ]);

  const presetGrid = el('div', { class: 'preset-grid' }, PRESETS.map(preset => {
    const button = el('button', { class: 'preset-card', type: 'button' }, [
      el('strong', preset.name),
      el('span', { class: 'muted', text: preset.summary }),
    ]);
    button.addEventListener('click', () => {
      anyPosition = false;
      position = preset.position;
      activePreset = preset;
      anyButton.setAttribute('aria-pressed', 'false');
      for (const [i, candidate] of positionButtons.entries()) candidate.setAttribute('aria-pressed', String(i === preset.position));
      for (const { index, input } of targets) input.value = String(preset.targets[index] ?? 0);
      for (const card of presetGrid.children) card.classList.toggle('is-active', card === button);
    });
    return button;
  }));

  const status = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite', text: 'Pick a preset or set exact targets, then press Find builds.' });
  const results = el('div', { class: 'build-results' }, [
    el('div', { class: 'panel' }, [
      el('h2', { text: 'What you are searching for' }),
      el('p', { class: 'muted', text: 'Pick a preset or set exact targets, then press Find builds. The recovered finder treats every number as a minimum.' }),
    ]),
  ]);
  const findButton = el('button', { class: 'btn primary', type: 'button', text: 'Find builds' });
  const clearButton = el('button', { class: 'btn', type: 'button', text: 'Clear targets' });
  clearButton.addEventListener('click', () => {
    for (const { input } of targets) input.value = '0';
    activePreset = null;
    for (const card of presetGrid.children) card.classList.remove('is-active');
    status.textContent = 'Targets cleared. Pick a preset or set exact targets.';
    results.replaceChildren();
  });

  const controls = el('div', { class: 'panel finder-controls' }, [
    el('h2', { text: 'Find a build' }),
    el('p', { class: 'muted', text: 'Target the attributes you want. The recovered reference finder runs locally in this browser.' }),
    el('div', { class: 'fieldset' }, [anyButton, ...positionButtons]),
    el('div', { class: 'fieldset' }, [
      el('label', { class: 'lbl' }, ['Height', height]),
      el('label', { class: 'lbl' }, ['Cap breakers', caps]),
    ]),
    el('h3', { text: 'Presets' }),
    presetGrid,
    advanced,
    el('div', { class: 'fieldset' }, [findButton, clearButton]),
    status,
  ]);

  root.replaceChildren(el('div', { class: 'finder-layout' }, [controls, el('div', { class: 'finder-results' }, [results])]));

  async function renderResults(rows) {
    if (!rows.length) {
      results.replaceChildren(el('p', { class: 'muted', text: 'No build matched those targets. Lower a target or add cap breakers.' }));
      return;
    }
    const cards = [];
    for (const [index, row] of rows.entries()) {
      const alloc = Array.isArray(row.alloc) ? row.alloc : [];
      const ceilings = kernel.W(row.body?.[0] ?? 75, row.body?.[1] ?? 185, row.body?.[2] ?? 80);
      const reference = window.GBLE?.trueOvr ? window.GBLE.trueOvr(alloc, row.pos) : NaN;
      const trueOverall = Number.isFinite(reference) ? reference : kernel.overallApprox(alloc, ceilings);
      const ovr = Number.isFinite(trueOverall) ? Math.round(trueOverall) : '—';
      const used = Number(row.used ?? row.needs ?? 0);
      const badgeList = [];
      for (const badge of kernel.env.badges.badges) {
        const tier = badgeTier(badge, alloc);
        if (tier) badgeList.push({ name: badge[0], tier });
      }
      let name = '';
      try {
        name = descName?.describe ? descName.describe(alloc, row.pos) : '';
      } catch {
        name = '';
      }
      if (!name) {
        try {
          const named = await bridge.name({ alloc: [...alloc], pos: row.pos, order: [] });
          name = named?.res?.[0]?.name ?? '';
        } catch {
          name = '';
        }
      }
      const card = el('article', { class: 'build-card' }, [
        el('div', { class: 'build-ovr' }, [el('span', { text: 'OVERALL' }), el('strong', { text: String(ovr) })]),
        el('div', { class: 'build-main' }, [
          el('p', { class: 'muted build-kicker', text: index === 0 ? 'BEST BUILD' : `BUILD ${index + 1}` }),
          el('h3', { text: name || `Build ${index + 1}` }),
          el('p', { class: 'muted', text: `${POSITIONS[row.pos] ?? '—'} · ${feetInches(row.body?.[0])} · ${row.body?.[1] ?? '—'} lb · ${feetInches(row.body?.[2])} wingspan · ${used ? `${used} cap breaker${used === 1 ? '' : 's'}` : 'no cap breakers'}` }),
          el('p', { class: 'build-meta', text: `${Number.isFinite(trueOverall) ? `True overall ${trueOverall.toFixed(1)} · ` : ''}${Number(row.points ?? 0)} points · ${row.met ?? 0} target${row.met === 1 ? '' : 's'} met · ${badgeList.length} badge tiers` }),
          el('div', { class: 'badge-list' }, badgeList.slice(0, 10).map(badge => el('span', { class: 'badge-chip' }, [
            el('b', { text: badge.name }),
            el('span', { text: tierNames[badge.tier] ?? `Tier ${badge.tier}` }),
          ]))),
          el('div', { class: 'attr-grid' }, ATTRIBUTES.map((label, attribute) => el('div', { class: 'attr-cell' }, [
            el('span', { class: 'muted', text: label }),
            el('b', { text: String(alloc[attribute] ?? 0) }),
          ]))),
          el('p', {}, [el('a', { class: 'btn primary', href: buildLink(row), text: 'Open in builder' })]),
        ]),
      ]);
      cards.push(card);
    }
    results.replaceChildren(...cards);
  }

  async function search() {
    if (searching) return;
    searching = true;
    findButton.disabled = true;
    status.className = 'muted';
    status.textContent = 'Searching the recovered finder…';
    results.replaceChildren();
    const targetMap = {};
    for (const { name, input } of targets) {
      const value = Math.max(0, Math.min(99, Number(input.value) || 0));
      if (value > 0) targetMap[name] = value;
    }
    const raw = {
      pos: anyPosition ? 'PG' : POSITIONS[position],
      anyPos: anyPosition,
      poss: null,
      attrs: activePreset ? {} : targetMap,
      fmode: {},
      btw: {},
      land: {},
      maxv: {},
      kmax: {},
      caps: caps.value === 'auto' ? 'auto' : Number(caps.value) || 0,
      lean: false,
      hard: false,
      spez: null,
      capcat: null,
      hmin: null,
      hmax: null,
      hset: null,
      wsmin: null,
      wsmax: null,
      comm: null,
    };
    if (activePreset) raw.levels = activePreset.levels;
    try {
      const result = await findReferenceBuilds(raw, {
        onProgress: progress => {
          const pct = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;
          status.textContent = `${progress.note || 'Searching…'}${progress.total ? ` (${pct}%)` : ''}`;
        },
      });
      let rows = result.res;
      const chosenHeight = height.value === '' ? null : Number(height.value);
      if (chosenHeight !== null) rows = rows.filter(row => Number(row.body?.[0]) === chosenHeight);
      lastResults = rows;
      const ms = result.ms ? `${(result.ms / 1000).toFixed(1)} s` : 'a moment';
      status.textContent = `${rows.length} build${rows.length === 1 ? '' : 's'} found in ${ms}.`;
      await renderResults(rows);
    } catch (error) {
      status.className = 'warn';
      status.textContent = `The finder failed: ${error instanceof Error ? error.message : String(error)}`;
    } finally {
      searching = false;
      findButton.disabled = false;
    }
  }

  findButton.addEventListener('click', search);
  root.addEventListener('keydown', event => {
    if (event.key === 'Enter' && event.target?.tagName === 'INPUT') {
      event.preventDefault();
      search();
    }
  });
}

init();
