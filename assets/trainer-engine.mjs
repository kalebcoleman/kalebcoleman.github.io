/**
 * Free Builder · Jumpshot Practice Lab
 *
 * Browser-local timing, calibration, drill and recommendation logic.
 *
 * Provenance and honesty:
 * - The shot-setting vocabulary follows the recovered Free Builder Jumpshot Lab
 *   shape in assets/jumpshots-Be1L50o9.js (jType, jBase, jR1, jR2, jSpeed,
 *   jInput, jCue, jDiff, jSpot, jHand, jSprint, jMeterOn, jMeterIn, ...).
 * - The reference behaviour inventory comes from docs/goated-build-lab-research.md:
 *   trainer, shot timing feedback, meter/shot settings, free throws, calibration
 *   and recommendations.
 * - Every target, window and score in this module is an ESTIMATE for local
 *   practice. Nothing here is an NBA 2K measurement, a captured game tuning
 *   table, or a simulation of 2K shot physics.
 *
 * The module has no DOM, network, storage or package dependencies so that it
 * can be tested directly with Node's built-in test runner.
 */

export const SCHEMA_VERSION = 1;
export const STATE_SCHEMA = 'free-builder-jumpshot-trainer';
export const STORAGE_KEY = 'fb.jumpshotTrainer.v1';
export const ATTEMPT_LIMIT = 500;
export const MIN_CALIBRATION_SAMPLES = 6;
export const MAX_OFFSET_MS = 120;

export const TABS = Object.freeze([
  'shooting',
  'free-throws',
  'calibration',
  'recommendations',
  'setup',
]);

export const SHOT_TYPES = Object.freeze([
  'Jump Shot',
  'Set Shot',
  'Fade',
  'Hop',
  'Pull-Up',
  'Free Throw',
]);
export const SPEEDS = Object.freeze(['Very Slow', 'Slow', 'Normal', 'Quick', 'Very Quick']);
export const INPUTS = Object.freeze(['Shot', 'Stick']);
export const VISUAL_CUES = Object.freeze(['Release', 'Push', 'Set Point', 'Jump', 'Late']);
export const DIFFICULTY_NAMES = Object.freeze(['Easy', 'Normal', 'Hard']);
export const CONTEXTS = Object.freeze(['Standing', 'Moving', 'Off-Screen', 'Post']);
export const HANDS = Object.freeze(['Right', 'Left']);
export const SPRINTS = Object.freeze(['Off', 'On']);
export const METER_STATES = Object.freeze(['On', 'Off']);
export const METER_SIDES = Object.freeze(['Top', 'Bottom', 'Side']);
export const MODES = Object.freeze(['jump', 'freeThrow', 'calibration']);

export const MODE_LABELS = Object.freeze({
  jump: 'Jump shot',
  freeThrow: 'Free throw',
  calibration: 'Calibration rep',
});

export const RESULT_META = Object.freeze({
  green: { label: 'Green', tone: 'green', clean: true, points: 100 },
  'slightly-early': { label: 'Slightly early', tone: 'warm', clean: false, points: 72 },
  'slightly-late': { label: 'Slightly late', tone: 'warm', clean: false, points: 72 },
  early: { label: 'Early', tone: 'miss', clean: false, points: 28 },
  late: { label: 'Late', tone: 'miss', clean: false, points: 28 },
  'very-early': { label: 'Very early', tone: 'miss', clean: false, points: 0 },
  'very-late': { label: 'Very late', tone: 'miss', clean: false, points: 0 },
});

export const DIFFICULTY_WINDOWS_MS = Object.freeze({ Easy: 132, Normal: 92, Hard: 64 });
export const SPEED_DELTAS_MS = Object.freeze({
  'Very Slow': 120,
  Slow: 60,
  Normal: 0,
  Quick: -60,
  'Very Quick': -110,
});
export const CONTEXT_DELTAS_MS = Object.freeze({
  Standing: 0,
  Moving: 45,
  'Off-Screen': 75,
  Post: -30,
});
export const BASE_IDEAL_MS = Object.freeze({
  'Jump Shot': 620,
  'Set Shot': 560,
  Fade: 690,
  Hop: 600,
  'Pull-Up': 640,
  'Free Throw': 495,
});
export const CUE_LEADS_MS = Object.freeze({
  Release: 80,
  Push: 120,
  'Set Point': 170,
  Jump: 215,
  Late: 35,
});

export const DEFAULT_SETTINGS = Object.freeze({
  shotType: 'Jump Shot',
  base: '',
  release1: '',
  release2: 'None',
  speed: 'Normal',
  input: 'Shot',
  cue: 'Release',
  difficulty: 'Normal',
  context: 'Standing',
  hand: 'Right',
  sprint: 'Off',
  meter: 'On',
  meterSide: 'Bottom',
  cueBar: 1,
  freeThrowRating: 85,
  sound: true,
  autoAdvance: false,
  offsetMs: 0,
});

