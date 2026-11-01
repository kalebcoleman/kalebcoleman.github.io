import { r as element } from './shell-DuKJJrzf.js';
import { n as loadKernel } from './kernel-BWpHXNaH.js';
import { TAKEOVER_CATEGORIES, formatTakeoverRequirements } from './takeover-data.mjs';

const tabs = [{ id: 'gloss', label: 'Badge glossary' }, { id: 'takes', label: 'Takeovers' }];
const panelId = 'glpanel';
const tabId = id => `gltab-${id}`;

const TakeoversView = {
  async render({ root, subtab }) {
    const kernel = await loadKernel();
    const response = await fetch('/data/takeovers.json', { cache: 'force-cache' });
    if (!response.ok) throw new Error('Could not load takeover data.');
    const data = await response.json();
    let selected = subtab === 'takes' ? 'takes' : 'gloss';
    const panel = element('div', { id: panelId, role: 'tabpanel', tabindex: '0' });
    const buttons = tabs.map(({ id, label }) => element('button', {
      class: 'tab', type: 'button', text: label, 'data-t': id, id: tabId(id), role: 'tab',
      'aria-controls': panelId, 'aria-selected': 'false', tabindex: '-1', onclick: () => select(id),
    }));
    const tablist = element('div', { class: 'tabs', id: 'glMode', role: 'tablist', 'aria-label': 'Badge glossary and takeovers' }, buttons);
    tablist.addEventListener('keydown', event => {
      const current = tabs.findIndex(tab => tab.id === selected);
      let next = -1;
      if (event.key === 'ArrowRight') next = (current + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next >= 0) { event.preventDefault(); select(tabs[next].id, true); }
    });
    function select(id, focus = false) {
      selected = id;
      const index = tabs.findIndex(tab => tab.id === id);
      if (focus && index >= 0) buttons[index].focus();
      render();
    }
    function render() {
      for (const button of buttons) {
        const active = button.dataset.t === selected;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-selected', String(active));
        button.tabIndex = active ? 0 : -1;
      }
      panel.setAttribute('aria-labelledby', tabId(selected));
      if (selected === 'takes') {
        const search = element('input', { class: 'inp', type: 'search', placeholder: 'Search takeovers', 'aria-label': 'Search takeovers' });
        const list = element('div');
        function showRows() {
          const term = search.value.trim().toLowerCase();
          const rows = data.rows.filter(row => [row[2], TAKEOVER_CATEGORIES[row[3]], row[5]].some(value => String(value ?? '').toLowerCase().includes(term)));
          list.replaceChildren(element('p', { class: 'muted', text: `${rows.length} takeover(s)` }),
            element('div', { class: 'tbl-wrap', role: 'region', tabindex: '0', 'aria-label': 'Takeover requirements table (scrollable)' }, [
              element('table', { class: 'tbl' }, [
                element('thead', {}, [element('tr', {}, ['Takeover', 'Category', 'Requirements', 'Effect'].map(text => element('th', { text })))]),
                element('tbody', {}, rows.map(row => element('tr', {}, [
                  element('td', { text: row[2] }),
                  element('td', { text: TAKEOVER_CATEGORIES[row[3]] ?? 'Other' }),
                  element('td', { text: formatTakeoverRequirements(row[4], kernel.env.body.attrs) }),
                  element('td', { text: row[5] }),
                ]))),
              ]),
            ]));
        }
        search.addEventListener('input', showRows);
        panel.replaceChildren(element('p', { class: 'muted', text: 'Requirements and effects from the recovered takeover dataset.' }), search, list);
        showRows();
        return;
      }
      const sample = Array(21).fill(70);
      panel.replaceChildren(element('p', { class: 'muted', text: `Glossary view: ${kernel.badgeCount(sample)} badge tiers unlocked at 70 across the board.` }),
        element('div', { class: 'grid badges' }, kernel.env.badges.badges.map(badge => element('article', { class: 'card badge' }, [
          element('h3', { text: badge[0] }),
          element('ul', { class: 'list' }, badge[1].map((requirements, index) => element('li', {
            text: `${kernel.env.badges.tiers[index + 1]}: ${requirements.map(([attribute, rating]) => `${kernel.env.body.attrs[attribute]} ${rating}`).join(badge[2] ? ' or ' : ' + ')}`,
          }))),
        ]))));
    }
    root.replaceChildren(element('div', { class: 'panel' }, [tablist]), element('div', { class: 'panel' }, [panel]));
    render();
  },
};
export { TakeoversView };
