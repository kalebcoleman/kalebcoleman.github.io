/**
 * Finder power summary.
 *
 * Turns a finder result into the two numbers players compare after overall:
 * how many badge tiers the build earns and how many badge tokens its attributes
 * generate. Both come from the recovered GBLE client rules; nothing is guessed.
 */

export const TOKEN_GROUPS = Object.freeze([
  'Finishing', 'Shooting', 'Playmaking', 'Defense', 'Rebounding', 'Physicals',
]);

export function finderPower(G, build) {
  if (!G || !build || !Array.isArray(build.alloc)) return null;

  const tiers = typeof G.badgeTiersOf === 'function'
    ? G.badgeTiersOf(build.alloc, Number(build.h) - 63)
    : null;
  const badges = [];
  if (tiers) {
    for (let index = 0; index < tiers.length; index += 1) {
      const tier = Number(tiers[index]) || 0;
      if (tier <= 0) continue;
      const badge = G.BADGES?.[index];
      badges.push({
        index,
        name: badge?.[0] ?? `Badge ${index + 1}`,
        tier,
        tierName: G.TIERNAME?.[tier] ?? `Tier ${tier}`,
      });
    }
    badges.sort((left, right) => right.tier - left.tier || left.name.localeCompare(right.name));
  }

  const pools = typeof G.tokensAt === 'function'
    ? G.tokensAt(build.alloc, build.p, build.h)
    : null;
  const tokenGroups = TOKEN_GROUPS.map((name, index) => ({
    name,
    tokens: Number(pools?.[index]) || 0,
  }));
  const tokenBudget = pools ? tokenGroups.reduce((sum, group) => sum + group.tokens, 0) : null;

  return {
    badgeTiers: tiers ? badges.length : null,
    tokenBudget,
    tokenGroups,
    topBadges: badges.slice(0, 5),
    badges,
    maxTier: badges.reduce((max, badge) => Math.max(max, badge.tier), 0),
  };
}

export function powerLabel(power) {
  if (!power) return 'Badge and token data unavailable';
  const tiers = power.badgeTiers == null ? 'tiers n/a' : `${power.badgeTiers} tier${power.badgeTiers === 1 ? '' : 's'}`;
  const tokens = power.tokenBudget == null ? 'tokens n/a' : `${power.tokenBudget} token${power.tokenBudget === 1 ? '' : 's'}`;
  const top = power.topBadges.map(badge => `${badge.tierName} ${badge.name}`).join(' · ');
  const more = power.badges.length > power.topBadges.length
    ? ` · +${power.badges.length - power.topBadges.length} more`
    : '';
  return `${tiers} · ${tokens}${top ? ` · ${top}${more}` : ''}`;
}

export function sortFinderResults(rows, mode = 'true') {
  const copy = Array.isArray(rows) ? rows.slice() : [];
  const value = row => ({
    trueOvr: Number(row?.trueOvr ?? row?.ovr) || 0,
    badges: Number(row?.power?.badgeTiers) || 0,
    tokens: Number(row?.power?.tokenBudget) || 0,
  });
  if (mode === 'badges') {
    copy.sort((left, right) => value(right).badges - value(left).badges
      || value(right).trueOvr - value(left).trueOvr
      || value(right).tokens - value(left).tokens);
  } else if (mode === 'tokens') {
    copy.sort((left, right) => value(right).tokens - value(left).tokens
      || value(right).trueOvr - value(left).trueOvr
      || value(right).badges - value(left).badges);
  } else if (mode === 'true') {
    copy.sort((left, right) => value(right).trueOvr - value(left).trueOvr
      || value(right).badges - value(left).badges
      || value(right).tokens - value(left).tokens);
  }
  return copy;
}