export const SETTING_LABELS = Object.freeze({
  shotType: 'Shot type',
  base: 'Base',
  release1: 'Release 1',
  release2: 'Release 2',
  speed: 'Speed',
  input: 'Input',
  cue: 'Visual cue',
  difficulty: 'Difficulty',
  context: 'Context',
  hand: 'Hand',
  sprint: 'Sprint',
  meter: 'Shot meter',
  meterSide: 'Meter placement',
  cueBar: 'Cue bar band',
  freeThrowRating: 'Free-throw rating',
  sound: 'Audio cue',
  autoAdvance: 'Auto-advance',
  offsetMs: 'Calibration offset',
});

const LEGACY_KEYS = Object.freeze({
  jType: 'shotType',
  jBase: 'base',
  jR1: 'release1',
  jR2: 'release2',
  jSpeed: 'speed',
  jInput: 'input',
  jCue: 'cue',
  jDiff: 'difficulty',
  jSpot: 'context',
  jHand: 'hand',
  jSprint: 'sprint',
  jMeterOn: 'meter',
  jMeterIn: 'meterSide',
  jFtRating: 'freeThrowRating',
  jCueBar: 'cueBar',
  jCueSnap: 'cueBar',
});

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function asNumber(value) {
  const number = typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  return typeof number === 'number' && Number.isFinite(number) ? number : null;
}

function pickChoice(value, choices, fallback) {
  return typeof value === 'string' && choices.includes(value) ? value : fallback;
}

function pickText(value, fallback, maxLength = 120) {
  if (typeof value !== 'string') return fallback;
  const text = value.trim();
  return text ? text.slice(0, maxLength) : fallback;
}

function pickBoolean(value, fallback) {
  if (typeof value === 'boolean') return value;
  if (value === 'On' || value === 'on' || value === 1 || value === '1') return true;
  if (value === 'Off' || value === 'off' || value === 0 || value === '0') return false;
  return fallback;
}

function pickMode(value) {
  return MODES.includes(value) ? value : 'jump';
}

