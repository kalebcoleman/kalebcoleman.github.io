import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  MAX_OFFSET_MS,
  RESULT_META,
  STATE_SCHEMA,
  STORAGE_KEY,
  buildRecommendations,
  buildShareQuery,
  clearStoredState,
  computeCalibration,
  createShot,
  emptyState,
  estimateProfile,
  evaluateRelease,
  loadStoredState,
  makeAttempt,
  normalizeAttempts,
  normalizeSettings,
  parseStateJson,
  recordAttempt,
  saveStoredState,
  serializeState,
  summarizeAttempts,
  summarizeDrill,
} from '../assets/trainer-engine.mjs';

const baseTime = 1_700_000_000_000;

function shotFor(settings = DEFAULT_SETTINGS, mode = 'jump') {
  return createShot(settings, mode, () => 0.5);
}

function attemptsFor(errors, {
  settings = DEFAULT_SETTINGS,
  mode = 'jump',
  drillId = null,
  startAt = baseTime,
} = {}) {
  const normalizedSettings = normalizeSettings(settings);
  let attempts = [];
  errors.forEach((errorMs, index) => {
    const shot = shotFor(normalizedSettings, mode);
    const at = startAt + index * 1_000;
    attempts = recordAttempt(attempts, makeAttempt({
      shot,
      releaseMs: shot.targetMs + errorMs,
      mode,
      settings: normalizedSettings,
      id: `attempt-${startAt}-${index}`,
      at,
      drillId,
      drillIndex: drillId ? index + 1 : null,
    }));
  });
  return attempts;
}

