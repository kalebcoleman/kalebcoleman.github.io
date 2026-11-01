const CATEGORY_COLORS = {
  Finishing: '#d95f24',
  Shooting: '#1e88b5',
  Playmaking: '#7a5af8',
  Defense: '#2e8b57',
  Rebounding: '#b8860b',
  Physicals: '#c62828',
};
const TIER_COLORS = {
  Bronze: 'var(--fb-tier-brz)',
  Silver: 'var(--fb-tier-sil)',
  Gold: 'var(--fb-tier-gld)',
  HOF: 'var(--fb-tier-hof)',
  Legend: 'var(--fb-tier-red)',
};
const STYLE_ID = 'fb-badge-icon-style';
const dataPromise = Promise.all([
  fetch('/data/badges.json', { cache: 'force-cache' }).then(response => response.json()),
  fetch('/data/body.json', { cache: 'force-cache' }).then(response => response.json()),
  fetch('/assets/badge-icons/map.json', { cache: 'force-cache' }).then(response => response.json()),
]).then(([badges, body, icons]) => {
  const categories = new Map();
  for (const [name, tiers] of badges.badges) {
    const requirements = tiers.flat();
    const attribute = requirements[0]?.[0];
    const group = body.groups.find(([, start, end]) => attribute >= start && attribute < end);
    categories.set(name, group?.[0] ?? 'Physicals');
  }
  return { categories, icons };
}).catch(() => ({ categories: new Map(), icons: {} }));

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
:root{--fb-tier-brz:#9A5B22;--fb-tier-sil:#646C74;--fb-tier-gld:#8F6200;--fb-tier-hof:#7A4FB8;--fb-tier-red:#B8322E}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--fb-tier-brz:#B87333;--fb-tier-sil:#AFB6BD;--fb-tier-gld:#E0A32E;--fb-tier-hof:#9B6BD6;--fb-tier-red:#D9534F}}
:root[data-theme="dark"]{--fb-tier-brz:#B87333;--fb-tier-sil:#AFB6BD;--fb-tier-gld:#E0A32E;--fb-tier-hof:#9B6BD6;--fb-tier-red:#D9534F}
.badge-head{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.badge-head h2{margin:0}
.badge-icon{display:inline-grid;place-items:center;width:38px;height:38px;flex:0 0 38px;border-radius:11px;border:1px solid color-mix(in srgb,var(--badge-color) 55%,transparent);background:color-mix(in srgb,var(--badge-color) 16%,transparent)}
.badge-icon:before{content:"";width:24px;height:24px;background:var(--badge-color);-webkit-mask:var(--badge-mask) center/contain no-repeat;mask:var(--badge-mask) center/contain no-repeat}
.badge-chip .badge-icon{width:18px;height:18px;flex-basis:18px;border-radius:6px;border:0;background:transparent;margin-right:1px}
.badge-chip .badge-icon:before{width:14px;height:14px}
.tier-bronze{color:var(--fb-tier-brz);font-weight:700}
.tier-silver{color:var(--fb-tier-sil);font-weight:700}
.tier-gold{color:var(--fb-tier-gld);font-weight:700}
.tier-hof{color:var(--fb-tier-hof);font-weight:700}
.tier-legend{color:var(--fb-tier-red);font-weight:700}
.badge-icon-legend{display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;font-size:12px;color:var(--fg-muted)}
.badge-icon-legend span{display:inline-flex;align-items:center;gap:4px}
.badge-icon-legend i{width:10px;height:10px;border-radius:50%;background:var(--tier-color)}
`;
  document.head.append(style);
}

function iconFor(name, category, icons) {
  const slug = icons[name] ?? 'circle-dot';
  const icon = document.createElement('span');
  icon.className = 'badge-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.style.setProperty('--badge-color', CATEGORY_COLORS[category] ?? CATEGORY_COLORS.Physicals);
  icon.style.setProperty('--badge-mask', `url('/assets/badge-icons/${slug}.svg')`);
  return icon;
}

function tierClass(label) {
  const key = String(label).toLowerCase().replace(/\s+/g, '');
  return `tier-${key}`;
}

function decorateTierText(li) {
  if (li.dataset.tiersDecorated) return;
  li.dataset.tiersDecorated = '1';
  li.innerHTML = li.innerHTML.replace(/\b(Bronze|Silver|Gold|HOF|Legend)\b/g, label => `<span class="${tierClass(label)}">${label}</span>`);
}

function decorateBadgeCard(card, categories, icons) {
  if (card.dataset.badgeIcon) return;
  const heading = card.querySelector('h2');
  if (!heading) return;
  const name = heading.textContent.trim();
  const category = categories.get(name) ?? 'Physicals';
  card.dataset.badgeIcon = '1';
  const head = document.createElement('div');
  head.className = 'badge-head';
  head.append(iconFor(name, category, icons), heading);
  card.prepend(head);
  for (const li of card.querySelectorAll('.list li')) decorateTierText(li);
}

function decorateBadgeChip(chip, categories, icons) {
  if (chip.dataset.badgeIcon) return;
  const name = chip.querySelector('b')?.textContent.trim();
  if (!name) return;
  const category = categories.get(name) ?? 'Physicals';
  chip.dataset.badgeIcon = '1';
  const tier = chip.querySelector('span');
  if (tier) tier.className = tierClass(tier.textContent.trim());
  chip.prepend(iconFor(name, category, icons));
}

export async function decorateBadges(root = document) {
  if (!root || typeof root.querySelectorAll !== 'function') return;
  ensureStyle();
  const { categories, icons } = await dataPromise;
  for (const card of root.querySelectorAll('.badge')) decorateBadgeCard(card, categories, icons);
  for (const chip of root.querySelectorAll('.badge-chip')) decorateBadgeChip(chip, categories, icons);
  const grid = root.querySelector('.grid.badges');
  const panel = grid?.closest('.panel') ?? root.querySelector('.panel');
  if (panel && !panel.querySelector('.badge-icon-legend')) panel.append(legend());
}

function legend() {
  const node = document.createElement('div');
  node.className = 'badge-icon-legend';
  node.setAttribute('aria-label', 'Badge tier colors');
  for (const [label, color] of Object.entries(TIER_COLORS)) {
    const item = document.createElement('span');
    const dot = document.createElement('i');
    dot.style.setProperty('--tier-color', color);
    item.append(dot, label);
    node.append(item);
  }
  return node;
}

const target = document.querySelector('#view, #finder-page, #builds-page');
if (target) {
  let decorating = false;
  const run = () => {
    if (decorating || !target.querySelector('.badge:not([data-badge-icon]), .badge-chip:not([data-badge-icon])')) return;
    decorating = true;
    void decorateBadges(target).finally(() => { decorating = false; });
  };
  run();
  new MutationObserver(run).observe(target, { childList: true, subtree: true });
}
