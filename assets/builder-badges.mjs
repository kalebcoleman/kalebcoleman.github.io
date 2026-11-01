const TIER_CLASS = ['', 'bronze', 'silver', 'gold', 'hof'];

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function mountBuilderBadges(root, { getBuild }) {
  const panel = document.createElement('section');
  panel.className = 'panel builder-badges';
  panel.setAttribute('aria-label', 'Badges on this build');
  const heading = node('h2', 'Badges');
  const counts = node('div', 'builder-badge-counts', 'muted');
  const list = node('div', 'badge-list');
  panel.append(heading, counts, list);
  root.append(panel);

  function paint() {
    const G = window.GBLE;
    if (!G?.BADGES || !G?.tierMetAt) return;
    const build = getBuild();
    const hb = build.h - 63;
    const tiers = G.BADGES.map((_badge, index) => G.tierMetAt(index, build.alloc, hb));
    const total = tiers.filter(Boolean).length;
    const byTier = [0, 0, 0, 0, 0];
    tiers.forEach(tier => { if (tier) byTier[tier]++; });
    counts.replaceChildren(
      node('span', `${total} tiers`, 'builder-badge-total'),
      ...[4, 3, 2, 1].map(tier => node('span', `${G.TIERNAME?.[tier] ?? tier} ${byTier[tier]}`, `tier-${TIER_CLASS[tier]}`)),
    );
    const chips = tiers.map((tier, index) => tier ? { index, tier } : null).filter(Boolean).sort((a, b) => b.tier - a.tier).slice(0, 10);
    list.replaceChildren(...chips.map(({ index, tier }) => {
      const chip = node('span', null, 'badge-chip');
      chip.append(node('b', G.BADGES[index][0]), node('span', G.TIERNAME?.[tier] ?? `Tier ${tier}`, `tier-${TIER_CLASS[tier]}`));
      return chip;
    }));
  }

  paint();
  const overall = document.querySelector('.overall');
  if (overall) new MutationObserver(paint).observe(overall, { childList: true, subtree: true, characterData: true });
  return { refresh: paint };
}