function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function standardDeviation(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/** Normalize a settings object, including the recovered j*-shaped keys. */
export function normalizeSettings(input = {}) {
  const source = input && typeof input === 'object' ? input : {};
  const aliased = { ...source };
  for (const [legacyKey, key] of Object.entries(LEGACY_KEYS)) {
    if (source[legacyKey] === undefined) continue;
    if (legacyKey === 'jCue' && typeof source[legacyKey] === 'number') continue;
    aliased[key] = source[legacyKey];
  }

  let cueBar = asNumber(aliased.cueBar);
  if (cueBar === null) {
    cueBar = asNumber(source.jCue) ?? asNumber(source.jCueSnap) ?? DEFAULT_SETTINGS.cueBar;
  }

  const freeThrowRating = asNumber(aliased.freeThrowRating);
  const offsetMs = asNumber(aliased.offsetMs);

  return {
    shotType: pickChoice(aliased.shotType, SHOT_TYPES, DEFAULT_SETTINGS.shotType),
    base: pickText(aliased.base, DEFAULT_SETTINGS.base),
    release1: pickText(aliased.release1, DEFAULT_SETTINGS.release1),
    release2: pickText(aliased.release2, DEFAULT_SETTINGS.release2),
    speed: pickChoice(aliased.speed, SPEEDS, DEFAULT_SETTINGS.speed),
    input: pickChoice(aliased.input, INPUTS, DEFAULT_SETTINGS.input),
    cue: pickChoice(aliased.cue, VISUAL_CUES, DEFAULT_SETTINGS.cue),
    difficulty: pickChoice(aliased.difficulty, DIFFICULTY_NAMES, DEFAULT_SETTINGS.difficulty),
    context: pickChoice(aliased.context, CONTEXTS, DEFAULT_SETTINGS.context),
    hand: pickChoice(aliased.hand, HANDS, DEFAULT_SETTINGS.hand),
    sprint: pickChoice(aliased.sprint, SPRINTS, DEFAULT_SETTINGS.sprint),
    meter: pickChoice(aliased.meter, METER_STATES, DEFAULT_SETTINGS.meter),
    meterSide: pickChoice(aliased.meterSide, METER_SIDES, DEFAULT_SETTINGS.meterSide),
    cueBar: Math.round(clamp(cueBar ?? DEFAULT_SETTINGS.cueBar, 0, 3)),
    freeThrowRating: Math.round(clamp(freeThrowRating ?? DEFAULT_SETTINGS.freeThrowRating, 25, 99)),
    sound: pickBoolean(aliased.sound, DEFAULT_SETTINGS.sound),
    autoAdvance: pickBoolean(aliased.autoAdvance, DEFAULT_SETTINGS.autoAdvance),
    offsetMs: Math.round(clamp(offsetMs ?? DEFAULT_SETTINGS.offsetMs, -MAX_OFFSET_MS, MAX_OFFSET_MS)),
  };
}

export function settingsEqual(left, right) {
  const a = normalizeSettings(left);
  const b = normalizeSettings(right);
  return Object.keys(DEFAULT_SETTINGS).every((key) => a[key] === b[key]);
}

/**
 * A stable estimate for the selected setup. This is a local practice target,
 * not a capture or a claim about NBA 2K's internal timing.
 */
export function estimateProfile(settings, mode = 'jump') {
  const s = normalizeSettings(settings);
  const safeMode = pickMode(mode);
  const shotType = safeMode === 'freeThrow'
    ? 'Free Throw'
    : safeMode === 'calibration'
      ? 'Jump Shot'
      : s.shotType;
  const context = safeMode === 'freeThrow' || safeMode === 'calibration' ? 'Standing' : s.context;
  const baseIdeal = BASE_IDEAL_MS[shotType] ?? BASE_IDEAL_MS['Jump Shot'];
  const speedDelta = SPEED_DELTAS_MS[s.speed] ?? 0;
  const contextDelta = safeMode === 'freeThrow' || safeMode === 'calibration'
    ? 0
    : CONTEXT_DELTAS_MS[context] ?? 0;
  const cueBarLead = s.cueBar * 10;
  const cueLeadMs = (CUE_LEADS_MS[s.cue] ?? CUE_LEADS_MS.Release) + cueBarLead;
  const rawIdealMs = clamp(Math.round(baseIdeal + speedDelta + contextDelta), 240, 1400);
  const targetMs = clamp(rawIdealMs - s.offsetMs, 240, 1400);
  const cueMs = clamp(targetMs - cueLeadMs, 20, targetMs - 1);
  const windowMs = DIFFICULTY_WINDOWS_MS[s.difficulty] ?? DIFFICULTY_WINDOWS_MS.Normal;
  const maxMs = Math.round(Math.max(targetMs * 1.6, targetMs + windowMs * 2.5));

  return {
    mode: safeMode,
    shotType,
    context,
    speed: s.speed,
    difficulty: s.difficulty,
    rawIdealMs,
    targetMs,
    cueMs,
    cueLeadMs,
    windowMs,
    halfWindowMs: windowMs / 2,
    maxMs,
    offsetMs: s.offsetMs,
    meterOn: s.meter === 'On',
    meterSide: s.meterSide,
    estimated: true,
    disclaimer: 'Estimated local practice timing; not an NBA 2K measurement.',
  };
}

/** Create one shot with a small, seeded-or-random timing jitter. */
export function createShot(settings, mode = 'jump', random = Math.random) {
  const profile = estimateProfile(settings, mode);
  const rng = typeof random === 'function' ? random : Math.random;
  const jitterMs = Math.round((clamp(Number(rng()), 0, 1) - 0.5) * 44);
  const rawIdealMs = clamp(profile.rawIdealMs + jitterMs, 240, 1400);
  const targetMs = clamp(rawIdealMs - profile.offsetMs, 240, 1400);
  const cueMs = clamp(targetMs - profile.cueLeadMs, 20, targetMs - 1);
  const maxMs = Math.round(Math.max(targetMs * 1.6, targetMs + profile.windowMs * 2.5));

  return {
    ...profile,
    rawIdealMs,
    targetMs,
    cueMs,
    maxMs,
    jitterMs,
    startedAt: null,
    estimated: true,
  };
}

export function evaluateRelease(shot, releaseMs) {
  const targetMs = asNumber(shot?.targetMs) ?? 0;
  const windowMs = asNumber(shot?.windowMs) ?? DIFFICULTY_WINDOWS_MS.Normal;
  const fallback = targetMs + windowMs * 3;
  const release = asNumber(releaseMs);
  const safeRelease = Math.max(0, release ?? fallback);
  const errorMs = round1(safeRelease - targetMs);
  const distanceMs = Math.abs(errorMs);
  const halfWindowMs = windowMs / 2;

  let result;
  if (distanceMs <= halfWindowMs) result = 'green';
  else if (distanceMs <= windowMs) result = errorMs < 0 ? 'slightly-early' : 'slightly-late';
  else if (distanceMs <= windowMs * 2.2) result = errorMs < 0 ? 'early' : 'late';
  else result = errorMs < 0 ? 'very-early' : 'very-late';

  const meta = RESULT_META[result];
  const direction = Math.abs(errorMs) < 1 ? 'on time' : errorMs < 0 ? 'early' : 'late';
  const timing = Math.abs(errorMs) < 1
    ? 'on the estimated target'
    : `${Math.abs(errorMs).toFixed(1)} ms ${direction}`;

  return {
    result,
    label: meta.label,
    tone: meta.tone,
    clean: meta.clean,
    points: meta.points,
    errorMs,
    distanceMs: round1(distanceMs),
    distanceFromGreenMs: round1(Math.max(0, distanceMs - halfWindowMs)),
    direction,
    timing,
    releaseMs: round1(safeRelease),
    targetMs,
    windowMs,
    estimated: true,
    disclaimer: 'Local release timing relative to an estimated practice target; not an NBA 2K measurement.',
  };
}

export function normalizeAttempt(attempt) {
  if (!attempt || typeof attempt !== 'object') return null;
  const result = typeof attempt.result === 'string' && RESULT_META[attempt.result]
    ? attempt.result
    : null;
  if (!result) return null;

  const at = asNumber(attempt.at);
  const releaseMs = asNumber(attempt.releaseMs);
  const targetMs = asNumber(attempt.targetMs);
  const windowMs = asNumber(attempt.windowMs);
  const errorMs = asNumber(attempt.errorMs);
  if (at === null || at < 0 || releaseMs === null || releaseMs < 0) return null;
  if (targetMs === null || targetMs <= 0 || windowMs === null || windowMs <= 0) return null;
  if (errorMs === null) return null;

  const mode = pickMode(attempt.mode);
  const meta = RESULT_META[result];
  const drillIndex = asNumber(attempt.drillIndex);
  return {
    id: pickText(attempt.id, `${at}-${result}`, 100),
    at,
    mode,
    drillId: typeof attempt.drillId === 'string' ? attempt.drillId.slice(0, 100) : null,
    drillIndex: drillIndex === null ? null : Math.max(1, Math.round(drillIndex)),
    releaseMs: round1(releaseMs),
    targetMs: Math.round(targetMs),
    rawIdealMs: asNumber(attempt.rawIdealMs) === null ? Math.round(targetMs) : Math.round(attempt.rawIdealMs),
    offsetMs: Math.round(clamp(asNumber(attempt.offsetMs) ?? 0, -MAX_OFFSET_MS, MAX_OFFSET_MS)),
    windowMs: Math.round(windowMs),
    errorMs: round1(errorMs),
    result,
    points: Math.round(meta.points),
    clean: meta.clean,
    shotType: pickText(attempt.shotType, DEFAULT_SETTINGS.shotType, 40),
    speed: pickChoice(attempt.speed, SPEEDS, DEFAULT_SETTINGS.speed),
    difficulty: pickChoice(attempt.difficulty, DIFFICULTY_NAMES, DEFAULT_SETTINGS.difficulty),
    context: pickText(attempt.context, DEFAULT_SETTINGS.context, 40),
    meter: pickChoice(attempt.meter, METER_STATES, DEFAULT_SETTINGS.meter),
  };
}

export function normalizeAttempts(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeAttempt)
    .filter(Boolean)
    .sort((left, right) => left.at - right.at)
    .slice(-ATTEMPT_LIMIT);
}

