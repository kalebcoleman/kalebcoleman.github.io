import { buildLink } from './reference-finder.mjs';

const KEY = 'fb_finder_last';

function read() {
  try {
    const rows = JSON.parse(sessionStorage.getItem(KEY) || '[]');
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function feet(inches) {
  return `${Math.floor(inches / 12)}'${inches % 12}"`;
}

function paint() {
  const view = document.querySelector('#view');
  if (!view || view.querySelector('.builder-recents')) return;
  const rows = read();
  if (!rows.length) return;
  const section = document.createElement('section');
  section.className = 'panel builder-recents';
  section.innerHTML = '<div class="panel-head"><h2>Last finder search</h2><a href="/finder/">Edit search</a></div><p class="muted">The 12 builds from your last search. Open one to load it into the builder.</p>';
  const wrap = document.createElement('div');
  wrap.className = 'tbl-wrap';
  wrap.setAttribute('role', 'region');
  wrap.tabIndex = 0;
  wrap.setAttribute('aria-label', 'Last finder results');
  const table = document.createElement('table');
  table.className = 'tbl';
  table.innerHTML = '<thead><tr><th>Overall</th><th>Build</th><th>Body</th><th>Points</th><th></th></tr></thead>';
  const body = document.createElement('tbody');
  for (const row of rows) {
    const tr = document.createElement('tr');
    const cells = [
      String(row.ovr ?? '—'),
      `${row.pos != null ? ['PG', 'SG', 'SF', 'PF', 'C'][row.pos] : '—'} · ${row.body ? feet(row.body[0]) : '—'}`,
      row.body ? `${row.body[1]} lb · ${feet(row.body[2])} wingspan` : '—',
      String(row.points ?? '—'),
    ];
    for (const text of cells) {
      const td = document.createElement('td');
      td.textContent = text;
      tr.append(td);
    }
    const action = document.createElement('td');
    const link = document.createElement('a');
    link.className = 'btn';
    link.href = buildLink(row);
    link.textContent = 'Open';
    action.append(link);
    tr.append(action);
    body.append(tr);
  }
  table.append(body);
  wrap.append(table);
  section.append(wrap);
  view.prepend(section);
}

const view = document.querySelector('#view');
if (view) {
  new MutationObserver(paint).observe(view, { childList: true, subtree: true });
  setTimeout(paint, 1200);
}
