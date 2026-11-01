/**
 * Builder → recovered reference finder bridge.
 *
 * The builder's own worker `find` handler can return allocations that exceed
 * the 99 wall while labelling them overall 99, so the builder validation drops
 * every row. The public reference finder worker produces legal allocations, so
 * the builder uses that worker and validates its rows again before display.
 */

import { findReferenceBuilds } from './reference-finder.mjs';

export const BUILDER_FINDER_ATTRIBUTES = Object.freeze([
  'Close Shot',
  'Driving Layup',
  'Driving Dunk',
  'Standing Dunk',
  'Post Control',
  'Mid-Range',
  'Three-Point',
  'Free Throw',
  'Pass Accuracy',
  'Ball Handle',
  'Speed w/ Ball',
  'Interior D',
  'Perimeter D',
  'Steal',
  'Block',
  'Off Rebound',
  'Def Rebound',
  'Speed',
  'Agility',
  'Strength',
  'Vertical',
]);

export const BUILDER_FINDER_POSITIONS = Object.freeze(['PG', 'SG', 'SF', 'PF', 'C']);

function wholeNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : null;
}

/**
 * Map the builder's finder controls to the reference finder worker payload.
 *
 * `targets` is the 21-slot array from the builder (0 means no target). Locked
 * attributes become minimum targets: the reference finder has no exact-lock
 * control, so the builder validates the returned rows afterwards.
 */
export function builderFinderPayload({
  position,
  anyPosition,
  height,
  wingspan,
  targets,
  locks,
  currentAlloc,
  caps,
} = {}) {
  const attrs = {};
  for (let index = 0; index < BUILDER_FINDER_ATTRIBUTES.length; index += 1) {
    const target = wholeNumber(targets?.[index]);
    if (target !== null && target > 0) {
      attrs[BUILDER_FINDER_ATTRIBUTES[index]] = Math.max(25, Math.min(99, target));
    }
  }
  if (Array.isArray(locks)) {
    for (let index = 0; index < BUILDER_FINDER_ATTRIBUTES.length; index += 1) {
      if (!locks[index]) continue;
      const current = wholeNumber(currentAlloc?.[index]);
      if (current === null || current <= 0) continue;
      const name = BUILDER_FINDER_ATTRIBUTES[index];
      attrs[name] = Math.max(attrs[name] ?? 0, Math.max(25, Math.min(99, current)));
    }
  }

  const heightValue = wholeNumber(height);
  const wingspanValue = wholeNumber(wingspan);
  const capValue = wholeNumber(caps);

  return {
    pos: BUILDER_FINDER_POSITIONS[position] ?? 'PG',
    anyPos: !!anyPosition,
    poss: null,
    attrs,
    fmode: {},
    btw: {},
    land: {},
    maxv: {},
    kmax: {},
    caps: capValue === null ? 'auto' : Math.max(0, Math.min(26, capValue)),
    lean: false,
    hard: false,
    spez: null,
    capcat: null,
    hmin: null,
    hmax: null,
    hset: heightValue === null ? null : [heightValue],
    wsmin: wingspanValue,
    wsmax: wingspanValue,
    comm: null,
  };
}

export async function runBuilderFinder(payload, options = {}) {
  const result = await findReferenceBuilds(payload, options);
  return {
    rows: Array.isArray(result.res) ? result.res : [],
    ms: Number(result.ms) || 0,
    caps: result.caps,
    notes: result.notes ?? [],
    skipped: result.skipped ?? [],
    raised: result.raised ?? null,
    engine: 'reference',
  };
}