export function makeAttempt({ shot, releaseMs, mode = 'jump', settings, id, at = Date.now(), drillId = null, drillIndex = null }) {
  const evaluation = evaluateRelease(shot, releaseMs);
  const s = normalizeSettings(settings);
  const attempt = {
    id: pickText(id, `${Math.round(at)}-${Math.random().toString(36).slice(2, 9)}`, 100),
    at: Number.isFinite(at) ? at : Date.now(),
    mode: pickMode(mode),
    drillId: typeof drillId === 'string' ? drillId.slice(0, 100) : null,
    drillIndex: drillIndex === null ? null : Math.max(1, Math.round(Number(drillIndex))),
    releaseMs: evaluation.releaseMs,
    targetMs: evaluation.targetMs,
    rawIdealMs: Math.round(shot?.rawIdealMs ?? evaluation.targetMs),
    offsetMs: Math.round(clamp(shot?.offsetMs ?? s.offsetMs, -MAX_OFFSET_MS, MAX_OFFSET_MS)),
    windowMs: evaluation.windowMs,
    errorMs: evaluation.errorMs,
    result: evaluation.result,
    points: evaluation.points,
    clean: evaluation.clean,
    shotType: pickText(shot?.shotType, s.shotType, 40),
    speed: s.speed,
    difficulty: s.difficulty,
    context: pickText(shot?.context, s.context, 40),
    meter: s.meter,
  };
  const normalized = normalizeAttempt(attempt);
  if (!normalized) throw new TypeError('Could not normalize the shot attempt');
  return normalized;
}

export function recordAttempt(attempts, attempt) {
  const normalized = normalizeAttempt(attempt);
  if (!normalized) throw new TypeError('Attempt is not a valid local timing record');
  return [...normalizeAttempts(attempts), normalized].slice(-ATTEMPT_LIMIT);
}

export function attemptsForMode(attempts, mode) {
  return normalizeAttempts(attempts).filter((attempt) => attempt.mode === mode);
}

export function attemptsForDrill(attempts, drillId) {
  if (typeof drillId !== 'string' || !drillId) return [];
  return normalizeAttempts(attempts).filter((attempt) => attempt.drillId === drillId);
}

/**
 * Summary of a recent block of attempts. `filter` and `limit` are applied
 * before the statistics are calculated.
 */
