function el(tag, text, className) {
  const node = document.createElement(tag);
  if (text != null) node.textContent = text;
  if (className) node.className = className;
  return node;
}

async function init() {
  const root = document.querySelector('#mechanics');
  try {
    const response = await fetch('/data/mechanics.json', { cache: 'force-cache' });
    if (!response.ok) throw new Error('Mechanics data unavailable');
    const data = await response.json();
    const controls = el('div', null, 'panel fieldset');
    const query = el('input', null, 'inp'); query.type = 'search'; query.placeholder = 'Search mechanics'; query.setAttribute('aria-label', 'Search mechanics');
    const kind = el('select', null, 'sel'); kind.setAttribute('aria-label', 'Mechanics type');
    const all = el('option', 'All types'); all.value = ''; kind.append(all);
    for (const [value, label] of data.kinds) { const option = el('option', label); option.value = value; kind.append(option); }
    const category = el('select', null, 'sel'); category.setAttribute('aria-label', 'Mechanics category');
    const any = el('option', 'All categories'); any.value = ''; category.append(any);
    data.categories.forEach((name, index) => { const option = el('option', name); option.value = String(index); category.append(option); });
    const count = el('p', null, 'muted'); count.setAttribute('role', 'status');
    const results = el('div', null, 'grid');
    controls.append(query, kind, category);
    root.replaceChildren(controls, count, results);
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
        return card;
      }));
    }
    query.addEventListener('input', render); kind.addEventListener('change', render); category.addEventListener('change', render); render();
  } catch { root.textContent = 'Could not load the mechanics data. Please try again.'; }
}
init();
