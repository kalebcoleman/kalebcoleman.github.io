import { n as loadKernel } from './kernel-BWpHXNaH.js';
import { loadBuildRules, prepareBuild } from './builder-rules.mjs';

const TABS = [
  { id: 'goats', label: 'GOAT builds', url: '/data/reference-builds/goats.json' },
  { id: 'goated', label: 'GOATED builds', url: '/data/reference-builds/goated.json' },
  { id: 'presets', label: 'Build presets', url: '/data/reference-builds/meta-builds.json' },
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
    const kids = (Array.isArray(classNameOrChildren) ? classNameOrChildren : []).filter(Boolean);
    node.append(...kids);
    return node;
  }
  if (textOrAttrs != null) node.textContent = textOrAttrs;
  if (typeof classNameOrChildren === 'string') node.className = classNameOrChildren;
  const kids = (Array.isArray(classNameOrChildren) ? classNameOrChildren : children).filter(Boolean);
  node.append(...kids);
  return node;
}

function feetInches(inches) {
  const value = Number(inches);
  if (!Number.isFinite(value)) return '—';
  return `${Math.floor(value / 12)}'${value % 12}"`;
}

function buildQuery(position, height, weight, wingspan, alloc) {
  const params = new URLSearchParams({
    p: String(position),
    h: String(height),
    w: String(weight),
    s: String(wingspan),
    v: alloc.join('.'),
  });
  return params.toString();
}