export function summarizeAttempts(attempts, { filter, limit = 20 } = {}) {
  const safeLimit = Math.max(1, Math.min(ATTEMPT_LIMIT, Math.round(Number(limit) || 20)));
  let list = normalizeAttempts(attempts);
  if (typeof filter === 'function') list = list.filter(filter);
  list = list.slice(-safeLimit);
  const errors = list.map((attempt) => attempt.errorMs);
  const absErrors = errors.map((error) => Math.abs(error));
  const cleans = list.filter((attempt) => attempt.clean).length;
  const resultCounts = {};
  for (const attempt of list) resultCounts[attempt.result] = (resultCounts[attempt.result] || 0) + 1;

  let bestStreak = 0;
  let running = 0;
  for (const attempt of list) {
    if (attempt.clean) {
      running += 1;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  }
  let currentStreak = 0;
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (!list[index].clean) break;
    currentStreak += 1;
  }

  const count = list.length;
  const cleanRate = count ? cleans / count : 0;
  const meanErrorMs = count ? errors.reduce((sum, value) => sum + value, 0) / count : 0;
  const meanAbsErrorMs = count ? absErrors.reduce((sum, value) => sum + value, 0) / count : 0;
  const medianErrorMs = median(errors);
  const medianAbsErrorMs = median(absErrors);
  const stdDevMs = standardDeviation(errors);
  const madMs = median(errors.map((error) => Math.abs(error - medianErrorMs)));
  const balance = 14;
  const biasDirection = count === 0
    ? 'none'
    : meanErrorMs > balance
      ? 'late'
      : meanErrorMs < -balance
        ? 'early'
        : 'balanced';
  const grade = count === 0
    ? 'No data'
    : cleanRate >= 0.7 && stdDevMs <= 30
      ? 'Locked in'
      : cleanRate >= 0.5 && stdDevMs <= 50
        ? 'Steady'
        : cleanRate >= 0.3
          ? 'Finding range'
          : 'Baseline';

  return {
    count,
    cleans,
    cleanRate,
    meanErrorMs: round1(meanErrorMs),
    meanAbsErrorMs: round1(meanAbsErrorMs),
    medianErrorMs: round1(medianErrorMs),
    medianAbsErrorMs: round1(medianAbsErrorMs),
    stdDevMs: round1(stdDevMs),
    madMs: round1(madMs),
    bestStreak,
    currentStreak,
    biasDirection,
    grade,
    resultCounts,
    recent: list.slice(-10),
    attempts: list,
  };
}

export function summarizeDrill(attempts, drillId, total = 10) {
  const reps = Math.max(1, Math.round(Number(total) || 10));
  const list = attemptsForDrill(attempts, drillId);
  const stats = summarizeAttempts(list, { limit: ATTEMPT_LIMIT });
  const dots = Array.from({ length: reps }, (_, index) => {
    const attempt = list[index];
    return attempt
      ? { state: attempt.clean ? 'clean' : 'missed', result: attempt.result, attempt }
      : { state: 'pending', result: null, attempt: null };
  });
  return {
    drillId,
    total: reps,
    count: Math.min(list.length, reps),
    cleans: list.slice(0, reps).filter((attempt) => attempt.clean).length,
    complete: list.length >= reps,
    remaining: Math.max(0, reps - list.length),
    dots,
    stats,
  };
}