function fakeStorage() {
  const values = new Map();
  return {
    values,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

test('settings accept the recovered j* shape and clamp unsafe values', () => {
  const settings = normalizeSettings({
    jType: 'Set Shot',
    jBase: 'A.J. Green',
    jR1: 'A.J. Green',
    jR2: 'None',
    jSpeed: 'Quick',
    jInput: 'Stick',
    jCue: 'Push',
    jDiff: 'Easy',
    jSpot: 'Moving',
    jHand: 'Left',
    jSprint: 'On',
    jMeterOn: 'Off',
    jMeterIn: 'Side',
    jCueBar: '2',
    jFtRating: '91',
    offsetMs: 999,
    sound: 'Off',
    autoAdvance: 'On',
  });
  assert.equal(settings.shotType, 'Set Shot');
  assert.equal(settings.base, 'A.J. Green');
  assert.equal(settings.speed, 'Quick');
  assert.equal(settings.input, 'Stick');
  assert.equal(settings.cue, 'Push');
  assert.equal(settings.difficulty, 'Easy');
  assert.equal(settings.context, 'Moving');
  assert.equal(settings.hand, 'Left');
  assert.equal(settings.sprint, 'On');
  assert.equal(settings.meter, 'Off');
  assert.equal(settings.meterSide, 'Side');
  assert.equal(settings.cueBar, 2);
  assert.equal(settings.freeThrowRating, 91);
  assert.equal(settings.offsetMs, MAX_OFFSET_MS);
  assert.equal(settings.sound, false);
  assert.equal(settings.autoAdvance, true);

  const fallback = normalizeSettings({
    shotType: 'Invalid',
    speed: 'Warp',
    difficulty: 'Impossible',
    meter: 'Maybe',
    offsetMs: -999,
    freeThrowRating: 1,
    cueBar: 9,
  });
  assert.equal(fallback.shotType, DEFAULT_SETTINGS.shotType);
  assert.equal(fallback.speed, DEFAULT_SETTINGS.speed);
  assert.equal(fallback.difficulty, DEFAULT_SETTINGS.difficulty);
  assert.equal(fallback.meter, DEFAULT_SETTINGS.meter);
  assert.equal(fallback.offsetMs, -MAX_OFFSET_MS);
  assert.equal(fallback.freeThrowRating, 25);
  assert.equal(fallback.cueBar, 3);
});

test('estimated profiles follow tempo settings and mark themselves as estimates', () => {
  const freeThrow = estimateProfile(DEFAULT_SETTINGS, 'freeThrow');
  assert.equal(freeThrow.targetMs, 495);
  assert.equal(freeThrow.windowMs, 92);
  assert.equal(freeThrow.cueMs, 405);
  assert.equal(freeThrow.cueLeadMs, 90);
  assert.match(freeThrow.disclaimer, /not an NBA 2K measurement/i);

  const normal = estimateProfile(DEFAULT_SETTINGS, 'jump');
  const quick = estimateProfile({ ...DEFAULT_SETTINGS, speed: 'Quick' }, 'jump');
  const veryQuick = estimateProfile({ ...DEFAULT_SETTINGS, speed: 'Very Quick' }, 'jump');
  assert.equal(normal.targetMs, 620);
  assert.equal(quick.targetMs, 560);
  assert.equal(veryQuick.targetMs, 510);
  assert.equal(quick.targetMs - normal.targetMs, -60);

  assert.equal(estimateProfile({ ...DEFAULT_SETTINGS, difficulty: 'Easy' }, 'jump').windowMs, 132);
  assert.equal(estimateProfile({ ...DEFAULT_SETTINGS, difficulty: 'Hard' }, 'jump').windowMs, 64);
  assert.equal(estimateProfile({ ...DEFAULT_SETTINGS, context: 'Moving' }, 'jump').targetMs, 665);
  assert.equal(estimateProfile({ ...DEFAULT_SETTINGS, cueBar: 3 }, 'jump').cueMs, 510);

  const shifted = estimateProfile({ ...DEFAULT_SETTINGS, offsetMs: 40 }, 'jump');
  assert.equal(shifted.rawIdealMs, 620);
  assert.equal(shifted.targetMs, 580);
  assert.equal(shifted.cueMs, 490);

  const lowRating = estimateProfile({ ...DEFAULT_SETTINGS, freeThrowRating: 25 }, 'freeThrow');
  const highRating = estimateProfile({ ...DEFAULT_SETTINGS, freeThrowRating: 99 }, 'freeThrow');
  assert.equal(lowRating.targetMs, highRating.targetMs, 'rating is a label, not a timing model');
  assert.equal(lowRating.windowMs, highRating.windowMs);

  const calibration = estimateProfile({ ...DEFAULT_SETTINGS, context: 'Off-Screen' }, 'calibration');
  assert.equal(calibration.shotType, 'Jump Shot');
  assert.equal(calibration.context, 'Standing');
  assert.equal(calibration.targetMs, 620);
});

test('shot jitter is bounded and every shot stays an estimate', () => {
  const low = createShot(DEFAULT_SETTINGS, 'jump', () => 0);
  const center = createShot(DEFAULT_SETTINGS, 'jump', () => 0.5);
  const high = createShot(DEFAULT_SETTINGS, 'jump', () => 1);
  assert.equal(center.jitterMs, 0);
  assert.equal(center.targetMs, 620);
  assert.ok(low.jitterMs >= -22 && low.jitterMs <= 22);
  assert.ok(high.jitterMs >= -22 && high.jitterMs <= 22);
  assert.notEqual(low.targetMs, high.targetMs);
  assert.equal(low.estimated, true);
  assert.match(low.disclaimer, /estimated local practice timing/i);
});

test('release evaluation reports timing bands relative to the estimated target', () => {
  const shot = shotFor();
  const center = evaluateRelease(shot, shot.targetMs);
  assert.equal(center.result, 'green');
  assert.equal(center.clean, true);
  assert.equal(center.points, 100);
  assert.equal(center.errorMs, 0);

  const edge = evaluateRelease(shot, shot.targetMs + 46);
  assert.equal(edge.result, 'green');
  const justOut = evaluateRelease(shot, shot.targetMs + 47);
  assert.equal(justOut.result, 'slightly-late');
  assert.equal(justOut.clean, false);
  assert.equal(justOut.tone, 'warm');

  assert.equal(evaluateRelease(shot, shot.targetMs - 92).result, 'slightly-early');
  assert.equal(evaluateRelease(shot, shot.targetMs + 93).result, 'late');
  assert.equal(evaluateRelease(shot, shot.targetMs - 93).result, 'early');
  assert.equal(evaluateRelease(shot, shot.targetMs + 250).result, 'very-late');
  assert.equal(evaluateRelease(shot, shot.targetMs - 250).result, 'very-early');
  assert.match(evaluateRelease(shot, shot.targetMs + 250).disclaimer, /not an NBA 2K measurement/i);

  for (const meta of Object.values(RESULT_META)) {
    assert.ok(meta.label);
    assert.ok(meta.tone);
    assert.equal(typeof meta.clean, 'boolean');
  }
});

test('summaries calculate clean rate, central tendency and streaks', () => {
  const attempts = attemptsFor([0, 20, -20, 50, -50, 100, -100, 0, 200, -200]);
  const summary = summarizeAttempts(attempts, { limit: 10 });
  assert.equal(summary.count, 10);
  assert.equal(summary.cleans, 4);
  assert.equal(summary.cleanRate, 0.4);
  assert.equal(summary.meanErrorMs, 0);
  assert.equal(summary.medianAbsErrorMs, 50);
  assert.equal(summary.bestStreak, 3);
  assert.equal(summary.biasDirection, 'balanced');
  assert.equal(summary.recent.length, 10);
  assert.equal(summary.attempts.length, 10);

  const empty = summarizeAttempts([]);
  assert.equal(empty.count, 0);
  assert.equal(empty.cleanRate, 0);
  assert.equal(empty.grade, 'No data');
  assert.equal(empty.recent.length, 0);
});

test('drill summaries count ten free-throw reps and preserve dots', () => {
  const drillId = 'ft-test';
  const attempts = attemptsFor([0, 10, 50, 100, -10, 0, 20, 60, 0, -5], {
    mode: 'freeThrow',
    drillId,
    startAt: baseTime + 5_000,
  });
  const summary = summarizeDrill(attempts, drillId, 10);
  assert.equal(summary.drillId, drillId);
  assert.equal(summary.count, 10);
  assert.equal(summary.cleans, 7);
  assert.equal(summary.complete, true);
  assert.equal(summary.remaining, 0);
  assert.equal(summary.dots.length, 10);
  assert.equal(summary.dots.filter((dot) => dot.state === 'clean').length, 7);

  const partial = summarizeDrill(attempts.slice(0, 4), drillId, 10);
  assert.equal(partial.count, 4);
  assert.equal(partial.complete, false);
  assert.equal(partial.remaining, 6);
  assert.equal(partial.dots[4].state, 'pending');
});

test('calibration needs samples, uses the current offset and caps its correction', () => {
  const none = computeCalibration([], 0);
  assert.equal(none.ready, false);
  assert.equal(none.canApply, false);
  assert.equal(none.suggestedOffsetMs, 0);
  assert.equal(none.confidence, 'none');
  assert.match(none.advice, /at least 6/i);

  const late = attemptsFor(Array(10).fill(40));
  const lateCalibration = computeCalibration(late, 0);
  assert.equal(lateCalibration.ready, true);
  assert.equal(lateCalibration.canApply, true);
  assert.equal(lateCalibration.sampleSize, 10);
  assert.equal(lateCalibration.biasMs, 40);
  assert.equal(lateCalibration.suggestedOffsetMs, 40);
  assert.equal(lateCalibration.confidence, 'medium');
  assert.equal(lateCalibration.direction, 'late');
  assert.match(lateCalibration.advice, /late/i);

  const early = computeCalibration(attemptsFor(Array(8).fill(-30)), 0);
  assert.equal(early.suggestedOffsetMs, -30);
  assert.equal(early.canApply, true);

  const atLimit = computeCalibration(attemptsFor(Array(6).fill(30), {
    settings: { ...DEFAULT_SETTINGS, offsetMs: 110 },
    startAt: baseTime + 50_000,
  }), 110);
  assert.equal(atLimit.suggestedOffsetMs, 120);
  assert.equal(atLimit.atLimit, true);
  assert.equal(atLimit.confidence, 'low');
  assert.equal(atLimit.canApply, false);
  assert.match(atLimit.advice, /limit/i);

  const offsetShots = attemptsFor(Array(8).fill(0), {
    settings: { ...DEFAULT_SETTINGS, offsetMs: 40 },
    startAt: baseTime + 100_000,
  });
  const mixed = [...late, ...offsetShots];
  const atCurrentOffset = computeCalibration(mixed, 40);
  assert.equal(atCurrentOffset.sampleSize, 8);
  assert.equal(atCurrentOffset.biasMs, 0);
  assert.equal(atCurrentOffset.suggestedOffsetMs, 40);
  assert.equal(computeCalibration(mixed, 0).sampleSize, 10);

  const freeThrowOnly = computeCalibration(attemptsFor(Array(10).fill(0), { mode: 'freeThrow' }), 0);
  assert.equal(freeThrowOnly.sampleSize, 0);
  assert.equal(freeThrowOnly.ready, false);
});

test('recommendations are practice-only and adapt to the local sample', () => {
  const baseline = buildRecommendations({ ...DEFAULT_SETTINGS, meter: 'Off', difficulty: 'Hard' }, []);
  assert.equal(baseline.headline, 'Build a baseline');
  assert.equal(baseline.suggestedSettings.meter, 'On');
  assert.equal(baseline.suggestedSettings.difficulty, 'Normal');
  assert.match(baseline.disclaimer, /not NBA 2K tuning data/i);
  assert.ok(baseline.drills.length >= 1);

  const poorSettings = {
    ...DEFAULT_SETTINGS,
    meter: 'Off',
    difficulty: 'Hard',
    speed: 'Very Quick',
  };
  const poor = buildRecommendations(poorSettings, attemptsFor(Array(10).fill(120), { settings: poorSettings }));
  assert.equal(poor.headline, 'Slow the release down');
  assert.equal(poor.suggestedSettings.difficulty, 'Easy');
  assert.equal(poor.suggestedSettings.speed, 'Slow');
  assert.equal(poor.suggestedSettings.meter, 'On');
  assert.equal(poor.changedKeys.includes('offsetMs'), true);
  assert.ok(poor.observations.some((entry) => /Average release/i.test(entry)));

  const strong = buildRecommendations(DEFAULT_SETTINGS, attemptsFor(Array(12).fill(0)));
  assert.equal(strong.headline, 'Raise the challenge');
  assert.equal(strong.suggestedSettings.difficulty, 'Hard');
  assert.deepEqual(strong.changedKeys, ['difficulty']);
  assert.equal(strong.suggestedSettings.gameData, undefined);

  const centered = buildRecommendations(DEFAULT_SETTINGS, attemptsFor(Array(12).fill(5)));
  assert.equal(centered.changedKeys.includes('offsetMs'), false);

  const lowConfidence = buildRecommendations(DEFAULT_SETTINGS, attemptsFor(Array(6).fill(70)));
  assert.equal(lowConfidence.calibration.confidence, 'low');
  assert.equal(lowConfidence.calibration.canApply, false);
  assert.equal(lowConfidence.changedKeys.includes('offsetMs'), false);
});

test('state round-trips, validates, caps and tolerates a missing store', () => {
  const attempts = attemptsFor([0, 50, -50], { startAt: baseTime + 20_000 });
  const state = {
    settings: { ...DEFAULT_SETTINGS, shotType: 'Fade', offsetMs: -20 },
    attempts,
    ui: { tab: 'calibration' },
  };
  const text = serializeState(state, { now: baseTime });
  const parsed = parseStateJson(text);
  assert.equal(parsed.settings.shotType, 'Fade');
  assert.equal(parsed.settings.offsetMs, -20);
  assert.equal(parsed.attempts.length, 3);
  assert.equal(parsed.ui.tab, 'calibration');
  assert.equal(JSON.parse(text).schema, STATE_SCHEMA);

  assert.throws(() => parseStateJson('{'), /valid JSON/i);
  assert.throws(() => parseStateJson('[]'), /practice log/i);
  assert.throws(
    () => parseStateJson(JSON.stringify({ schema: 'other-app', settings: {}, attempts: [] })),
    /not a Free Builder/i,
  );
  assert.throws(
    () => parseStateJson(JSON.stringify({ version: 99, settings: {}, attempts: [] })),
    /newer version/i,
  );

  const malformed = JSON.parse(serializeState(state, { now: baseTime }));
  malformed.attempts.push({ result: 'green', releaseMs: 1 });
  const filtered = parseStateJson(JSON.stringify(malformed));
  assert.equal(filtered.attempts.length, 3);

  const storage = fakeStorage();
  assert.equal(saveStoredState(storage, state, { now: baseTime }), true);
  assert.ok(storage.getItem(STORAGE_KEY));
  const loaded = loadStoredState(storage);
  assert.equal(loaded.error, null);
  assert.equal(loaded.state.settings.shotType, 'Fade');
  assert.equal(loaded.state.attempts.length, 3);
  assert.equal(clearStoredState(storage), true);
  assert.equal(storage.getItem(STORAGE_KEY), null);

  const missing = loadStoredState(null);
  assert.match(missing.error, /storage is unavailable/i);
  assert.equal(missing.state.settings.shotType, DEFAULT_SETTINGS.shotType);
  assert.equal(emptyState().attempts.length, 0);
});

test('share query uses the recovered Jumpshot Lab field names', () => {
  const query = buildShareQuery({
    ...DEFAULT_SETTINGS,
    shotType: 'Set Shot',
    base: 'A.J. Green',
    release1: 'A.J. Green',
    speed: 'Quick',
    meter: 'Off',
    meterSide: 'Side',
    freeThrowRating: 91,
  });
  const url = new URL(query, 'https://example.test');
  assert.equal(url.pathname, '/');
  assert.equal(url.searchParams.get('tab'), 'jumpshots');
  assert.equal(url.searchParams.get('jType'), 'Set Shot');
  assert.equal(url.searchParams.get('jBase'), 'A.J. Green');
  assert.equal(url.searchParams.get('jR1'), 'A.J. Green');
  assert.equal(url.searchParams.get('jSpeed'), 'Quick');
  assert.equal(url.searchParams.get('jMeterOn'), 'Off');
  assert.equal(url.searchParams.get('jMeterIn'), 'Side');
  assert.equal(url.searchParams.get('jFtRating'), '91');
  assert.equal(url.searchParams.get('jCueBar'), '1');
});

test('attempt normalization rejects nonsense and sorts by timestamp', () => {
  const shot = shotFor();
  const later = makeAttempt({
    shot,
    releaseMs: shot.targetMs,
    mode: 'jump',
    settings: DEFAULT_SETTINGS,
    id: 'later',
    at: baseTime + 10_000,
  });
  const earlier = makeAttempt({
    shot,
    releaseMs: shot.targetMs + 50,
    mode: 'jump',
    settings: DEFAULT_SETTINGS,
    id: 'earlier',
    at: baseTime,
  });
  const normalized = normalizeAttempts([later, { result: 'green' }, earlier]);
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].id, 'earlier');
  assert.equal(normalized[1].id, 'later');
});
