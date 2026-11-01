const tierName = (G, tier) => G.TIERNAME?.[tier] ?? `Tier ${tier}`;

export function fuseCandidates(G, build, limit = 20) {
  const hb = build.h - 63;
  const tiers = G.BADGES.map((_badge, index) => G.tierMetAt(index, build.alloc, hb));
  const equipped = tiers.map((tier, index) => tier > 0 ? index : -1).filter(index => index >= 0);
  const seen = new Set();
  const pairs = [];
  for (const badge of equipped) {
    for (const partner of G.fusePairs(badge)) {
      if (partner === badge || tiers[partner] <= 0) continue;
      const key = [badge, partner].sort((a, b) => a - b).join(':');
      if (seen.has(key)) continue;
      seen.add(key);
      pairs.push({
        a: badge,
        b: partner,
        aTier: tiers[badge],
        bTier: tiers[partner],
        cost: (G.tierCost(badge, tiers[badge]) || 0) + (G.tierCost(partner, tiers[partner]) || 0),
      });
    }
  }
  pairs.sort((left, right) => right.cost - left.cost || left.a - right.a);
  return { tiers, equipped, pairs: pairs.slice(0, limit) };
}

function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text != null) element.textContent = text;
  if (className) element.className = className;
  return element;
}

export function mountFusePanel(root, { getBuild }) {
  const panel = document.createElement('section');
  panel.className = 'panel';
  panel.setAttribute('aria-label', 'Badge fuse candidates');
  const heading = node('h3', 'Badge fuse candidates');
  const note = node('p', 'Badges that can fuse together on this build. Token costs are the current tier costs; the in-game Fuse result still follows the game’s own rules.', 'muted');
  const status = node('p', '', 'muted');
  status.setAttribute('role', 'status');
  const refresh = node('button', 'Refresh', 'btn');
  refresh.type = 'button';
  const actions = node('div', null, 'fieldset');
  actions.append(refresh);
  const tableHost = node('div');
  panel.append(heading, note, actions, status, tableHost);
  root.append(panel);

  function paint() {
    const G = window.GBLE;
    if (!G?.fusePairs || !G?.tierMetAt || !G?.BADGES) {
      status.textContent = 'The fuse data is unavailable on this page.';
      return;
    }
    const build = getBuild();
    const { equipped, pairs } = fuseCandidates(G, build);
    status.textContent = equipped.length
      ? `${equipped.length} badge tier${equipped.length === 1 ? '' : 's'} equipped · ${pairs.length} compatible fuse pair${pairs.length === 1 ? '' : 's'} shown.`
      : 'No badge tiers are equipped on this build yet.';
    if (!pairs.length) {
      tableHost.replaceChildren(node('p', 'No compatible fuse pairs are equipped. Raise two compatible badges to their first tier first.', 'muted'));
      return;
    }
    const table = node('table', null, 'tbl');
    const head = node('tr');
    for (const label of ['Badge A', 'Tier', 'Badge B', 'Tier', 'Current token cost']) head.append(node('th', label));
    const thead = node('thead');
    thead.append(head);
    const tbody = node('tbody');
    for (const pair of pairs) {
      const row = node('tr');
      for (const value of [
        G.BADGES[pair.a][0],
        tierName(G, pair.aTier),
        G.BADGES[pair.b][0],
        tierName(G, pair.bTier),
        String(pair.cost),
      ]) row.append(node('td', value));
      tbody.append(row);
    }
    table.append(thead, tbody);
    const wrap = node('div', null, 'tbl-wrap');
    wrap.append(table);
    tableHost.replaceChildren(wrap);
  }

  refresh.addEventListener('click', paint);
  paint();
  const overall = document.querySelector('.overall');
  if (overall) new MutationObserver(paint).observe(overall, { childList: true, subtree: true, characterData: true });
  return { refresh: paint };
}
