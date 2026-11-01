function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function feetInches(inches) {
  const value = Number(inches);
  if (!Number.isFinite(value)) return '—';
  return `${Math.floor(value / 12)}'${value % 12}"`;
}

function tierText(badge, tierIndex, attrs) {
  const requirements = badge?.[1]?.[tierIndex - 1] ?? [];
  if (!requirements.length) return '—';
  const parts = requirements.map(([attribute, rating]) => `${attrs?.[attribute] ?? `Attribute ${attribute + 1}`} ${rating}`);
  return parts.join(badge?.[2] ? ' or ' : ' + ');
}

async function init() {
  const root = document.querySelector('#mechanics');
  try {
    const [response, badgesResponse, bodyResponse] = await Promise.all([
      fetch('/data/mechanics.json', { cache: 'force-cache' }),
      fetch('/data/badges.json', { cache: 'force-cache' }).catch(() => null),
      fetch('/data/body.json', { cache: 'force-cache' }).catch(() => null),
    ]);
    if (!response.ok) throw new Error('Mechanics data unavailable');
    const data = await response.json();
    const badges = badgesResponse?.ok ? await badgesResponse.json() : null;
    const body = bodyResponse?.ok ? await bodyResponse.json() : null;
    const controls = el('div', null, 'panel fieldset');
    const query = el('input', null, 'inp'); query.type = 'search'; query.placeholder = 'Search mechanics'; query.setAttribute('aria-label', 'Search mechanics');
    const kind = el('select', null, 'sel'); kind.setAttribute('aria-label', 'Mechanics type');
    const all = el('option', 'All types'); all.value = ''; kind.append(all);
    for (const [value, label] of data.kinds) { const option = el('option', label); option.value = value; kind.append(option); }
    const category = el('select', null, 'sel'); category.setAttribute('aria-label', 'Mechanics category');
    const any = el('option', 'All categories'); any.value = ''; category.append(any);
    data.categories.forEach((name, index) => { const option = el('option', name); option.value = String(index); category.append(option); });
    const count = el('p', null, 'muted'); count.setAttribute('role', 'status');
    const detail = el('section', null, 'panel');
    detail.hidden = true;
    detail.setAttribute('aria-live', 'polite');
    detail.setAttribute('aria-label', 'Mechanics detail');
    const results = el('div', null, 'grid');
    controls.append(query, kind, category);
    root.replaceChildren(controls, count, detail, results);

    function renderDetail(entry) {
      const kindName = data.kinds.find(pair => pair[0] === entry.kind)?.[1] || 'Mechanics';
      const categoryName = Number.isInteger(entry.category) ? data.categories[entry.category] : '';
      detail.hidden = false;
      detail.replaceChildren();
      const head = el('div', null, 'panel-head');
      const heading = el('h2', entry.name);
      const close = el('button', 'Back to results', 'btn');
      close.type = 'button';
      close.addEventListener('click', () => {
        detail.hidden = true;
        results.scrollIntoView({ block: 'start' });
      });
      head.append(heading, close);
      detail.append(head, el('p', [kindName, categoryName].filter(Boolean).join(' · '), 'muted'));
      if (Array.isArray(entry.height) && entry.height.length === 2) {
        detail.append(el('p', `Height: ${feetInches(entry.height[0])}–${feetInches(entry.height[1])}`, 'muted'));
      }
      if (entry.requirements) detail.append(el('p', `Requirements: ${entry.requirements}`));
      if (entry.summary) detail.append(el('p', entry.summary));
      if (entry.kind === 'b' && badges?.badges) {
        const badge = badges.badges.find(row => row[0] === entry.name);
        if (badge) {
          const table = el('table', null, 'tbl');
          const thead = el('thead');
          const headRow = el('tr');
          for (const text of ['Tier', 'Requirement']) headRow.append(el('th', text));
          thead.append(headRow);
          const tbody = el('tbody');
          for (let tier = 1; tier <= 4; tier += 1) {
            const row = el('tr');
            row.append(el('td', badges.tiers?.[tier] ?? `Tier ${tier}`), el('td', tierText(badge, tier, body?.attrs)));
            tbody.append(row);
          }
          table.append(thead, tbody);
          const wrap = el('div', null, 'tbl-wrap');
          wrap.append(table);
          detail.append(wrap);
        }
        const link = el('a', 'Open badge glossary', 'btn');
        link.href = '/badges/';
        detail.append(link);
      } else if (entry.kind === 't') {
        const link = el('a', 'Open takeover catalog', 'btn');
        link.href = '/takeovers/?tab=takes';
        detail.append(link);
      } else if (entry.kind === 'y') {
        const link = el('a', 'Open motion style catalog', 'btn');
        link.href = '/motion-styles/';
        detail.append(link);
      }
      detail.scrollIntoView({ block: 'start' });
    }

    function render() {
      const needle = query.value.trim().toLowerCase();
      const entries = data.entries.filter(entry => (!kind.value || entry.kind === kind.value)
        && (!category.value || String(entry.category) === category.value)
        && [entry.name, entry.requirements, entry.summary].some(value => String(value || '').toLowerCase().includes(needle)));
      count.textContent = `${entries.length} of ${data.entries.length} entries`;
      results.replaceChildren(...entries.map(entry => {
        const card = el('article', null, 'card');
        const kindName = data.kinds.find(pair => pair[0] === entry.kind)?.[1] || 'Mechanics';
        const categoryName = Number.isInteger(entry.category) ? data.categories[entry.category] : '';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Open details for ${entry.name}`);
        card.append(el('h2', entry.name), el('p', [kindName, categoryName].filter(Boolean).join(' · '), 'muted'));
        if (entry.requirements) card.append(el('p', entry.requirements));
        if (entry.summary) card.append(el('p', entry.summary));
        if (entry.kind === 'b' || entry.kind === 't' || entry.kind === 'y') {
          const link = el('a', entry.kind === 'b' ? 'Open badge glossary'
            : entry.kind === 't' ? 'Open takeover catalog' : 'Open motion style catalog');
          link.href = entry.kind === 'b' ? '/badges/'
            : entry.kind === 't' ? '/takeovers/?tab=takes' : '/motion-styles/';
          card.append(link);
        }
        card.addEventListener('click', event => {
          if (event.target.closest('a')) return;
          renderDetail(entry);
        });
        card.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          if (event.target.closest('a')) return;
          event.preventDefault();
          renderDetail(entry);
        });
        return card;
      }));
    }
    query.addEventListener('input', render); kind.addEventListener('change', render); category.addEventListener('change', render); render();
  } catch { root.textContent = 'Could not load the mechanics data. Please try again.'; }
}
init();
