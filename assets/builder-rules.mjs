// Validate every build against the same body, linked-attribute and 99-wall
// calculations used by the reference engine. A rejected build is never applied.
export const OVERALL_LIMIT = 99;

const integer = value => Number.isInteger(value) && Number.isFinite(value);
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function prepareBuild(input, kernel, engine, { adjustBody = false, clampAttributes = false } = {}) {
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
  engine.settle(alloc, h, caps);
  if (alloc.some((value, index) => !integer(value) || value < 25 || value > caps[index])) {
    return { ok: false, message: 'Linked attributes cannot fit within this frame’s ceilings.' };
  }
  const overall = engine.ratingOf(alloc, input.p);
  if (!Number.isFinite(overall) || overall >= OVERALL_LIMIT) {
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