async function init() {
  const root = document.querySelector('#builds-page');
  if (!root) return;
  const [kernel, rules] = await Promise.all([loadKernel(), loadBuildRules()]);
  const cache = new Map();
  let active = 'goats';
  let position = '';

  async function load(tab) {
    if (!cache.has(tab.id)) {
      const response = await fetch(tab.url, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`${tab.label} data unavailable`);
      cache.set(tab.id, await response.json());
    }
    return cache.get(tab.id);
  }

  const tabs = el('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Build collections' });
  const tabButtons = TABS.map(tab => {
    const button = el('button', { class: 'tab', type: 'button', text: tab.label, role: 'tab', 'aria-selected': 'false' });
    button.addEventListener('click', () => { active = tab.id; render(); });
    tabs.append(button);
    return button;
  });

  const positionSelect = el('select', null, 'sel');
  positionSelect.setAttribute('aria-label', 'Filter builds by position');
  const anyPosition = el('option', 'Any position');
  anyPosition.value = '';
  positionSelect.append(anyPosition);
  for (const name of ['PG', 'SG', 'SF', 'PF', 'C']) {
    const option = el('option', name);
    option.value = name;
    positionSelect.append(option);
  }
  positionSelect.addEventListener('change', () => { position = positionSelect.value; render(); });

  const status = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite' });
  const list = el('div', { class: 'build-results' });
  const controls = el('div', { class: 'panel' }, [
    tabs,
    el('div', { class: 'fieldset' }, [el('label', { class: 'lbl' }, ['Position', positionSelect])]),
    status,
  ]);
  root.replaceChildren(controls, list);

  function cardFor(record, kind) {
    const attributes = record.attributes ?? record.decodedCode?.attributes ?? {};
    const positionIndex = record.positionIndex ?? record.decodedCode?.positionIndex ?? 0;
    const height = record.heightInches ?? record.decodedCode?.heightInches ?? record.heightRangeInches?.min ?? 75;
    const weight = record.weightLb ?? record.decodedCode?.weightLb ?? 185;
    const wingspan = record.wingspanInches ?? record.decodedCode?.wingspanInches ?? 80;
    const order = kind === 'presets'
      ? ['Close Shot', 'Driving Layup', 'Driving Dunk', 'Standing Dunk', 'Post Control', 'Mid-Range', 'Three-Point', 'Free Throw', 'Pass Accuracy', 'Ball Handle', 'Speed w/ Ball', 'Interior D', 'Perimeter D', 'Steal', 'Block', 'Off Rebound', 'Def Rebound', 'Speed', 'Agility', 'Strength', 'Vertical']
      : cache.get('goats')?.attributeOrder ?? cache.get('goated')?.attributeOrder ?? [];
    const alloc = order.map(name => Number(attributes[name] ?? 0));
    const ceilings = kernel.W(height, weight, wingspan);
    const overall = kind === 'goated' && Number.isFinite(Number(record.card?.overall))
      ? Number(record.card.overall)
      : kernel.overallApprox(alloc, ceilings);
    const checked = prepareBuild({ p: positionIndex, h: height, w: weight, s: wingspan, alloc }, kernel, rules);
    const legal = checked.ok;
    const query = kind === 'presets' ? record.code : buildQuery(positionIndex, height, weight, wingspan, alloc);
    const link = `/builder?${query}${legal ? '' : '&fit=1'}`;
    const subtitle = kind === 'presets'
      ? `${record.position} · ${record.heightRangeInches?.min === record.heightRangeInches?.max ? feetInches(record.heightRangeInches.min) : record.heightRangeInches ? `${feetInches(record.heightRangeInches.min)}–${feetInches(record.heightRangeInches.max)}` : 'Any height'} · ${record.source ?? 'preset'}`
      : `${record.position ?? ''} · ${feetInches(height)} · ${weight} lb · ${feetInches(wingspan)} wingspan${record.teamSeason ? ` · ${record.teamSeason}` : ''}`;
    const why = record.why ?? record.role ?? record.bio ?? record.unlock?.label ?? '';
    return el('article', { class: 'build-card' }, [
      el('div', { class: 'build-ovr' }, [el('span', { text: 'OVERALL' }), el('strong', { text: Number.isFinite(overall) ? String(Math.round(overall)) : '—' })]),
      el('div', { class: 'build-main' }, [
        el('p', { class: 'muted build-kicker', text: kind === 'presets' ? 'PRESET' : kind === 'goats' ? 'GOAT BUILD' : 'GOATED BUILD' }),
        el('h3', { text: record.name }),
        el('p', { class: 'muted', text: subtitle }),
        why ? el('p', { class: 'build-meta', text: why }) : null,
        !legal ? el('p', { class: 'muted breaker-note', text: 'Reference ratings exceed normal builder limits. Opening this card creates a legal fitted version.' }) : checked.adjusted ? el('p', { class: 'muted breaker-note', text: 'Linked ratings will be updated when opened in the builder.' }) : null,
        el('div', { class: 'attr-grid' }, order.map(name => el('div', { class: 'attr-cell' }, [
          el('span', { class: 'muted', text: name }),
          el('b', { text: String(attributes[name] ?? 0) }),
        ]))),
        el('p', { class: 'fieldset' }, [
          el('a', { class: 'btn primary', href: link, text: legal ? 'Open in builder' : 'Fit to builder' }),
          kind === 'presets' ? el('code', { class: 'code', text: record.code }) : null,
        ]),
      ]),
    ]);
  }

  async function render() {
    for (const [index, tab] of TABS.entries()) {
      tabButtons[index].classList.toggle('is-active', tab.id === active);
      tabButtons[index].setAttribute('aria-selected', String(tab.id === active));
    }
    list.replaceChildren(el('p', { class: 'muted', text: 'Loading builds…' }));
    try {
      const data = await load(TABS.find(tab => tab.id === active));
      const records = active === 'presets' ? data.presets : data.builds;
      const filtered = position ? records.filter(record => record.position === position || record.decodedCode?.position === position) : records;
      status.textContent = `${filtered.length} ${active === 'presets' ? 'preset' : 'build'}${filtered.length === 1 ? '' : 's'} · recovered reference data`;
      list.replaceChildren(...filtered.map(record => cardFor(record, active)));
    } catch (error) {
      status.className = 'warn';
      status.textContent = `Could not load these builds: ${error instanceof Error ? error.message : String(error)}`;
      list.replaceChildren();
    }
  }

  render();
}

init();