/** Estimate a browser-local reaction offset from recent residual errors. */
export function computeCalibration(attempts, currentOffsetMs = 0, options = {}) {
  const includeFreeThrows = options.includeFreeThrows === true;
  const matchOffset = options.matchOffset !== false;
  const limit = Math.max(1, Math.min(ATTEMPT_LIMIT, Math.round(Number(options.limit) || 24)));
  const currentOffset = Math.round(clamp(asNumber(currentOffsetMs) ?? 0, -MAX_OFFSET_MS, MAX_OFFSET_MS));
  const list = normalizeAttempts(attempts)
    .filter((attempt) => includeFreeThrows || attempt.mode !== 'freeThrow')
    .filter((attempt) => !matchOffset || attempt.offsetMs === currentOffset)
    .slice(-limit);
  const count = list.length;
  const errors = list.map((attempt) => attempt.errorMs);
  const biasMs = count ? median(errors) : 0;
  const meanErrorMs = count ? errors.reduce((sum, value) => sum + value, 0) / count : 0;
  const spreadMs = standardDeviation(errors);
  const medianAbsErrorMs = median(errors.map((error) => Math.abs(error)));
  const ready = count >= MIN_CALIBRATION_SAMPLES;
  const suggestedOffsetMs = ready
    ? Math.round(clamp(currentOffset + biasMs, -MAX_OFFSET_MS, MAX_OFFSET_MS))
    : currentOffset;
  const deltaMs = suggestedOffsetMs - currentOffset;

  let confidence = 'none';
  if (ready) {
    if (count < 8 || spreadMs > 70) confidence = 'low';
    else if (count < 14 || spreadMs > 42) confidence = 'medium';
    else confidence = 'high';
  }

  const direction = Math.abs(biasMs) < 4 ? 'balanced' : biasMs > 0 ? 'late' : 'early';
  const canApply = ready && confidence !== 'low' && suggestedOffsetMs !== currentOffset;
  const atLimit = Math.abs(suggestedOffsetMs) >= MAX_OFFSET_MS && Math.abs(biasMs) >= 3;
  let advice;
  if (!ready) {
    advice = `Take at least ${MIN_CALIBRATION_SAMPLES} jump-shot reps to measure a local release offset. Free throws are excluded from calibration.`;
  } else if (atLimit) {
    advice = `The suggested offset is at the ${suggestedOffsetMs > 0 ? '+' : ''}${suggestedOffsetMs} ms limit while the residual still leans ${direction}. Log reps at or near the limit before changing the setup again.`;
  } else if (Math.abs(deltaMs) < 3) {
    advice = 'Residual timing is centered. Keep the current offset and keep collecting reps.';
  } else if (confidence === 'low') {
    advice = `Recent reps lean ${direction} by ${Math.abs(biasMs).toFixed(1)} ms, but the sample is low confidence (spread ${spreadMs.toFixed(1)} ms). Collect more stable reps before applying an offset.`;
  } else if (deltaMs > 0) {
    advice = `Recent reps finish ${Math.abs(biasMs).toFixed(1)} ms late on average. Apply a +${deltaMs} ms offset to shift the local target earlier.`;
  } else {
    advice = `Recent reps finish ${Math.abs(biasMs).toFixed(1)} ms early on average. Apply a ${deltaMs} ms offset to shift the local target later.`;
  }
  return {
    ready,
    canApply,
    sampleSize: count,
    minimumSamples: MIN_CALIBRATION_SAMPLES,
    currentOffsetMs: currentOffset,
    suggestedOffsetMs,
    deltaMs,
    biasMs: round1(biasMs),
    meanErrorMs: round1(meanErrorMs),
    spreadMs: round1(spreadMs),
    medianAbsErrorMs: round1(medianAbsErrorMs),
    direction,
    confidence,
    atLimit,
    advice,
    samples: list.slice(-16).map((attempt) => ({
      at: attempt.at,
      errorMs: attempt.errorMs,
      result: attempt.result,
      mode: attempt.mode,
    })),
    estimated: true,
    disclaimer: 'This offset calibrates the browser practice target to your release behaviour. It is not an NBA 2K latency measurement.',
  };
}

function changedEntry(changes, key, value) {
  if (value !== undefined) changes[key] = value;
}

