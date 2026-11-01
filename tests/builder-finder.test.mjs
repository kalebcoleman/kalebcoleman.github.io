import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDER_FINDER_ATTRIBUTES, builderFinderPayload } from '../assets/builder-finder.mjs';

test('builder finder payload maps targets, locks, body and caps to the reference worker', () => {
  const targets = Array(21).fill(0);
  targets[6] = 78;
  targets[8] = 90;
  const locks = Array(21).fill(false);
  locks[9] = true;
  const payload = builderFinderPayload({
    position: 2,
    anyPosition: false,
    height: 79,
    wingspan: 81,
    targets,
    locks,
    currentAlloc: Array(21).fill(60),
    caps: 5,
  });
  assert.equal(payload.pos, 'SF');
  assert.equal(payload.anyPos, false);
  assert.equal(payload.attrs['Three-Point'], 78);
  assert.equal(payload.attrs['Pass Accuracy'], 90);
  assert.equal(payload.attrs['Ball Handle'], 60);
  assert.equal(payload.attrs[BUILDER_FINDER_ATTRIBUTES[6]], 78);
  assert.deepEqual(payload.hset, [79]);
  assert.equal(payload.wsmin, 81);
  assert.equal(payload.wsmax, 81);
  assert.equal(payload.caps, 5);
  assert.equal(payload.fmode['Three-Point'], undefined);
});

test('builder finder payload ignores zero targets, clamps caps and omits a missing height', () => {
  const payload = builderFinderPayload({
    position: -1,
    anyPosition: true,
    height: null,
    wingspan: null,
    targets: Array(21).fill(0),
    locks: Array(21).fill(false),
    currentAlloc: Array(21).fill(25),
    caps: 99,
  });
  assert.equal(payload.pos, 'PG');
  assert.equal(payload.anyPos, true);
  assert.deepEqual(payload.attrs, {});
  assert.equal(payload.hset, null);
  assert.equal(payload.wsmin, null);
  assert.equal(payload.caps, 26);
});
