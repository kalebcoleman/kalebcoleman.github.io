const STORAGE_KEY = 'fb_build_library_v1';

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

/** A private, browser-local build library with an explicit JSON backup. */
export function mountBuildLibrary(root, { getCode, loadCode }) {
  const heading = element('h3', 'My build library');
  const description = element('p', 'Builds stay in this browser. Export a backup to move them to another device.', 'muted');
  const row = element('div', null, 'fieldset');
  const name = element('input', null, 'inp');
  name.type = 'text'; name.maxLength = 100; name.placeholder = 'Build name'; name.setAttribute('aria-label', 'Build name');
  const save = element('button', 'Save build', 'btn primary'); save.type = 'button';
  const download = element('button', 'Export library', 'btn'); download.type = 'button';
  const upload = element('input'); upload.type = 'file'; upload.accept = '.json,application/json'; upload.setAttribute('aria-label', 'Import build library');
  const status = element('p', '', 'muted'); status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const list = element('ul', null, 'list');
  row.append(name, save, download, upload);
  root.append(heading, description, row, status, list);

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.code === 'string') : [];
    } catch { return []; }
  }
  function write(items) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
    catch { status.textContent = 'Could not save the library in this browser. Check storage availability and export any existing builds.'; return false; }
  }
  function render() {
    const items = read(); list.replaceChildren();
    if (!items.length) { list.append(element('li', 'No named builds saved yet.')); return; }
    for (const item of items) {
      const li = element('li');
      li.append(element('span', item.name + ' '));
      const load = element('button', 'Load', 'btn'); load.type = 'button';
      load.addEventListener('click', () => { status.textContent = loadCode(item.code) ? `Loaded ${item.name}.` : 'This build code could not be loaded.'; });
      const remove = element('button', 'Delete', 'btn'); remove.type = 'button';
      remove.addEventListener('click', () => { if (write(read().filter(entry => entry.id !== item.id))) { status.textContent = `Deleted ${item.name}.`; render(); } });
      li.append(load, document.createTextNode(' '), remove); list.append(li);
    }
  }
  save.addEventListener('click', () => {
    const title = name.value.trim() || `Build ${new Date().toLocaleString()}`;
    const code = getCode();
    if (!code) { status.textContent = 'This build could not be saved.'; return; }
    const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    if (write([...read(), { id, name: title, code }])) { name.value = ''; status.textContent = `Saved ${title} on this device.`; render(); }
  });
  download.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify({ version: 1, builds: read() }, null, 2)], { type: 'application/json' }));
    const link = element('a'); link.href = url; link.download = 'freebuilder-builds.json'; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Build library exported.';
  });
  upload.addEventListener('change', async () => {
    try {
      if (!upload.files?.length) return;
      const data = JSON.parse(await upload.files[0].text());
      if (data.version !== 1 || !Array.isArray(data.builds)) throw new Error('Invalid file');
      const valid = data.builds.filter(item => item && typeof item.id === 'string' && typeof item.name === 'string' && typeof item.code === 'string');
      if (valid.length !== data.builds.length) throw new Error('Invalid build');
      const existing = read(), ids = new Set(existing.map(item => item.id));
      const added = valid.filter(item => { if (ids.has(item.id)) return false; ids.add(item.id); return true; });
      if (write([...existing, ...added])) { status.textContent = `Imported ${added.length} build(s).`; render(); }
    } catch { status.textContent = 'Could not import that build library. Choose a Free Builder JSON backup.'; }
    finally { upload.value = ''; }
  });
  render();
}