/** Practice-only recommendations derived from the local timing log. */
export function buildRecommendations(settings, attempts) {
  const s = normalizeSettings(settings);
  const all = normalizeAttempts(attempts);
  const relevant = all.filter((attempt) => attempt.mode !== 'freeThrow').slice(-30);
  const freeThrows = all.filter((attempt) => attempt.mode === 'freeThrow').slice(-20);
  const stats = summarizeAttempts(relevant, { limit: 30 });
  const ftStats = summarizeAttempts(freeThrows, { limit: 20 });
  const calibration = computeCalibration(all, s.offsetMs);
  const changes = {};
  const observations = [];
  const drills = [];
  let headline;
  let body;

  if (stats.count < 5) {
    headline = 'Build a baseline';
    body = 'Log at least five jump-shot releases before changing much. Ten reps makes the local window and your release pattern easier to read.';
    if (s.meter === 'Off') changedEntry(changes, 'meter', 'On');
    if (s.difficulty === 'Hard') changedEntry(changes, 'difficulty', 'Normal');
    drills.push({
      id: 'baseline',
      mode: 'jump',
      title: '10-rep baseline',
      detail: 'Normal difficulty, meter on, no auto-advance. Focus on seeing the cue rather than chasing a score.',
    });
    drills.push({
      id: 'calibration',
      mode: 'calibration',
      title: '6-rep calibration',
      detail: 'Collect a first local offset after the baseline reps.',
    });
  } else if (stats.cleanRate < 0.35 || stats.medianAbsErrorMs > 70) {
    headline = 'Slow the release down';
    body = 'The local green window is getting missed by a wide margin. A slower tempo and a visible meter make the cue easier to learn before adding speed.';
    if (s.difficulty !== 'Easy') changedEntry(changes, 'difficulty', 'Easy');
    if (s.speed === 'Quick' || s.speed === 'Very Quick') changedEntry(changes, 'speed', 'Slow');
    if (s.meter === 'Off') changedEntry(changes, 'meter', 'On');
    if (s.context !== 'Standing') changedEntry(changes, 'context', 'Standing');
    drills.push({
      id: 'slow-jump',
      mode: 'jump',
      title: '10 slow jumpers',
      detail: 'Easy difficulty, meter on, standing. Reset between reps and release on the cue.',
    });
    drills.push({
      id: 'free-throw-rhythm',
      mode: 'freeThrow',
      title: '10 free throws',
      detail: 'Use the shorter free-throw tempo to reset your rhythm without changing the rest of the setup.',
    });
  } else if (stats.stdDevMs > 46 || stats.medianAbsErrorMs > 45) {
    headline = 'Shrink the spread';
    body = 'Your average is usable, but the release varies shot to shot. Keep the target visible and remove movement before increasing difficulty.';
    if (s.meter === 'Off') changedEntry(changes, 'meter', 'On');
    if (s.difficulty === 'Hard') changedEntry(changes, 'difficulty', 'Normal');
    if (s.context !== 'Standing') changedEntry(changes, 'context', 'Standing');
    if (s.speed === 'Very Quick') changedEntry(changes, 'speed', 'Quick');
    drills.push({
      id: 'steady-10',
      mode: 'jump',
      title: 'Steady 10',
      detail: 'Standing jumpers with the meter on. Aim for a tighter cluster rather than a faster release.',
    });
    drills.push({
      id: 'calibration-topup',
      mode: 'calibration',
      title: 'Calibration top-up',
      detail: 'Add six clean reps, then re-check the suggested offset.',
    });
  } else if (stats.cleanRate >= 0.6 && stats.stdDevMs <= 38) {
    headline = 'Raise the challenge';
    body = 'The current window is being found consistently. Change one variable at a time: make the window smaller before removing the meter or adding movement.';
    if (s.difficulty === 'Easy') changedEntry(changes, 'difficulty', 'Normal');
    else if (s.difficulty === 'Normal' && stats.cleanRate >= 0.7) changedEntry(changes, 'difficulty', 'Hard');
    else if (s.difficulty === 'Normal') {
      if (s.speed === 'Normal' || s.speed === 'Slow') changedEntry(changes, 'speed', 'Quick');
    } else if (s.difficulty === 'Hard' && s.speed !== 'Quick' && s.speed !== 'Very Quick') {
      changedEntry(changes, 'speed', 'Quick');
    } else if (s.difficulty === 'Hard' && s.meter === 'On') {
      changedEntry(changes, 'meter', 'Off');
    } else if (s.difficulty === 'Hard' && s.context === 'Standing') {
      changedEntry(changes, 'context', 'Moving');
    }
    drills.push({
      id: 'challenge-10',
      mode: 'jump',
      title: 'Challenge 10',
      detail: 'Try the suggested setup for ten reps. If the clean rate falls below half, step back one setting.',
    });
    drills.push({
      id: 'pressure-free-throws',
      mode: 'freeThrow',
      title: 'Pressure free throws',
      detail: 'Ten free throws with the same timing intent. The shorter tempo exposes an early release quickly.',
    });
  } else {
    headline = 'Keep dialing the window';
    body = 'The current setup is close to a useful practice range. Collect a few more reps before changing speed or difficulty.';
    if (stats.cleanRate < 0.5 && s.meter === 'Off') changedEntry(changes, 'meter', 'On');
    drills.push({
      id: 'mixed-10',
      mode: 'jump',
      title: 'Mixed 10',
      detail: 'Five standing reps, then five free throws. Keep the same release intent across both tempos.',
    });
    drills.push({
      id: 'calibration-mixed',
      mode: 'calibration',
      title: 'Calibration reps',
      detail: 'Add six jump-shot reps to refresh the local offset estimate.',
    });
  }

  if (Math.abs(stats.meanErrorMs) >= 18) {
    observations.push(`Average release is ${Math.abs(stats.meanErrorMs).toFixed(1)} ms ${stats.meanErrorMs > 0 ? 'late' : 'early'} against the estimated practice target.`);
  }
  if (calibration.ready && Math.abs(calibration.deltaMs) >= 4) {
    observations.push(`Calibration suggests a ${calibration.suggestedOffsetMs} ms offset (${calibration.deltaMs > 0 ? '+' : ''}${calibration.deltaMs} ms from the current setting).`);
    if (calibration.canApply && stats.cleanRate < 0.7) changedEntry(changes, 'offsetMs', calibration.suggestedOffsetMs);
  }
  if (s.meter === 'Off' && stats.cleanRate < 0.55) {
    changedEntry(changes, 'meter', 'On');
    observations.push('Meter-off reps are currently below a 55% clean rate; the meter is a useful training aid for now.');
  }
  if (s.context !== 'Standing' && stats.stdDevMs > 42) {
    changedEntry(changes, 'context', 'Standing');
    observations.push('Moving/off-screen reps are adding variance. Rebuild the window from a standing base first.');
  }
  if (ftStats.count >= 6) {
    observations.push(`Free-throw reps: ${ftStats.cleans} clean of ${ftStats.count} in the recent block.`);
    if (ftStats.cleanRate < 0.4 && stats.cleanRate >= 0.55) {
      drills.push({
        id: 'free-throw-fix',
        mode: 'freeThrow',
        title: 'Free-throw reset',
        detail: 'Your free-throw tempos differ from your jump-shot rhythm. Run ten slower free throws and release on the cue, not the drop.',
      });
    }
  }

  const suggestedSettings = normalizeSettings({ ...s, ...changes });
  const actualChanges = Object.fromEntries(
    Object.entries(changes).filter(([key, value]) => suggestedSettings[key] !== s[key]),
  );
  const confidence = stats.count >= 20 && (stats.stdDevMs <= 38 || stats.cleanRate >= 0.6)
    ? 'high'
    : stats.count >= 8
      ? 'medium'
      : 'low';

  return {
    headline,
    body,
    observations,
    changes: actualChanges,
    changedKeys: Object.keys(actualChanges),
    suggestedSettings,
    drills,
    stats,
    freeThrowStats: ftStats,
    calibration,
    confidence,
    sampleSize: stats.count,
    estimated: true,
    disclaimer: 'Practice suggestions use only this browser\'s local timing log. They are not NBA 2K tuning data, ratings or guarantees.',
  };
}

