// Validate every build against the same body, linked-attribute and 99-wall
// calculations used by the reference engine. A rejected build is never applied.
export const OVERALL_LIMIT = 99;
// The shipped engine indexes its 31 height bands from 5'3" (63 inches).
export const heightBucket = height => Math.max(0, Math.min(30, height - 63));

const integer = value => Number.isInteger(value) && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function prepareBuild(input, kernel, engine, { adjustBody = false, clampAttributes = false, allowOverWall = false } = {}) {
  if (!engine || typeof engine.settle !== 'function' || typeof engine.ratingOf !== 'function') {
    return { ok: false, message: 'The build rules could not load. Try reloading the page.' };
  }
  if (!input || !integer(input.p) || input.p < 0 || input.p > 4) {
    return { ok: false, message: 'Choose a valid position.' };
  }
  const bands = kernel.bands(input.p);
  if (!bands.length) return { ok: false, message: 'No legal frames are available for this position.' };
  let { h, w, s } = input;
  if (![h, w, s].every(integer)) return { ok: false, message: 'Height, weight and wingspan must be whole numbers.' };
  let band = bands.find(row => row.h === h);
  if (!band && adjustBody) band = bands.reduce((best, row) => Math.abs(row.h - h) < Math.abs(best.h - h) ? row : best);
  if (!band) return { ok: false, message: 'That height is not legal for this position.' };
  if (adjustBody) {
    h = band.h;
    w = clamp(w, band.wmin, band.wmax);
    s = clamp(s, h, h + 6);
  }
  if (w < band.wmin || w > band.wmax || s < h || s > h + 6) {
    return { ok: false, message: 'Weight or wingspan is outside the legal range for this frame.' };
  }
  if (!Array.isArray(input.alloc) || input.alloc.length !== 21 || !input.alloc.every(integer)) {
    return { ok: false, message: 'A build must contain 21 whole-number attributes.' };
  }
  const caps = kernel.W(h, w, s);
  if (!Array.isArray(caps) || caps.length !== 21 || caps.some(value => !integer(value) || value < 25 || value > 99)) {
    return { ok: false, message: 'Attribute ceilings are unavailable for this frame.' };
  }
  let alloc = [...input.alloc];
  if (clampAttributes) alloc = alloc.map((value, index) => clamp(value, 25, caps[index]));
  if (alloc.some((value, index) => value < 25 || value > caps[index])) {
    return { ok: false, message: 'An attribute is outside this frame’s legal limits.' };
  }
  engine.settle(alloc, heightBucket(h), caps);
  if (alloc.some((value, index) => !integer(value) || value < 25 || value > caps[index])) {
    return { ok: false, message: 'Linked attributes cannot fit within this frame’s ceilings.' };
  }
  const overall = engine.ratingOf(alloc, heightBucket(h));
  if (!Number.isFinite(overall) || (!allowOverWall && overall >= OVERALL_LIMIT)) {
    return { ok: false, message: 'This build exceeds the 99 overall limit. Lower an attribute first.' };
  }
  return { ok: true, build: { ...input, h, w, s, alloc }, caps, overall, adjusted: h !== input.h || w !== input.w || s !== input.s || alloc.some((value, index) => value !== input.alloc[index]) };
}

export function editAttribute(current, index, requested, kernel, engine) {
  if (!integer(index) || index < 0 || index >= 21 || !Number.isFinite(Number(requested)) || requested === '') {
    return { ok: false, message: 'Enter a whole-number attribute rating.' };
  }
  const caps = kernel.W(current.h, current.w, current.s);
  const target = clamp(Math.round(Number(requested)), 25, caps[index]);
  const attempt = value => {
    const alloc = [...current.alloc];
    alloc[index] = value;
    return prepareBuild({ ...current, alloc }, kernel, engine);
  };
  let result = attempt(target);
  if (!result.ok && target > current.alloc[index]) {
    // Linked attributes can also rise. Find the largest legal value for this edit.
    let low = current.alloc[index], high = target - 1;
    result = attempt(low);
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      const candidate = attempt(mid);
      if (candidate.ok) { low = mid; result = candidate; } else high = mid - 1;
    }
  }
  if (!result.ok) return result;
  const actual = result.build.alloc[index];
  const limited = actual !== Math.round(Number(requested));
  const linked = result.build.alloc.some((value, i) => i !== index && value !== current.alloc[i]);
  return { ...result, limited, message: limited ? `Adjusted to ${actual} to respect attribute limits, linked ratings and the 99 overall wall.` : linked ? 'Linked attribute ratings were updated.' : '' };
}

// Apply a set of attribute targets through the same validated edit path used
// by the sliders. Targets that cannot fit under the frame ceilings, linked
// ratings or the 99 wall are reported instead of being written anyway.
export function writeTargets(current, targets, kernel, engine, { onlyRaise = false } = {}) {
  let build = current;
  const limited = [];
  let written = 0;
  for (const [key, value] of Object.entries(targets ?? {})) {
    const index = Number(key);
    const requested = onlyRaise ? Math.max(build.alloc[index] ?? 25, Number(value)) : value;
    const result = editAttribute(build, index, requested, kernel, engine);
    if (!result.ok) {
      limited.push(index);
      continue;
    }
    build = result.build;
    if (result.limited) limited.push(index);
    else written++;
  }
  return { ok: true, build, written, limited };
}

