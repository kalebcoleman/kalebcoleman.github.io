/**
 * Build from a sentence.
 *
 * Plain-English requests are parsed into a body, attribute targets, badge goals
 * and a cap-breaker budget. Validation uses the recovered GBLE maths; nothing is
 * applied until the user presses Apply. Unrecognized words are reported, never
 * guessed into attributes.
 */

export const ATTRIBUTE_NAMES = Object.freeze([
  'Close Shot', 'Driving Layup', 'Driving Dunk', 'Standing Dunk', 'Post Control',
  'Mid-Range', 'Three-Point', 'Free Throw', 'Pass Accuracy', 'Ball Handle',
  'Speed w/ Ball', 'Interior D', 'Perimeter D', 'Steal', 'Block',
  'Off Rebound', 'Def Rebound', 'Speed', 'Agility', 'Strength', 'Vertical',
]);

const POSITION_WORDS = [
  ['PG', 0], ['SG', 1], ['SF', 2], ['PF', 3], ['C', 4],
  ['guard', 0], ['wing', 2], ['forward', 3], ['big', 4], ['center', 4],
];

const ATTRIBUTE_SYNONYMS = [
  ['close shot', [0]], ['close', [0]],
  ['driving layup', [1]], ['layup', [1]], ['layups', [1]],
  ['driving dunk', [2]], ['dunk', [2]], ['dunks', [2]],
  ['standing dunk', [3]], ['standing', [3]],
  ['post control', [4]], ['post', [4]],
  ['mid-range', [5]], ['midrange', [5]], ['mid range', [5]], ['middy', [5]], ['mid', [5]],
  ['three-point', [6]], ['three point', [6]], ['three ball', [6]], ['from three', [6]], ['3pt', [6]], ['3-pt', [6]], ['three', [6]],
  ['free throw', [7]], ['free throws', [7]], ['ft', [7]],
  ['pass accuracy', [8]], ['passing', [8]], ['pass', [8]],
  ['ball handle', [9]], ['ball handling', [9]], ['handles', [9]], ['handle', [9]],
  ['speed with ball', [10]], ['speed w/ ball', [10]], ['speed w ball', [10]], ['swb', [10]],
  ['interior d', [11]], ['interior defense', [11]], ['interior defence', [11]], ['interior', [11]],
  ['perimeter d', [12]], ['perim d', [12]], ['perimeter defense', [12]], ['perimeter defence', [12]], ['perimeter', [12]],
  ['steal', [13]], ['steals', [13]],
  ['block', [14]], ['blocks', [14]],
  ['off rebound', [15]], ['offensive rebound', [15]], ['oreb', [15]], ['off board', [15]],
  ['def rebound', [16]], ['defensive rebound', [16]], ['dreb', [16]], ['def board', [16]],
  ['rebound', [15, 16]], ['rebounds', [15, 16]], ['board', [15, 16]], ['boards', [15, 16]],
  ['speed', [17]], ['agility', [18]], ['strength', [19]], ['vertical', [20]], ['vert', [20]],
];

const ATTRIBUTE_LOOKUP = ATTRIBUTE_SYNONYMS
  .slice()
  .sort((left, right) => right[0].length - left[0].length);