/**
 * Build a query for the existing Jumpshot Lab page using the recovered field
 * names. This only carries settings; the receiving page still owns its own
 * labels and local persistence.
 */
export function buildShareQuery(settings, basePath = '/?tab=jumpshots') {
  const s = normalizeSettings(settings);
  const fields = [
    ['jType', s.shotType],
    ['jBase', s.base],
    ['jR1', s.release1],
    ['jR2', s.release2],
    ['jSpeed', s.speed],
    ['jInput', s.input],
    ['jCue', s.cue],
    ['jDiff', s.difficulty],
    ['jSpot', s.context],
    ['jHand', s.hand],
    ['jSprint', s.sprint],
    ['jMeterOn', s.meter],
    ['jMeterIn', s.meterSide],
    ['jCueBar', String(s.cueBar)],
    ['jFtRating', String(s.freeThrowRating)],
  ];
  const params = new URLSearchParams();
  for (const [key, value] of fields) {
    if (value !== '' && value !== null && value !== undefined) params.set(key, value);
  }
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}${params.toString()}`;
}

export function emptyState() {
  return {
    settings: normalizeSettings(DEFAULT_SETTINGS),
    attempts: [],
    ui: { tab: 'shooting' },
  };
}

export function normalizeTab(value) {
  return TABS.includes(value) ? value : 'shooting';
}

export function normalizeState(input) {
  const source = input && typeof input === 'object' ? input : {};
  return {
    settings: normalizeSettings(source.settings),
    attempts: normalizeAttempts(source.attempts),
    ui: {
      tab: normalizeTab(source?.ui?.tab),
    },
  };
}

export function serializeState(state, { pretty = true, now = Date.now() } = {}) {
  const normalized = normalizeState(state);
  return JSON.stringify({
    schema: STATE_SCHEMA,
    version: SCHEMA_VERSION,
    savedAt: new Date(now).toISOString(),
    settings: normalized.settings,
    attempts: normalized.attempts,
    ui: normalized.ui,
  }, null, pretty ? 2 : 0);
}

export function parseStateJson(text) {
  if (typeof text !== 'string' || text.trim() === '') {
    throw new Error('The selected file is empty.');
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('The selected file does not contain a practice log.');
  }
  if (parsed.schema !== undefined && parsed.schema !== STATE_SCHEMA) {
    throw new Error('This file is not a Free Builder jumpshot practice log.');
  }
  if (parsed.version !== undefined && (!Number.isInteger(parsed.version) || parsed.version > SCHEMA_VERSION)) {
    throw new Error('This practice log was created by a newer version of the trainer.');
  }
  if (!parsed.settings && !Array.isArray(parsed.attempts)) {
    throw new Error('The practice log has no settings or attempts.');
  }
  return normalizeState(parsed);
}

export function loadStoredState(storage) {
  try {
    if (!storage || typeof storage.getItem !== 'function') {
      return { state: emptyState(), error: 'Browser storage is unavailable. This session will not be saved.' };
    }
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { state: emptyState(), error: null };
    const parsed = JSON.parse(raw);
    if (parsed?.schema !== undefined && parsed.schema !== STATE_SCHEMA) {
      return { state: emptyState(), error: 'Saved practice data had an unknown format and was ignored.' };
    }
    return { state: normalizeState(parsed), error: null };
  } catch {
    return { state: emptyState(), error: 'Saved practice data could not be read. A fresh local state was loaded.' };
  }
}

export function saveStoredState(storage, state, options = {}) {
  try {
    if (!storage || typeof storage.setItem !== 'function') return false;
    storage.setItem(STORAGE_KEY, serializeState(state, options));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredState(storage) {
  try {
    if (!storage || typeof storage.removeItem !== 'function') return false;
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
