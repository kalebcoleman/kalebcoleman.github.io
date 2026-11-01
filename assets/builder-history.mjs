/**
 * Builder history: local undo/redo snapshots plus named versions.
 * Snapshots are the builder's own share codes, restored through the validated
 * __loadShared path. Nothing leaves the browser.
 */

const STORE = 'fb.history.v1';
const VERSIONS = 'fb.versions.v1';
const MAX = 40;

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function timeLabel(at) {
  try {
    return new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '';
  }
}

function readStore(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStore(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* optional */ }
}

export function mountBuilderHistory(root) {
  const panel = node('section', 'panel builder-history');
  panel.setAttribute('aria-label', 'Build history');
  const head = node('div', 'panel-head');
  head.append(node('h2', null, 'History'), node('span', 'muted', 'local only'));
  const controls = node('div', 'fieldset fb-history-controls');
  const undo = node('button', 'btn', 'Undo');
  undo.type = 'button';
  undo.setAttribute('aria-label', 'Undo the last build change');
  const redo = node('button', 'btn', 'Redo');
  redo.type = 'button';
  redo.setAttribute('aria-label', 'Redo the last undone build change');
  const status = node('p', 'muted');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  controls.append(undo, redo);
  const versions = document.createElement('details');
  versions.className = 'fb-versions';
  versions.append(node('summary', null, 'Named versions'));
  const versionRow = node('div', 'fieldset');
  const nameInput = document.createElement('input');
  nameInput.className = 'inp';
  nameInput.placeholder = 'Version name';
  nameInput.setAttribute('aria-label', 'Version name');
  const saveVersion = node('button', 'btn', 'Save version');
  saveVersion.type = 'button';
  versionRow.append(nameInput, saveVersion);
  const versionList = node('ul', 'fb-version-list');
  versions.append(versionRow, versionList);
  const list = node('ul', 'fb-history-list');
  panel.append(head, controls, status, versions, list);
  root.append(panel);

  let stack = readStore(STORE).filter(entry => entry && typeof entry.code === 'string').slice(-MAX);
  let versionsData = readStore(VERSIONS).filter(entry => entry && typeof entry.code === 'string');
  let index = stack.length - 1;
  let lastCode = stack[index]?.code ?? null;
  let restoring = false;
  let timer = 0;

  function codeInput() {
    return [...document.querySelectorAll('#view input.inp.code')].find(input => String(input.value).startsWith('p='));
  }

  function currentCode() {
    return codeInput()?.value ?? '';
  }

  function persist() {
    writeStore(STORE, stack.slice(-MAX));
    writeStore(VERSIONS, versionsData.slice(-30));
  }

  function render() {
    undo.disabled = index <= 0;
    redo.disabled = index >= stack.length - 1;
    list.replaceChildren(...stack.slice(-8).reverse().map((entry, offset) => {
      const position = stack.length - 1 - offset;
      const row = node('li');
      const label = node('span', null, `${entry.label || 'Edit'} · ${timeLabel(entry.at)}`);
      const restore = node('button', 'btn', 'Restore');
      restore.type = 'button';
      restore.setAttribute('aria-label', `Restore ${entry.label || 'edit'} from ${timeLabel(entry.at)}`);
      restore.addEventListener('click', () => restoreAt(position));
      row.append(label, restore);
      return row;
    }));
    versionList.replaceChildren(...versionsData.slice(-8).reverse().map(entry => {
      const row = node('li');
      const label = node('span', null, `${entry.name} · ${timeLabel(entry.at)}`);
      const load = node('button', 'btn', 'Load');
      load.type = 'button';
      load.setAttribute('aria-label', `Load named version ${entry.name}`);
      load.addEventListener('click', () => {
        restoring = true;
        window.__fbLoadBuildCode?.(entry.code);
        lastCode = entry.code;
        status.textContent = `Loaded named version ${entry.name}.`;
        window.setTimeout(() => { restoring = false; }, 600);
        render();
      });
      const remove = node('button', 'btn', 'Delete');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Delete named version ${entry.name}`);
      remove.addEventListener('click', () => {
        versionsData = versionsData.filter(item => item !== entry);
        persist();
        render();
      });
      row.append(label, load, remove);
      return row;
    }));
  }

  function snapshot(label = 'Edit') {
    if (restoring) return;
    const code = currentCode();
    if (!code || code === lastCode) return;
    if (index < stack.length - 1) stack = stack.slice(0, index + 1);
    stack.push({ code, at: Date.now(), label });
    if (stack.length > MAX) stack = stack.slice(-MAX);
    index = stack.length - 1;
    lastCode = code;
    persist();
    render();
  }

  function schedule(label) {
    if (restoring) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(() => snapshot(label), 350);
  }

  function restoreAt(position) {
    const entry = stack[position];
    if (!entry) return;
    restoring = true;
    window.__fbLoadBuildCode?.(entry.code);
    index = position;
    lastCode = entry.code;
    status.textContent = `Restored ${entry.label || 'edit'} from ${timeLabel(entry.at)}.`;
    render();
    window.setTimeout(() => { restoring = false; }, 600);
  }

  function undoLast() {
    if (index <= 0) return;
    restoreAt(index - 1);
  }

  function redoLast() {
    if (index >= stack.length - 1) return;
    restoreAt(index + 1);
  }

  undo.addEventListener('click', undoLast);
  redo.addEventListener('click', redoLast);
  saveVersion.addEventListener('click', () => {
    const code = currentCode();
    if (!code) { status.textContent = 'The build is not ready yet.'; return; }
    const name = nameInput.value.trim() || `Version ${versionsData.length + 1}`;
    versionsData.push({ name, code, at: Date.now() });
    nameInput.value = '';
    persist();
    status.textContent = `Saved version ${name}.`;
    render();
  });

  const view = document.getElementById('view');
  if (view) {
    view.addEventListener('input', () => schedule('Edit'), true);
    view.addEventListener('change', () => schedule('Edit'), true);
    view.addEventListener('click', () => schedule('Edit'), true);
  }
  const qr = document.querySelector('.qr');
  if (qr) new MutationObserver(() => schedule('Edit')).observe(qr, { childList: true, subtree: true });
  document.addEventListener('keydown', event => {
    if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'z') return;
    if (event.target?.closest?.('input,textarea,select,[contenteditable]')) return;
    event.preventDefault();
    if (event.shiftKey) redoLast();
    else undoLast();
  });

  window.__fbUndo = undoLast;
  window.__fbRedo = redoLast;
  snapshot('Initial');
  requestAnimationFrame(() => snapshot('Initial'));
  render();
  return { render, snapshot };
}