const TIER_WORDS = [
  ['hall of fame', 4], ['hof', 4], ['legend', 4],
  ['gold', 3], ['silver', 2], ['bronze', 1],
];

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'with', 'and', 'plus', 'me', 'make', 'build', 'player',
  'that', 'can', 'get', 'to', 'on', 'in', 'at', 'least', 'minimum', 'min', 'max',
  'maximize', 'use', 'using', 'breakers', 'breaker', 'cap', 'caps', 'wingspan',
  'ws', 'lb', 'lbs', 'pound', 'pounds', 'foot', 'feet', 'ft', 'inch', 'inches',
  'hof', 'hall', 'fame', 'gold', 'silver', 'bronze', 'legend', 'no', 'below',
  'badges', 'badge', 'of', 'for', 'into', 'from', 'is', 'be', 'my', 'want',
]);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalize(text) {
  return String(text ?? '')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function blank(text, start, end) {
  return text.slice(0, start) + ' '.repeat(Math.max(0, end - start)) + text.slice(end);
}

function findAttribute(text) {
  const source = normalize(text).toLowerCase();
  for (const [name, indices] of ATTRIBUTE_LOOKUP) {
    const pattern = new RegExp(`(^|[^a-z0-9])(${escapeRegExp(name)})(?=$|[^a-z0-9])`, 'i');
    if (pattern.test(source)) return { indices, name };
  }
  return null;
}

function attributePattern() {
  return ATTRIBUTE_SYNONYMS
    .map(([name]) => escapeRegExp(name))
    .sort((left, right) => right.length - left.length)
    .join('|');
}

function badgePattern(badgeNames) {
  const aliases = new Map();
  for (const name of badgeNames ?? []) aliases.set(name.toLowerCase(), name);
  aliases.set('limitless', 'Limitless Range');
  aliases.set('contact dunks', 'Posterizer');
  aliases.set('contact dunk', 'Posterizer');
  const names = [...aliases.keys()].sort((left, right) => right.length - left.length);
  return { aliases, pattern: names.map(escapeRegExp).join('|') };
}

function parseTier(value) {
  const lower = String(value ?? '').toLowerCase();
  return TIER_WORDS.find(([word]) => word === lower)?.[1] ?? null;
}

export function parseSentence(text, { badgeNames = [] } = {}) {
  let source = normalize(text);
  const body = { position: null, positionSource: null, height: null, weight: null, wingspan: null, wingspanOffset: null };
  const targets = [];
  const assignments = [];
  const badges = [];
  const notes = [];
  let budget = null;
  let badgeFloor = null;

  const addTarget = (attribute, requested, mode = 'min', extra = {}) => {
    targets.push({ attribute, requested, mode, ...extra });
  };

  // Wingspan first: 7'0 WS / wingspan 7' / +2 wingspan must not be read as height.
  {
    const offset = /(?:\+|plus)\s*(\d{1,2})\s*(?:inch(?:es)?\s*)?(?:wingspan|ws)\b/i.exec(source);
    if (offset) {
      body.wingspanOffset = Number(offset[1]);
      source = blank(source, offset.index, offset.index + offset[0].length);
    }
  }
  if (body.wingspan === null) {
    const patterns = [
      /(?:wingspan|ws)\s*(?:of\s*)?(\d{1,2})\s*'\s*(\d{1,2})?/i,
      /(\d{1,2})\s*'\s*(\d{1,2})?\s*"?\s*(?:wingspan|ws)\b/i,
      /(\d{2,3})\s*(?:"|”|in(?:ch(?:es)?)?)\s*(?:wingspan|ws)\b/i,
      /(?:wingspan|ws)\s*(\d{2,3})\s*(?:"|”|in(?:ch(?:es)?)?)(?=\s|$)/i,
    ];
    for (const pattern of patterns) {
      const match = pattern.exec(source);
      if (!match) continue;
      const feetStyle = /['’]|ft|foot|feet/i.test(match[0]);
      body.wingspan = feetStyle ? (match[2] === undefined ? Number(match[1]) * 12 : Number(match[1]) * 12 + Number(match[2])) : Number(match[1]);
      source = blank(source, match.index, match.index + match[0].length);
      break;
    }
  }

  // Height: 6'8", 6'8", 6ft8, 6 foot 8, 6-8, 68".
  const heightPatterns = [
    /(\d{1,2})\s*'\s*(\d{1,2})\s*(?:"|”)?/i,
    /(\d{1,2})\s*(?:ft|foot|feet)\s*(\d{1,2})?/i,
    /(\d{1,2})\s*-\s*(\d{1,2})\b/,
    /(\d{2,3})\s*(?:"|”|in(?:ch(?:es)?)?)(?=\s|$)/i,
  ];
  for (const pattern of heightPatterns) {
    const match = pattern.exec(source);
    if (!match) continue;
    const feet = Number(match[1]);
    const inches = match[2] === undefined ? 0 : Number(match[2]);
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) continue;
    const totalInches = !/['’]|ft|foot|feet|-/i.test(match[0]);
    body.height = totalInches ? feet : feet * 12 + inches;
    source = blank(source, match.index, match.index + match[0].length);
    break;
  }

  // Weight: 205 lb, 205lbs, 205 pounds.
  {
    const match = /(\d{2,3})\s*(?:lb|lbs|pound|pounds)\b/i.exec(source);
    if (match) {
      body.weight = Number(match[1]);
      source = blank(source, match.index, match.index + match[0].length);
    }
  }

  // Position and size words.
  {
    const pattern = new RegExp(`\\b(${POSITION_WORDS.map(([word]) => escapeRegExp(word)).join('|')})\\b`, 'i');
    const match = pattern.exec(source);
    if (match) {
      const lower = match[1].toLowerCase();
      const found = POSITION_WORDS.find(([word]) => word.toLowerCase() === lower);
      body.position = found?.[1] ?? null;
      body.positionSource = match[1];
      source = blank(source, match.index, match.index + match[0].length);
    }
  }

  // Breaker assignments first, so "use 3 breakers on steal" is not read as a budget.
  {
    const attr = attributePattern();
    const patterns = [
      new RegExp(`\\+(\\d{1,2})\\s*(?:on|to|into)\\s*(${attr})`, 'i'),
      new RegExp(`use\\s*(\\d{1,2})\\s*breakers?\\s*(?:on|for)\\s*(${attr})`, 'i'),
      new RegExp(`(\\d{1,2})\\s*breakers?\\s*(?:on|for)\\s*(${attr})`, 'i'),
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source))) {
        const found = findAttribute(match[2]);
        if (found) for (const attribute of found.indices) assignments.push({ attribute, amount: Number(match[1]) });
        source = blank(source, match.index, match.index + match[0].length);
      }
    }
  }
  {
    const budgetMatch = /(\d{1,2})\s*(?:cap\s*breakers?|breakers?)\b/i.exec(source);
    if (budgetMatch) {
      budget = Number(budgetMatch[1]);
      source = blank(source, budgetMatch.index, budgetMatch.index + budgetMatch[0].length);
    }
  }

  // Badge goals and the "no badges below" floor.
  {
    const floorMatch = /no\s+badges?\s+below\s+(bronze|silver|gold|hof|hall of fame|legend)\b/i.exec(source);
    if (floorMatch) {
      badgeFloor = parseTier(floorMatch[1]);
      source = blank(source, floorMatch.index, floorMatch.index + floorMatch[0].length);
    }
  }
  {
    const { aliases, pattern } = badgePattern(badgeNames);
    const patterns = [
      new RegExp(`(hall of fame|hof|legend|gold|silver|bronze)\\s+(${pattern})`, 'i'),
      new RegExp(`(${pattern})\\s+(hall of fame|hof|legend|gold|silver|bronze)`, 'i'),
    ];
    for (const regex of patterns) {
      let match;
      while ((match = regex.exec(source))) {
        const firstTier = parseTier(match[1]);
        const badgeText = firstTier ? match[2] : match[1];
        const tierText = firstTier ? match[1] : match[2];
        const name = aliases.get(badgeText.toLowerCase()) ?? badgeText;
        badges.push({ name, tier: parseTier(tierText) ?? 1, source: match[0] });
        source = blank(source, match.index, match.index + match[0].length);
      }
    }
    const contact = /\bcontact\s+dunks?\b/i.exec(source);
    if (contact) {
      badges.push({ name: aliases.get('contact dunks') ?? 'Posterizer', tier: 3, source: contact[0] });
      notes.push('contact dunks → Posterizer Gold');
      source = blank(source, contact.index, contact.index + contact[0].length);
    }
  }

  // Attribute targets.
  {
    const attr = attributePattern();
    const patterns = [
      { mode: 'max', regex: new RegExp(`(?:max(?:imize)?|as high as possible)\\s+(${attr})`, 'i'), order: 'attr' },
      { mode: 'min', regex: new RegExp(`(?:at least|minimum|min|>=|≥)\\s*(\\d{2,3})\\s*(?:on|in|to)?\\s*(${attr})`, 'i'), order: 'numberFirst' },
      { mode: 'min', regex: new RegExp(`(\\d{2,3})\\s*\\+\\s*(?:on|in|to)?\\s*(${attr})`, 'i'), order: 'numberFirst' },
      { mode: 'min', regex: new RegExp(`(\\d{2,3})\\s*(?:on|in|to)?\\s*(${attr})`, 'i'), order: 'numberFirst' },
      { mode: 'min', regex: new RegExp(`(${attr})\\s*(?:at least|minimum|min|>=|≥|to)\\s*(\\d{2,3})`, 'i'), order: 'attrFirst' },
    ];
    for (const { mode, regex, order } of patterns) {
      let match;
      while ((match = regex.exec(source))) {
        const attrText = order === 'attr' ? match[1] : order === 'numberFirst' ? match[2] : match[1];
        const numberText = order === 'attr' ? null : order === 'numberFirst' ? match[1] : match[2];
        const found = findAttribute(attrText);
        if (!found) {
          source = blank(source, match.index, match.index + match[0].length);
          continue;
        }
        for (const attribute of found.indices) {
          addTarget(attribute, numberText == null ? null : Number(numberText), mode);
        }
        source = blank(source, match.index, match.index + match[0].length);
      }
    }
  }

  // Leftovers become "I didn't understand" — never guessed into attributes.
  const unparsed = [];
  for (const chunk of source.split(/[,;.]|\band\b|\bwith\b|\bplus\b/i)) {
    const words = chunk
      .split(/\s+/)
      .map(word => word.replace(/^[^a-z0-9+]+|[^a-z0-9+]+$/gi, ''))
      .filter(Boolean)
      .filter(word => !STOP_WORDS.has(word.toLowerCase()));
    if (words.length) unparsed.push(words.join(' '));
  }

  // Merge duplicate attribute targets, keeping the highest request.
  const merged = new Map();
  for (const target of targets) {
    const previous = merged.get(target.attribute);
    if (!previous) {
      merged.set(target.attribute, { ...target });
      continue;
    }
    if (target.mode === 'max' || previous.mode === 'max') previous.mode = 'max';
    if (target.requested != null && (previous.requested == null || target.requested > previous.requested)) previous.requested = target.requested;
  }

  return {
    body,
    targets: [...merged.values()],
    breakers: { budget, assignments },
    badges,
    badgeFloor,
    unparsed: [...new Set(unparsed)],
    notes,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function validateSentence(parsed, { G, current }) {
  if (!G || !current) return { ok: false, message: 'The build engine is not ready.' };
  const heights = G.heightsFor(parsed.body.position ?? current.p) ?? [];
  if (!heights.length) return { ok: false, message: 'That position has no legal heights.' };
  let position = parsed.body.position ?? current.p;
  let height = parsed.body.height ?? current.h;
  const adjustments = [];
  if (!heights.includes(height)) {
    const closest = heights.reduce((best, value) => Math.abs(value - height) < Math.abs(best - height) ? value : best, heights[0]);
    adjustments.push(`Height ${height} is not legal for ${G.POSN?.[position] ?? 'this position'}; using ${closest}.`);
    height = closest;
  }
  const band = G.PB?.[position]?.[height] ?? G.PB?.[position]?.[String(height)] ?? { wmin: 100, wmax: 320 };
  let weight = parsed.body.weight ?? current.w;
  if (weight < band.wmin || weight > band.wmax) {
    const next = clamp(weight, band.wmin, band.wmax);
    adjustments.push(`Weight ${weight} lb is outside ${band.wmin}–${band.wmax} lb; using ${next}.`);
    weight = next;
  }
  let wingspan = parsed.body.wingspan;
  if (wingspan == null) wingspan = height + (parsed.body.wingspanOffset ?? (current.s - current.h));
  const wingspanMin = height;
  const wingspanMax = height + 6;
  if (wingspan < wingspanMin || wingspan > wingspanMax) {
    const next = clamp(wingspan, wingspanMin, wingspanMax);
    adjustments.push(`Wingspan ${wingspan}" is outside ${wingspanMin}–${wingspanMax}"; using ${next}".`);
    wingspan = next;
  }
  const caps = G.ceilingsFor(height, weight, wingspan);
  if (!Array.isArray(caps) || caps.length !== 21) return { ok: false, message: 'The engine could not calculate ceilings for that body.' };

  const sameBody = position === current.p && height === current.h && weight === current.w && wingspan === current.s;
  const base = sameBody ? current.alloc.slice() : G.upStart(caps, height - 63);
  const alloc = base.map((value, index) => clamp(value, 25, caps[index]));
  const targetAttributes = new Set();
  const targetRows = [];

  const applyTarget = (attribute, requested, mode, source) => {
    if (!Number.isInteger(attribute) || attribute < 0 || attribute > 20) return;
    targetAttributes.add(attribute);
    const cap = caps[attribute];
    const wanted = mode === 'max' ? cap : requested;
    const value = mode === 'max' ? cap : Math.min(cap, Math.max(alloc[attribute], Number(requested) || 0));
    alloc[attribute] = Math.max(alloc[attribute], value);
    targetRows.push({ attribute, requested: wanted, mode, source, base: base[attribute] ?? alloc[attribute], cap });
  };

  for (const target of parsed.targets) applyTarget(target.attribute, target.requested, target.mode, 'sentence');

  const badgeGoals = [];
  for (const goal of parsed.badges) {
    const index = (G.BADGES ?? []).findIndex(badge => String(badge?.[0]).toLowerCase() === String(goal.name).toLowerCase());
    if (index < 0) {
      badgeGoals.push({ ...goal, missing: true });
      continue;
    }
    const badge = G.BADGES[index];
    const requirements = badge?.[1]?.[goal.tier - 1] ?? [];
    const choices = requirements.map(([attribute, rating]) => ({ attribute, rating }));
    const isOr = !!badge?.[2];
    const chosen = isOr
      ? [choices.slice().sort((left, right) => (left.rating > caps[left.attribute] ? 1 : 0) - (right.rating > caps[right.attribute] ? 1 : 0) || left.rating - right.rating)[0]].filter(Boolean)
      : choices;
    for (const requirement of chosen) applyTarget(requirement.attribute, requirement.rating, 'min', `badge:${badge[0]}`);
    badgeGoals.push({ name: badge[0], tier: goal.tier, current: G.tierMetAt(index, alloc, height - 63), requirements: choices, isOr, chosen });
  }

  G.settle(alloc, height - 63, caps);
  let guard = 0;
  while (G.ratingOf(alloc, height - 63) >= 99 && guard < 500) {
    let changed = false;
    for (let index = 0; index < 21; index += 1) {
      if (targetAttributes.has(index) || alloc[index] <= 25) continue;
      alloc[index] -= 1;
      changed = true;
    }
    if (!changed) break;
    G.settle(alloc, height - 63, caps);
    guard += 1;
  }
  const raw = G.ratingOf(alloc, height - 63);
  const overall = G.overallOf(alloc, height - 63, caps);
  const trueOvr = G.trueOvr(alloc, height - 63);

  const rows = targetRows.map(row => {
    const actual = alloc[row.attribute];
    const reachable = actual >= row.requested;
    let reason = '';
    if (!reachable) {
      if (row.requested > row.cap) reason = `cap ${row.cap}`;
      else if (raw >= 99) reason = '99 wall';
      else reason = 'linked ratings';
    }
    return { ...row, actual, reachable, reason };
  });

  const assignmentSum = parsed.breakers.assignments.reduce((sum, item) => sum + item.amount, 0);
  const breakerLevel = parsed.breakers.budget ?? assignmentSum;
  const breakerShortfall = parsed.breakers.budget != null ? Math.max(0, assignmentSum - parsed.breakers.budget) : 0;
  const breakerTooHigh = breakerLevel > 26;
  const floor = parsed.badgeFloor;
  const tiers = typeof G.badgeTiersOf === 'function' ? G.badgeTiersOf(alloc, height - 63) : [];
  const belowFloor = floor == null ? [] : tiers.map((tier, index) => tier > 0 && tier < floor ? index : -1).filter(index => index >= 0);
  const hasContent = !!(parsed.body.position != null || parsed.body.height != null || parsed.body.weight != null || parsed.body.wingspan != null || parsed.targets.length || parsed.badges.length || parsed.breakers.budget != null || parsed.breakers.assignments.length || parsed.badgeFloor != null);

  return {
    ok: true,
    body: { p: position, h: height, w: weight, s: wingspan },
    caps,
    base,
    alloc,
    raw,
    overall,
    trueOvr,
    sameBody,
    startLabel: sameBody ? 'current build' : 'fresh 60 build at the requested body',
    adjustments,
    targetRows: rows,
    badgeGoals,
    badgeFloor: floor,
    belowFloor,
    breakerLevel,
    breakerShortfall,
    breakerTooHigh,
    hasContent,
    canApply: hasContent && !breakerTooHigh,
    unparsed: parsed.unparsed,
    notes: parsed.notes,
    candidate: { p: position, h: height, w: weight, s: wingspan, alloc },
  };
}

function node(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

export function mountBuildFromSentence(root, { getBuild, applyBuild, setBreakerLevel }) {
  const panel = node('section', 'panel build-from-sentence');
  panel.setAttribute('aria-label', 'Build from a sentence');
  const heading = node('h2', null, 'Build from a sentence');
  const intro = node('p', 'muted', 'Describe the build in plain English. Nothing changes until you press Apply to builder.');
  const textarea = document.createElement('textarea');
  textarea.className = 'inp sentence-input';
  textarea.rows = 3;
  textarea.placeholder = '6\'8" two-way wing, 90+ three, 88 perimeter D, contact dunks, 22 cap breakers';
  textarea.setAttribute('aria-label', 'Build description');
  const controls = node('div', 'fieldset sentence-controls');
  const review = node('button', 'btn primary', 'Review sentence');
  review.type = 'button';
  const clear = node('button', 'btn', 'Clear');
  clear.type = 'button';
  controls.append(review, clear);
  const status = node('p', 'muted sentence-status');
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  const reviewHost = node('div', 'sentence-review');
  reviewHost.setAttribute('aria-live', 'polite');
  panel.append(heading, intro, textarea, controls, status, reviewHost);
  root.append(panel);

  function placeholder(message = 'Type a request and press Review sentence. The review will show every target and anything it could not understand.') {
    reviewHost.replaceChildren(node('p', 'muted', message));
  }

  function render(parsed, result) {
    if (!result?.ok) {
      placeholder(result?.message ?? 'The sentence could not be validated.');
      return;
    }
    const lines = [];
    const body = result.body;
    const position = window.GBLE?.POSN?.[body.p] ?? `Position ${body.p}`;
    if (result.hasContent) {
      lines.push(node('p', 'sentence-body', `${position} · ${Math.floor(body.h / 12)}'${body.h % 12}" · ${body.w} lb · ${Math.floor(body.s / 12)}'${body.s % 12}" wingspan · starting from ${result.startLabel}`));
      if (result.adjustments.length) {
        const list = node('ul', 'list warn');
        list.append(...result.adjustments.map(message => node('li', null, message)));
        lines.push(list);
      }
    }
    if (parsed.unparsed.length) {
      lines.push(node('p', 'warn sentence-unparsed', `I didn't understand: ${parsed.unparsed.join(' · ')}`));
    }
    if (!result.targetRows.length && !result.badgeGoals.length && !result.hasContent) {
      lines.push(node('p', 'warn', 'No body, attribute, badge or breaker request was recognized. Nothing will be applied.'));
    }
    if (!result.hasContent) {
      reviewHost.replaceChildren(...lines);
      return;
    }
    if (result.targetRows.length) {
      const table = node('table', 'tbl sentence-targets');
      const thead = node('thead');
      const head = node('tr');
      for (const label of ['Attribute', 'Current', 'Requested', 'Cap', 'Result']) head.append(node('th', null, label));
      thead.append(head);
      const tbody = node('tbody');
      for (const row of result.targetRows) {
        const tr = node('tr');
        const name = window.GBLE?.ATTRS?.[row.attribute] ?? `Attribute ${row.attribute + 1}`;
        tr.append(
          node('td', null, name),
          node('td', null, String(row.base)),
          node('td', null, row.mode === 'max' ? `max ${row.requested}` : String(row.requested)),
          node('td', null, String(row.cap)),
          node('td', row.reachable ? 'ok' : 'warn', row.reachable ? 'reachable' : row.reason || 'not reachable'),
        );
        tbody.append(tr);
      }
      table.append(thead, tbody);
      const wrap = node('div', 'tbl-wrap');
      wrap.append(table);
      lines.push(wrap);
    }
    if (result.badgeGoals.length) {
      const list = node('ul', 'list sentence-badges');
      for (const goal of result.badgeGoals) {
        const tier = window.GBLE?.TIERNAME?.[goal.tier] ?? `Tier ${goal.tier}`;
        const text = goal.missing
          ? `${goal.name} ${tier}: badge not found`
          : `${goal.name} ${tier}: current ${window.GBLE?.TIERNAME?.[goal.current] ?? 'not earned'} · ${goal.chosen?.map(item => `${window.GBLE?.ATTRS?.[item.attribute] ?? item.attribute} ${item.rating}`).join(goal.isOr ? ' or ' : ' + ') ?? 'no requirements'}`;
        list.append(node('li', goal.missing ? 'warn' : null, text));
      }
      lines.push(node('h3', null, 'Badge goals'), list);
    }
    if (result.badgeFloor != null) {
      lines.push(node('p', result.belowFloor.length ? 'warn' : 'ok', `Badge floor: ${window.GBLE?.TIERNAME?.[result.badgeFloor] ?? result.badgeFloor} · ${result.belowFloor.length} badge${result.belowFloor.length === 1 ? '' : 's'} still below it in this candidate.`));
    }
    if (parsed.breakers.budget != null || parsed.breakers.assignments.length) {
      const budget = parsed.breakers.budget == null ? 'not stated' : String(parsed.breakers.budget);
      const assignments = parsed.breakers.assignments.map(item => `${item.amount} on ${window.GBLE?.ATTRS?.[item.attribute] ?? item.attribute}`).join(', ');
      const shortfall = result.breakerShortfall ? ` · shortfall ${result.breakerShortfall}` : '';
      lines.push(node('p', result.breakerShortfall || result.breakerTooHigh ? 'warn' : 'muted', `Breakers: budget ${budget}${assignments ? ` · ${assignments}` : ''}${shortfall}${result.breakerTooHigh ? ' · builder supports 0–26' : ''}`));
    }
    if (parsed.notes.length) lines.push(node('p', 'muted', parsed.notes.join(' · ')));
    const unreachableRows = result.targetRows.filter(row => !row.reachable);
    if (unreachableRows.length) {
      lines.push(node('p', 'warn', `Unreachable: ${unreachableRows.map(row => `${window.GBLE?.ATTRS?.[row.attribute] ?? row.attribute} ${row.requested} (${row.reason})`).join(' · ')}.`));
      lines.push(node('p', 'warn', 'Some requests cannot be met on this body. Apply will use the closest legal ratings shown above; nothing is clamped silently.'));
    }
    const actions = node('div', 'fieldset sentence-actions');
    const apply = node('button', 'btn primary', result.targetRows.some(row => !row.reachable) ? 'Apply closest legal build' : 'Apply to builder');
    apply.type = 'button';
    apply.disabled = !result.canApply;
    apply.addEventListener('click', () => {
      if (!result.canApply) return;
      const applied = applyBuild(result.candidate);
      if (!applied?.ok) {
        status.className = 'warn';
        status.textContent = applied?.message || 'The builder rejected the sentence build.';
        return;
      }
      if (result.breakerLevel > 0 && result.breakerLevel <= 26) setBreakerLevel?.(result.breakerLevel);
      window.__fbCommit?.();
      window.__fbSnapshot?.();
      status.className = 'ok';
      status.textContent = `Applied ${position} ${Math.floor(result.body.h / 12)}'${result.body.h % 12}" · ${result.overall} overall · ${result.trueOvr.toFixed(1)} true.`;
      reviewHost.prepend(node('p', 'ok', 'Applied. The build changed; use Undo or Cancel to leave this review.'));
    });
    const cancel = node('button', 'btn', 'Cancel');
    cancel.type = 'button';
    cancel.addEventListener('click', () => {
      reviewHost.replaceChildren();
      placeholder();
      status.className = 'muted';
      status.textContent = 'Review cancelled; the current build was not changed.';
    });
    actions.append(apply, cancel);
    if (!result.canApply) lines.push(node('p', 'warn', 'This request cannot be applied until the breaker budget is within 0–26.'));
    lines.push(actions);
    reviewHost.replaceChildren(...lines);
  }

  review.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) {
      placeholder('Type a sentence first.');
      status.textContent = '';
      return;
    }
    const parsed = parseSentence(text, { badgeNames: (window.GBLE?.BADGES ?? []).map(badge => badge[0]) });
    const result = validateSentence(parsed, { G: window.GBLE, current: getBuild() });
    render(parsed, result);
    status.className = 'muted';
    status.textContent = 'Review ready. Nothing has been applied.';
  });
  clear.addEventListener('click', () => {
    textarea.value = '';
    placeholder();
    status.textContent = 'Cleared.';
  });
  textarea.addEventListener('input', () => {
    if (reviewHost.querySelector('.sentence-actions')) {
      status.className = 'muted';
      status.textContent = 'Text changed; press Review sentence again to refresh this review.';
    }
  });
  placeholder();
  return { render };
}
