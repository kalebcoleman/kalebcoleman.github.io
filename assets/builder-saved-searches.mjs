/**
 * Saved finder searches. Targets, any-position and position are stored locally;
 * a shared ?find= link pre-fills the same controls. Nothing is uploaded.
 */

const KEY = 'fb.searches.v1';
const MAX = 20;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function read() {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function write(value) {
  try { localStorage.setItem(KEY, JSON.stringify(value.slice(-MAX))); } catch { /* optional */ }
}

function decode(search) {
  const raw = new URLSearchParams(search).get('find');
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || !Array.isArray(value.targets) || value.targets.length !== 21) return null;
    return {
      targets: value.targets.map(item => Math.max(0, Math.min(99, Number(item) || 0))),
      anyPos: !!value.anyPos,
      position: Math.max(0, Math.min(4, Number(value.position) || 0)),
    };
  } catch {
    return null;
  }
}

export function mountSavedSearches(root, { read: readCurrent, apply: applyCurrent }) {
  const panel = document.createElement('details');
  panel.className = 'fb-saved-searches';
  panel.append(node('summary', null, 'Saved searches'));
  const row = node('div', 'fieldset');
  const name = document.createElement('input');
  name.className = 'inp';
  name.placeholder = 'Search name';
  name.setAttribute('aria-label', 'Saved search name');
  const save = node('button', 'btn', 'Save current');
  save.type = 'button';
  const share = node('button', 'btn', 'Copy link');
  share.type = 'button';
  row.append(name, save, share);
  const status = node('p', 'muted');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const list = node('ul', 'fb-saved-list');
  panel.append(row, status, list);
  root.append(panel);

  let entries = read();

  function render() {
    list.replaceChildren(...entries.slice(-8).reverse().map(entry => {
      const item = node('li');
      const label = node('span', null, entry.name);
      const load = node('button', 'btn', 'Load');
      load.type = 'button';
      load.setAttribute('aria-label', `Load saved search ${entry.name}`);
      load.addEventListener('click', () => {
        applyCurrent(entry.state, false);
        status.textContent = `Loaded ${entry.name}. Press Find builds.`;
      });
      const run = node('button', 'btn', 'Run');
      run.type = 'button';
      run.setAttribute('aria-label', `Run saved search ${entry.name}`);
      run.addEventListener('click', () => {
        applyCurrent(entry.state, true);
        status.textContent = `Running ${entry.name}…`;
      });
      const remove = node('button', 'btn', 'Delete');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Delete saved search ${entry.name}`);
      remove.addEventListener('click', () => {
        entries = entries.filter(item => item !== entry);
        write(entries);
        render();
      });
      item.append(label, load, run, remove);
      return item;
    }));
  }

  share.addEventListener('click', async () => {
    const state = readCurrent();
    const url = new URL(location.href);
    url.searchParams.set('find', JSON.stringify(state));
    try {
      await navigator.clipboard.writeText(url.toString());
      status.textContent = 'Search link copied.';
    } catch {
      status.textContent = url.toString();
    }
  });

  save.addEventListener('click', () => {
    const state = readCurrent();
    const label = name.value.trim() || `Search ${entries.length + 1}`;
    entries.push({ name: label, state, at: Date.now() });
    name.value = '';
    write(entries);
    status.textContent = `Saved ${label}.`;
    render();
  });

  const shared = decode(location.search);
  if (shared) {
    const applyShared = () => {
      applyCurrent(shared, false);
      status.textContent = 'Loaded a shared search. Press Find builds.';
    };
    requestAnimationFrame(applyShared);
  }
  render();
  return { render };
}
