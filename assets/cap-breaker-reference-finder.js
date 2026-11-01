/*
 * Client for the public reference finder worker (`reference-finder-worker.js`).
 *
 * The worker exposes the original cap-breaker finder as the `b:parks` message.
 * It expects the same three values the reference page's controls used:
 *   attr  "" for every attribute, otherwise an index into the 21 attributes
 *   caps  number of cap breakers owned (0-26)
 *   tgt   "" for each frame's maximum target, otherwise a rating
 *
 * This module keeps the worker protocol, row validation and table filtering
 * separate from the page so both can be exercised without a browser DOM.
 */

export const ATTRIBUTE_NAMES = Object.freeze([
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

export const FREE_THROW_ATTRIBUTE = 7;
export const CAP_BREAKER_MAX = 26;
export const FINDER_TARGET_MIN = 60;
export const FINDER_TARGET_MAX = 99;

export function attributeName(index, names = ATTRIBUTE_NAMES) {
  return names[index] ?? ATTRIBUTE_NAMES[index] ?? `Attribute ${index}`;
}

export function heightLabel(inches) {
  const value = Number(inches);
  if (!Number.isFinite(value)) return '—';
  return `${Math.floor(value / 12)}'${value % 12}"`;
}

export function positionName(index, positions) {
  return positions?.[index] ?? `Position ${index}`;
}

export function rowKey(row) {
  return `${row.p}|${row.h}|${row.a}|${row.tgt}|${row.park}|${row.land}`;
}

/**
 * Accept only complete, in-range rows. The reference worker also emits a few
 * extra fields (pt, verified) that the message bridge drops; they are optional.
 */
export function normalizeRow(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = Number(raw.p);
  const h = Number(raw.h);
  const a = Number(raw.a);
  const tgt = Number(raw.tgt);
  const land = Number(raw.land);
  const park = Number(raw.park);
  const free = Number(raw.free);
  if (![p, h, a, tgt, land, park, free].every(Number.isFinite)) return null;
  if (!Number.isInteger(p) || p < 0 || p > 4) return null;
  if (!Number.isInteger(h) || h < 60 || h > 99) return null;
  if (!Number.isInteger(a) || a < 0 || a > 20) return null;
  if (tgt < 25 || tgt > 99 || land < 25 || land > 99 || park < 25 || park > 99) return null;
  return { p, h, a, tgt, land, park, free };
}

export function normalizeRows(rows) {
  const seen = new Set();
  const out = [];
  for (const raw of Array.isArray(rows) ? rows : []) {
    const row = normalizeRow(raw);
    if (!row) continue;
    const key = rowKey(row);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

/**
 * @param {object} filters
 * @param {number|null} [filters.position]
 * @param {number|null} [filters.height]
 * @param {number|null} [filters.attribute]
 * @param {number|null} [filters.targetMin]
 * @param {number|null} [filters.targetMax]
 * @param {number|null} [filters.freeMin]
 */
export function filterRows(rows, filters = {}) {
  const { position = null, height = null, attribute = null, targetMin = null, targetMax = null, freeMin = null } = filters;
  return (Array.isArray(rows) ? rows : []).filter(row => {
    if (position !== null && row.p !== position) return false;
    if (height !== null && row.h !== height) return false;
    if (attribute !== null && row.a !== attribute) return false;
    if (targetMin !== null && row.tgt < targetMin) return false;
    if (targetMax !== null && row.tgt > targetMax) return false;
    if (freeMin !== null && row.free < freeMin) return false;
    return true;
  });
}

export const SORT_MODES = Object.freeze([
  ['free', 'Free points'],
  ['target', 'Target rating'],
  ['park', 'Starting value'],
  ['height', 'Height'],
  ['attribute', 'Attribute'],
]);

export function sortRows(rows, mode = 'free') {
  const out = [...(Array.isArray(rows) ? rows : [])];
  switch (mode) {
    case 'target':
      return out.sort((a, b) => b.tgt - a.tgt || b.free - a.free || a.p - b.p || a.h - b.h);
    case 'park':
      return out.sort((a, b) => a.park - b.park || b.land - a.land || a.p - b.p || a.h - b.h);
    case 'height':
      return out.sort((a, b) => a.h - b.h || a.p - b.p || b.tgt - a.tgt);
    case 'attribute':
      return out.sort((a, b) => a.a - b.a || b.tgt - a.tgt || a.p - b.p || a.h - b.h);
    case 'free':
    default:
      return out.sort((a, b) => b.free - a.free || b.land - a.land || a.p - b.p || a.h - b.h);
  }
}

/**
 * Validate the values that produce a new worker query. Position/height/sort are
 * client-side filters and deliberately not part of this check.
 */
export function validateFinderQuery({ caps, attr = null, tgt = null } = {}) {
  const capCount = Number(caps);
  if (!Number.isInteger(capCount) || capCount < 0 || capCount > CAP_BREAKER_MAX) {
    return { ok: false, message: `Cap breakers must be a whole number from 0 to ${CAP_BREAKER_MAX}.` };
  }
  if (attr !== null && attr !== undefined && attr !== '') {
    const index = Number(attr);
    if (!Number.isInteger(index) || index < 0 || index > 20) {
      return { ok: false, message: 'Choose one of the 21 attributes.' };
    }
    if (index === FREE_THROW_ATTRIBUTE) {
      return { ok: false, message: 'Free Throw is not on the cap-breaker ladder, so the reference finder skips it.' };
    }
    attr = index;
  } else {
    attr = null;
  }
  if (tgt !== null && tgt !== undefined && tgt !== '') {
    const value = Number(tgt);
    if (!Number.isInteger(value) || value < FINDER_TARGET_MIN || value > FINDER_TARGET_MAX) {
      return { ok: false, message: `Target rating must be a whole number from ${FINDER_TARGET_MIN} to ${FINDER_TARGET_MAX}, or blank for each frame's maximum.` };
    }
    tgt = value;
  } else {
    tgt = null;
  }
  return { ok: true, query: { caps: capCount, attr, tgt } };
}

export function queryKey({ caps, attr, tgt }) {
  return `${caps}|${attr ?? ''}|${tgt ?? ''}`;
}

export const REFERENCE_WORKER_URL = './reference-finder-worker.js';

export function defaultCreateWorker(url = REFERENCE_WORKER_URL) {
  if (typeof Worker === 'undefined') throw new Error('this browser cannot start a web worker');
  // The reference worker is a classic script (it installs its own onmessage).
  return new Worker(new URL(url, import.meta.url));
}

/**
 * @param {object} [options]
 * @param {(url: string) => Worker} [options.createWorker]
 * @param {number} [options.timeoutMs]
 */
export function createCapBreakerFinder({ createWorker = defaultCreateWorker, timeoutMs = 20000 } = {}) {
  let worker = null;
  let nextId = 1;
  const pending = new Map();

  function failAll(error) {
    for (const entry of pending.values()) {
      clearTimeout(entry.timer);
      entry.reject(error);
    }
    pending.clear();
    if (worker) {
      try { worker.terminate?.(); } catch { /* already gone */ }
    }
    worker = null;
  }

  function ensureWorker() {
    if (worker) return worker;
    worker = createWorker(REFERENCE_WORKER_URL);
    worker.onmessage = event => {
      const data = event?.data ?? {};
      const entry = pending.get(data.id);
      if (!entry) return;
      if (data.type === 'b:parks') {
        clearTimeout(entry.timer);
        pending.delete(data.id);
        const rows = normalizeRows(data.rows);
        entry.resolve({ id: data.id, rows });
      } else if (data.type === 'b:err' || data.type === 'error') {
        clearTimeout(entry.timer);
        pending.delete(data.id);
        entry.reject(new Error(String(data.msg || 'the reference finder worker returned an error')));
      }
    };
    worker.onerror = event => {
      const message = event?.message || 'the reference finder worker failed to start';
      failAll(new Error(message));
    };
    worker.onmessageerror = () => failAll(new Error('the reference finder worker sent a message this page could not read'));
    return worker;
  }

  function findParks(request) {
    const started = Date.now();
    let active;
    try {
      active = ensureWorker();
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error(String(error)));
    }
    const id = nextId++;
    const message = {
      type: 'b:parks',
      id,
      attr: request.attr === null || request.attr === undefined ? '' : String(request.attr),
      caps: Number(request.caps),
      tgt: request.tgt === null || request.tgt === undefined ? '' : String(request.tgt),
    };
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`the reference finder worker did not answer within ${timeoutMs} ms`));
      }, timeoutMs);
      pending.set(id, {
        timer,
        resolve: result => resolve({ ...result, ms: Date.now() - started, query: message }),
        reject,
      });
      try {
        active.postMessage(message);
      } catch (error) {
        clearTimeout(timer);
        pending.delete(id);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  function dispose() {
    failAll(new Error('the finder was closed'));
  }

  return { findParks, dispose, get active() { return worker; } };
}
