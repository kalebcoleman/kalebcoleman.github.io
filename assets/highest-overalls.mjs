const root = document.getElementById('highest');
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
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

let board;
let body;
try {
  [board, body] = await Promise.all([
    fetch('/data/highest-overalls.json', { cache: 'force-cache' }).then(response => {
      if (!response.ok) throw new Error(`highest-overalls: ${response.status}`);
      return response.json();
    }),
    fetch('/data/body.json', { cache: 'force-cache' }).then(response => {
      if (!response.ok) throw new Error(`body: ${response.status}`);
      return response.json();
    }),
  ]);
} catch (error) {
  root.replaceChildren(h('section', { class: 'panel' }, h('h2', {}, 'Highest overalls are unavailable'), h('p', { class: 'muted' }, `The recovered board data could not load: ${error instanceof Error ? error.message : 'unknown error'}`)));
  throw error;
}

const state = { position: 0, caps: 1, specialization: false, selected: null };
const feet = inches => `${Math.floor(inches / 12)}'${inches % 12}"`;
const format = value => Number(value).toFixed(1);
const parse = value => String(value ?? '').split('.').filter(Boolean).map(Number);

function rows() {
  return board[body.positions[state.position]]?.[String(state.caps) + (state.specialization ? 's' : '')] ?? [];
}

function highestIndex(list) {
  let best = -1;
  for (let index = 0; index < list.length; index++) {
    if (best < 0 || list[index][3] > list[best][3]) best = index;
  }
  return best;
}

function openLink(row) {
  const alloc = parse(row[5]);
  const breakers = parse(row[6]);
  const query = new URLSearchParams({
    p: String(state.position),
    h: String(row[0]),
    w: String(row[1]),
    s: String(row[2]),
    v: alloc.join('.'),
  });
  if (breakers.length) query.set('o', breakers.join('.'));
  return `/builder?${query}`;
}

function render() {
  const list = rows();
  if (state.selected === null || state.selected >= list.length) state.selected = highestIndex(list);
  const selected = list[state.selected] ?? null;
  const positionButtons = body.positions.map((name, index) => h('button', {
    class: 'btn',
    type: 'button',
    'aria-pressed': String(index === state.position),
    text: name,
    onclick: () => {
      state.position = index;
      state.selected = null;
      render();
    },
  }));

  const table = h('div', { class: 'tbl-wrap', role: 'region', tabindex: '0', 'aria-label': 'Highest overalls by height' },
    h('table', { class: 'tbl ho-table' },
      h('thead', {}, h('tr', {}, ['Height', 'Weight', 'Wingspan', 'True overall', 'Breakers'].map(label => h('th', { text: label })))),
      h('tbody', {}, list.map((row, index) => h('tr', {
        class: index === state.selected ? 'is-selected' : '',
        onclick: () => { state.selected = index; render(); },
      }, [
        h('td', {}, `${feet(row[0])}${index === highestIndex(list) ? ' ★' : ''}`),
        h('td', {}, `${row[1]} lb`),
        h('td', {}, feet(row[2])),
        h('td', {}, format(row[3])),
        h('td', {}, String(parse(row[6]).length)),
      ])))));

  const picked = selected ? h('section', { class: 'panel' },
    h('div', { class: 'ho-hero' },
      h('div', {},
        h('p', { class: 'muted', text: `${body.positions[state.position]} at ${feet(selected[0])}` }),
        h('p', { class: 'muted', text: `${selected[1]} lb · ${feet(selected[2])} wingspan · ${selected[4] >= 0 ? `${body.groups[selected[4]]?.[0] ?? 'Group'} specialization` : 'No specialization'}` }),
        h('p', { class: 'muted', text: `${parse(selected[6]).length} cap breaker${parse(selected[6]).length === 1 ? '' : 's'}` })),
      h('div', { class: 'ho-ovr' }, h('b', { text: format(selected[3]) }), h('span', { text: 'true overall' }))),
    h('a', { class: 'btn primary', href: openLink(selected) }, 'Open in the Builder'),
    h('div', { class: 'ho-alloc' }, parse(selected[5]).map((value, index) => h('div', {}, h('span', { text: body.attrs[index] }), h('b', { text: String(value) })))),
    h('p', { class: 'ho-breakers' },
      h('b', {}, 'Cap breakers: '),
      parse(selected[6]).map(index => body.attrs[index]).join(', ') || 'none'),
    h('p', { class: 'ho-note' }, 'True overall is the raw engine rating. The in-game display caps at 99, so a 100+ board value is the raw ceiling of that frame, not a legal displayed overall.'))
    : h('section', { class: 'panel' }, h('p', { class: 'muted' }, 'No row for that combination.'));

  root.replaceChildren(
    h('section', { class: 'panel' },
      h('div', { class: 'fieldset' }, positionButtons),
      h('div', { class: 'fieldset' },
        h('label', { class: 'lbl' }, ['Cap breakers', h('input', {
          class: 'inp',
          type: 'range',
          min: 1,
          max: 26,
          value: state.caps,
          'aria-label': 'Cap breakers',
          oninput: event => { state.caps = clamp(Number(event.target.value) || 1, 1, 26); state.selected = null; render(); },
        })]),
        h('b', { class: 'muted', text: String(state.caps) }),
        h('label', { class: 'lbl' }, [
          h('input', {
            type: 'checkbox',
            checked: state.specialization,
            onchange: event => { state.specialization = event.target.checked; state.selected = null; render(); },
          }),
          'Specialization (+2 cap breakers)',
        ])),
      h('p', { class: 'muted', text: 'Highest true overall at every legal height. The recovered board includes the cap-breaker allocation and the specialization, if any.' })),
    h('div', { class: 'ho-layout' },
      h('section', { class: 'panel' }, h('h2', {}, 'By height'), table),
      picked),
  );
}

render();
