import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_SETTINGS,
  MAX_OFFSET_MS,
  computeCalibration,
  createShot,
  estimateProfile,
  evaluateRelease,
  makeAttempt,
  normalizeSettings,
} from '../assets/trainer-engine.mjs';

test('estimated shot profile follows the selected settings', () => {
  const profile = estimateProfile(DEFAULT_SETTINGS, 'jump');
  assert.equal(profile.targetMs, 620);
  assert.equal(profile.windowMs, 92);
  assert.equal(profile.cueMs, 530);
  assert.equal(profile.estimated, true);

  const freeThrow = estimateProfile(DEFAULT_SETTINGS, 'freeThrow');
  assert.equal(freeThrow.shotType, 'Free Throw');
  assert.equal(freeThrow.targetMs, 495);
});

test('release evaluation separates green, close and missed timing', () => {
  const shot = createShot(DEFAULT_SETTINGS, 'jump', () => 0.5);
  assert.equal(evaluateRelease(shot, shot.targetMs).result, 'green');
  assert.equal(evaluateRelease(shot, shot.targetMs + shot.windowMs).result, 'slightly-late');
  assert.equal(evaluateRelease(shot, shot.targetMs - shot.windowMs).result, 'slightly-early');
  assert.equal(evaluateRelease(shot, shot.targetMs + shot.windowMs * 2).result, 'late');
  assert.equal(evaluateRelease(shot, shot.targetMs - shot.windowMs * 3).result, 'very-early');
});

test('calibration suggests an offset only after enough reps', () => {
  const shot = createShot(DEFAULT_SETTINGS, 'jump', () => 0.5);
  const attempts = Array.from({ length: 6 }, (_, index) => makeAttempt({
    shot,
    releaseMs: shot.targetMs + 20,
    settings: DEFAULT_SETTINGS,
    at: 1_700_000_000_000 + index * 1000,
  }));
  const calibration = computeCalibration(attempts, 0);
  assert.equal(calibration.ready, true);
  assert.equal(calibration.biasMs, 20);
  assert.equal(calibration.suggestedOffsetMs, 20);
  assert.ok(Math.abs(calibration.suggestedOffsetMs) <= MAX_OFFSET_MS);
});

test('settings normalization clamps invalid input', () => {
  const settings = normalizeSettings({ difficulty: 'Nope', cueBar: 99, freeThrowRating: 400, offsetMs: -999 });
  assert.equal(settings.difficulty, 'Normal');
  assert.equal(settings.cueBar, 3);
  assert.equal(settings.freeThrowRating, 99);
  assert.equal(settings.offsetMs, -MAX_OFFSET_MS);
});
