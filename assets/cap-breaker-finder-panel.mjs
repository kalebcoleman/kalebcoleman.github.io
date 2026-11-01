import {
  ATTRIBUTE_NAMES,
  CAP_BREAKER_MAX,
  createCapBreakerFinder,
  filterRows,
  heightLabel,
  sortRows,
  validateFinderQuery,
} from './cap-breaker-reference-finder.js';
import { capBreakerFinderLink } from './finder-query.mjs';
import { capBreakerRowQuery } from './cap-breaker-row.mjs';

const POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];
const attrOptions = ATTRIBUTE_NAMES.map((name, index) => [index, name]).filter(([index]) => index !== 7);

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

async function init() {
  const root = document.querySelector('#reference-cap-finder');
  if (!root) return;
  const finder = createCapBreakerFinder();
  let allRows = [];
  let loading = false;
  let reloadRequested = false;

  const attribute = el('select', null, 'sel');
  attribute.setAttribute('aria-label', 'Cap-breaker attribute');
  for (const [value, label] of [['', 'Every attribute'], ...attrOptions.map(([i, name]) => [String(i), name])]) {
    const option = el('option', label);
    option.value = value;
    attribute.append(option);
  }
  attribute.value = '2';

  const target = el('select', null, 'sel');
  target.setAttribute('aria-label', 'Cap-breaker target');
  const anyTarget = el('option', 'As high as the frame allows');
  anyTarget.value = '';
  target.append(anyTarget);
  for (let value = 60; value <= 99; value += 1) {
    const option = el('option', String(value));
    option.value = String(value);
    target.append(option);
  }

  const caps = el('select', null, 'sel');
  caps.setAttribute('aria-label', 'Cap breakers owned');
  for (const value of [0, 1, 2, 3, 5, 7, 10, 15, 20, 26]) {
    const option = el('option', String(value));
    option.value = String(value);
    caps.append(option);
  }
  caps.value = '5';

  const position = el('select', null, 'sel');
  position.setAttribute('aria-label', 'Position');
  const anyPosition = el('option', 'Any position');
  anyPosition.value = '';
  position.append(anyPosition);
  POSITIONS.forEach((name, index) => {
    const option = el('option', name);
    option.value = String(index);
    position.append(option);
  });

  const height = el('select', null, 'sel');
  height.setAttribute('aria-label', 'Height');
  const anyHeight = el('option', 'Any height');
  anyHeight.value = '';
  height.append(anyHeight);

  const sort = el('select', null, 'sel');
  sort.setAttribute('aria-label', 'Sort cap-breaker rows');
  for (const [value, label] of [['free', 'Free points'], ['target', 'Target rating'], ['park', 'Starting value'], ['height', 'Height'], ['attribute', 'Attribute']]) {
    const option = el('option', label);
    option.value = value;
    sort.append(option);
  }

  const run = el('button', { class: 'btn primary', type: 'button', text: 'Show cap-breaker rows' });
  const status = el('p', { class: 'muted', role: 'status', 'aria-live': 'polite', text: 'Loading the recovered cap-breaker finder…' });
  const tableWrap = el('div', { class: 'tbl-wrap' });
  tableWrap.setAttribute('tabindex', '0');
  tableWrap.setAttribute('role', 'region');
  tableWrap.setAttribute('aria-label', 'Cap-breaker finder table (scrollable)');
  const table = el('table', { class: 'tbl' });
  const thead = el('thead');
  const headerRow = el('tr');
  ['Pos', 'Height', 'Attribute', 'Starts at', 'Target', 'Free', 'Use'].forEach(label => headerRow.append(el('th', label)));
  thead.append(headerRow);
  const tbody = el('tbody');
  table.append(thead, tbody);
  tableWrap.append(table);

  const controls = el('div', { class: 'fieldset' }, [
    el('label', { class: 'lbl' }, ['Attribute', attribute]),
    el('label', { class: 'lbl' }, ['Target', target]),
    el('label', { class: 'lbl' }, ['Cap breakers', caps]),
    el('label', { class: 'lbl' }, ['Position', position]),
    el('label', { class: 'lbl' }, ['Height', height]),
    el('label', { class: 'lbl' }, ['Sort', sort]),
    run,
  ]);
  root.replaceChildren(controls, status, tableWrap);

  function selectedFilters() {
    return {
      position: position.value === '' ? null : Number(position.value),
      height: height.value === '' ? null : Number(height.value),
      attribute: attribute.value === '' ? null : Number(attribute.value),
    };
  }

  function render() {
    const filters = selectedFilters();
    const attrName = filters.attribute === null ? 'every attribute' : ATTRIBUTE_NAMES[filters.attribute];
    const rows = sortRows(filterRows(allRows, filters), sort.value);
    status.textContent = loading
      ? 'Asking the recovered finder for rows…'
      : `${rows.length} row${rows.length === 1 ? '' : 's'} · ${caps.value} cap breaker${caps.value === '1' ? '' : 's'} · ${attrName}${filters.position === null ? '' : ` · ${POSITIONS[filters.position]}`}${filters.height === null ? '' : ` · ${heightLabel(filters.height)}`}`;
    tbody.replaceChildren(...rows.map(row => {
      const tr = el('tr');
      tr.append(
        el('td', POSITIONS[row.p] ?? `#${row.p}`),
        el('td', heightLabel(row.h)),
        el('td', ATTRIBUTE_NAMES[row.a] ?? `#${row.a}`),
        el('td', String(row.park)),
        el('td', String(row.tgt)),
        el('td', `+${row.free}`),
      );
      const build = el('a', { class: 'btn primary', href: `/builder?${capBreakerRowQuery(row, caps.value)}`, text: 'Build this row', 'aria-label': `Build a ${POSITIONS[row.p]} at ${heightLabel(row.h)} with ${ATTRIBUTE_NAMES[row.a]} at ${row.land}` });
      const use = el('a', { class: 'btn', href: capBreakerFinderLink(row, caps.value), text: 'Find builds', 'aria-label': `Find ${POSITIONS[row.p]} builds at ${heightLabel(row.h)} targeting ${ATTRIBUTE_NAMES[row.a]} ${row.tgt}` });
      const cell = el('td', { style: 'display:flex;gap:6px;flex-wrap:wrap' });
      cell.append(build, use);
      tr.append(cell);
      return tr;
    }));
  }

  async function load() {
    if (loading) { reloadRequested = true; return; }
    const validation = validateFinderQuery({ caps: caps.value, attr: attribute.value, tgt: target.value });
    if (!validation.ok) {
      status.textContent = validation.message;
      return;
    }
    loading = true;
    allRows = [];
    tbody.replaceChildren();
    run.disabled = true;
    status.textContent = 'Asking the recovered finder for rows…';
    try {
      const result = await finder.findParks(validation.query);
      if (reloadRequested) return;
      allRows = result.rows;
      const heights = [...new Set(allRows.map(row => row.h))].sort((a, b) => a - b);
      const previous = height.value;
      const heightOptions = [el('option', 'Any height')];
      heightOptions[0].value = '';
      for (const inches of heights) {
        const option = el('option', heightLabel(inches));
        option.value = String(inches);
        heightOptions.push(option);
      }
      height.replaceChildren(...heightOptions);
      height.value = heights.includes(Number(previous)) ? previous : '';
      loading = false;
      status.className = 'muted';
      render();
      return;
    } catch (error) {
      status.className = 'warn';
      status.textContent = `The recovered cap-breaker finder could not answer: ${error instanceof Error ? error.message : String(error)}`;
      return;
    } finally {
      loading = false;
      run.disabled = false;
      if (reloadRequested) { reloadRequested = false; void load(); }
    }
  }

  run.addEventListener('click', load);
  attribute.addEventListener('change', load);
  for (const control of [position, height, sort]) control.addEventListener('change', render);
  target.addEventListener('change', load);
  caps.addEventListener('change', load);
  render();
  await load();
  window.addEventListener('pagehide', () => finder.dispose(), { once: true });
}

init();