// Fit special reference cards into the normal builder without pretending the
// original ratings are legal. Preserve their proportions as closely as the
// 99 wall permits and return the adjusted allocation for the user to review.
export function fitBuild(input, kernel, engine) {
  if (!input || !integer(input.p) || input.p < 0 || input.p > 4 ||
      ![input.h, input.w, input.s].every(integer) || !Array.isArray(input.alloc) ||
      input.alloc.length !== 21 || !input.alloc.every(integer)) {
    return { ok: false, message: 'This reference card has incomplete build data.' };
  }
  const baseline = prepareBuild({ ...input, alloc: Array(21).fill(25) }, kernel, engine, { adjustBody: true });
  if (!baseline.ok) return baseline;
  const body = baseline.build;
  const targets = input.alloc.map((value, index) => clamp(value, 25, baseline.caps[index]));
  const attempt = scale => prepareBuild({ ...body, alloc: targets.map(value => 25 + Math.floor((value - 25) * scale / 10000)) }, kernel, engine);
  let low = 0, high = 10000, best = baseline;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    const result = attempt(mid);
    if (result.ok) { low = mid; best = result; } else high = mid - 1;
  }
  return best;
}

// The reference finder sometimes returns a cap-max row whose raw overall is
// over the wall even though its target is valid. Lower only the attributes the
// user did not ask for until the row fits, keeping every target intact.
export function fitTargets(input, targets, kernel, engine) {
  const base = prepareBuild(input, kernel, engine, { adjustBody: true, clampAttributes: true, allowOverWall: true });
  if (!base.ok) return base;
  const protectedIndexes = new Set(Object.keys(targets ?? {}).map(Number));
  let alloc = [...base.build.alloc];
  for (let guard = 0; guard < 200; guard++) {
    const checked = prepareBuild({ ...base.build, alloc }, kernel, engine, { allowOverWall: true });
    if (!checked.ok) return checked;
    alloc = [...checked.build.alloc];
    if (checked.overall < OVERALL_LIMIT) {
      const missesTarget = Object.entries(targets ?? {}).some(([index, value]) => (alloc[Number(index)] ?? 0) < Number(value));
      return missesTarget ? { ok: false, message: 'The finder result cannot keep its targets under the 99 overall wall.' } : { ...checked, build: { ...checked.build, alloc } };
    }
    let changed = false;
    for (let index = 0; index < 21; index++) {
      if (protectedIndexes.has(index) || alloc[index] <= 25) continue;
      alloc[index] -= 1;
      changed = true;
    }
    if (!changed) break;
  }
  return { ok: false, message: 'The finder result cannot be fitted under the 99 overall wall.' };
}

export function loadBuildRules() {
  if (globalThis.GBLE?.settle && globalThis.GBLE?.ratingOf && globalThis.GBLE?.overallOf) return Promise.resolve(globalThis.GBLE);
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/assets/lab-engine.js';
    script.onload = () => globalThis.GBLE?.settle && globalThis.GBLE?.ratingOf && globalThis.GBLE?.overallOf ? resolve(globalThis.GBLE) : reject(new Error('Build rules did not initialize.'));
    script.onerror = () => reject(new Error('Could not load build rules.'));
    document.head.append(script);
  });
}

function badgeTier(badge, alloc) {
  for (let tier = 4; tier >= 1; tier--) {
    const requirements = badge[1]?.[tier - 1] ?? [];
    if (!requirements.length) continue;
    const matches = ([index, value]) => (alloc[index] ?? 0) >= value;
    if ((badge[2] || requirements.length === 1) ? requirements.some(matches) : requirements.every(matches)) return tier;
  }
  return 0;
}

// Finder and solver results are untrusted until their complete build has been
// checked. For min-max, also check the badge promise against the actual result.
export function filterSolverResults(rows, current, kernel, engine, { preserveBadges = false, sameFrame = false, requireGain = false } = {}) {
  const badges = kernel.env.badges?.badges ?? [];
  const originalTiers = preserveBadges ? badges.map(badge => badgeTier(badge, current.alloc)) : [];
  return (Array.isArray(rows) ? rows : []).filter(row => {
    if (!Array.isArray(row?.body) || !Array.isArray(row.alloc)) return false;
    if (sameFrame && (row.pos !== current.p || row.body[0] !== current.h || row.body[1] !== current.w || row.body[2] !== current.s)) return false;
    const checked = prepareBuild({ p: row.pos, h: row.body[0], w: row.body[1], s: row.body[2], alloc: row.alloc }, kernel, engine);
    if (!checked.ok || checked.adjusted) return false;
    if (current.lock?.some((locked, i) => locked && row.alloc[i] !== current.alloc[i])) return false;
    if (preserveBadges) {
      const tiers = badges.map(badge => badgeTier(badge, row.alloc));
      if (tiers.some((tier, i) => tier < originalTiers[i])) return false;
      if (requireGain && !tiers.some((tier, i) => tier > originalTiers[i])) return false;
    }
    return true;
  });
}
