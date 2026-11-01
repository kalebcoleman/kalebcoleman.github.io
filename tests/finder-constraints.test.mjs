import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { finderConstraints, meetsFinderConstraints } from '../assets/finder-constraints.mjs';
import * as engine from '../engine/fb_engine.js';

await engine.init({ wasmBytes: await readFile(new URL('../engine/fb_engine_core_bg.wasm', import.meta.url)) });
const targets = Array(21).fill(0);
targets[6] = 78; targets[8] = 90; targets[9] = 90;
const request = { v: targets, o: Array(21).fill(false), l: Array(21).fill(25) };

test('finder returns only candidates meeting requested attribute targets', () => {
  const result = JSON.parse(engine.finder_search(-1, 0, 0, 12, finderConstraints(request)));
  const matches = result.res.filter(candidate => meetsFinderConstraints(candidate, request));
  assert.ok(matches.length > 0);
  for (const candidate of matches) {
    assert.ok(candidate.alloc[6] >= 78);
    assert.ok(candidate.alloc[8] >= 90);
    assert.ok(candidate.alloc[9] >= 90);
  }
});

test('impossible center ball-handle target does not produce a false match', () => {
  const result = JSON.parse(engine.finder_search(4, 0, 0, 12, finderConstraints(request)));
  assert.equal(result.res.filter(candidate => meetsFinderConstraints(candidate, request)).length, 0);
});

test('conflicting locked attribute and target reports an error', () => {
  const locked = { v: targets, o: Array(21).fill(false), l: Array(21).fill(25) };
  locked.o[9] = true;
  assert.throws(() => finderConstraints(locked), /locked attribute/i);
});
