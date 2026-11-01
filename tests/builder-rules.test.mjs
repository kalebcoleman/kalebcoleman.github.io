import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { editAttribute, filterSolverResults, fitBuild, fitTargets, prepareBuild, writeTargets } from '../assets/builder-rules.mjs';
import { loadRules } from './helpers/reference-rules.mjs';

const { engine, kernel } = await loadRules();
const example = { p: 0, h: 79, w: 180, s: 79, alloc: [70,80,80,50,50,78,78,88,90,90,83,50,85,80,50,50,50,85,80,60,75], lock: Array(21).fill(false) };

test('preparing a build applies the reference linked-attribute floors', () => {
  const input = { ...example, alloc: Array(21).fill(25) };
  input.alloc[6] = 90;
  const result = prepareBuild(input, kernel, engine);
  assert.equal(result.ok, true);
  assert.notDeepEqual(result.build.alloc, input.alloc);
  const settled = [...result.build.alloc];
  engine.settle(settled, result.build.h - 63, result.caps);
  assert.deepEqual(result.build.alloc, settled);
  assert.ok(result.overall < 99);
  assert.equal(input.alloc[0], 25, 'the original input was not mutated');
});

test('edits and linked increases cannot pass the actual 99 overall wall', () => {
  let build = prepareBuild(example, kernel, engine).build;
  for (let attribute = 0; attribute < 21; attribute++) {
    const result = editAttribute(build, attribute, 99, kernel, engine);
    assert.equal(result.ok, true);
    assert.ok(result.overall < 99);
    assert.ok(result.build.alloc.every((value, i) => value >= 25 && value <= result.caps[i]));
    build = result.build;
  }
  const blocked = editAttribute(build, 6, 999, kernel, engine);
  assert.equal(blocked.ok, true);
  assert.equal(blocked.limited, true);
  assert.ok(engine.ratingOf(blocked.build.alloc, blocked.build.h - 63) < 99);
});

test('the matched 6-foot-3 finder build retains its ratings and 99-wall calculation', () => {
  const alloc = [67,82,28,28,42,79,88,63,97,97,93,25,59,33,25,25,33,89,78,32,59];
  const result = prepareBuild({ p: 0, h: 75, w: 170, s: 81, alloc }, kernel, engine);
  assert.equal(result.ok, true, result.message);
  assert.deepEqual(result.build.alloc, alloc);
  assert.ok(Math.abs(result.overall - 98.99983215332031) < 0.0001);
  assert.equal(engine.overallOf(alloc, 12, result.caps), 99);
  const edit = editAttribute(result.build, 8, 99, kernel, engine);
  assert.equal(edit.ok, true);
  assert.ok(edit.overall < 99);
});

test('invalid body, out-of-range attributes and over-budget imports are rejected', () => {
  assert.equal(prepareBuild({ ...example, p: 20 }, kernel, engine).ok, false);
  assert.equal(prepareBuild({ ...example, s: 120 }, kernel, engine).ok, false);
  assert.equal(prepareBuild({ ...example, w: 999 }, kernel, engine).ok, false);
  assert.equal(prepareBuild({ ...example, alloc: Array(21).fill(100) }, kernel, engine).ok, false);
  const caps = kernel.W(example.h, example.w, example.s);
  assert.match(prepareBuild({ ...example, alloc: caps }, kernel, engine).message, /99 overall/);
});

test('body changes adjust weight and wingspan to legal frame boundaries', () => {
  const baseline = prepareBuild({ ...example, alloc: Array(21).fill(25) }, kernel, engine).build;
  const result = prepareBuild({ ...baseline, w: 999, s: 999 }, kernel, engine, { adjustBody: true, clampAttributes: true });
  assert.equal(result.ok, true);
  const band = kernel.bands(result.build.p).find(row => row.h === result.build.h);
  assert.equal(result.build.w, band.wmax);
  assert.equal(result.build.s, result.build.h + 6);
});


test('every catalog card can be fitted to legal builder limits', async () => {
  let originalInvalid = 0;
  for (const collection of ['goats', 'goated', 'meta-builds']) {
    const data = JSON.parse(await readFile(new URL(`../data/reference-builds/${collection}.json`, import.meta.url), 'utf8'));
    for (const record of data.builds ?? data.presets) {
      const raw = record.decodedCode ?? record;
      const input = { p: raw.positionIndex, h: raw.heightInches, w: raw.weightLb, s: raw.wingspanInches,
        alloc: data.attributeOrder.map(name => raw.attributes[name]) };
      if (!prepareBuild(input, kernel, engine).ok) originalInvalid++;
      const result = fitBuild(input, kernel, engine);
      assert.equal(result.ok, true, `${record.name}: ${result.message}`);
      assert.ok(result.overall < 99, record.name);
      assert.ok(result.build.alloc.every((rating, i) => rating >= 25 && rating <= result.caps[i]), record.name);
    }
  }
  assert.ok(originalInvalid > 0, 'the catalog includes special cards that need fitting');
});

test('optimizer returns an editable build within the 99 wall', { timeout: 30000 }, async () => {
  const { runInThisContext } = await import('node:vm');
  const worker = await readFile(new URL('../assets/reference-finder-worker.js', import.meta.url), 'utf8');
  const base = prepareBuild(example, kernel, engine).build;
  let answer;
  globalThis.postMessage = message => { if (message.type === 'b:opt' || message.type === 'b:err') answer = message; };
  runInThisContext(worker, { filename: 'reference-finder-worker.js' });
  globalThis.onmessage({ data: { type: 'b:opt', obj: 'meta', st: { p: base.p, h: base.h, w: base.w, ws: base.s, alloc: base.alloc, lock: base.lock, order: [], keep: false } } });
  assert.equal(answer?.type, 'b:opt', answer?.msg);
  const checked = prepareBuild({ ...base, alloc: answer.alloc }, kernel, engine);
  assert.equal(checked.ok, true, checked.message);
  assert.ok(checked.overall < 99);
});


test('solver results must be legal and preserve badge tiers before they are shown', () => {
  kernel.env.badges = { badges: [['Test badge', [[[6, 30]], [[6, 50]], [[6, 70]], [[6, 90]]], 0]] };
  const empty = prepareBuild({ ...example, alloc: Array(21).fill(25) }, kernel, engine).build;
  const base = editAttribute(empty, 6, 70, kernel, engine).build;
  const gain = editAttribute(base, 6, 90, kernel, engine);
  assert.equal(gain.ok, true);
  assert.equal(gain.build.alloc[6], 90);
  const row = build => ({ pos: build.p, body: [build.h, build.w, build.s], alloc: build.alloc });
  const impossible = { ...row(base), alloc: kernel.W(base.h, base.w, base.s) };
  const candidates = filterSolverResults([row(base), impossible, row(gain.build)], base, kernel, engine, { preserveBadges: true, sameFrame: true, requireGain: true });
  assert.equal(candidates.length, 1);
  assert.deepEqual(candidates[0].alloc, gain.build.alloc);
});


test('writing a set of targets uses validated edits and never passes the wall', () => {
  const empty = prepareBuild({ ...example, alloc: Array(21).fill(25) }, kernel, engine).build;
  const reachable = writeTargets(empty, { 2: 60, 6: 90 }, kernel, engine);
  assert.equal(reachable.written, 2);
  assert.deepEqual(reachable.limited, []);
  assert.ok(reachable.build.alloc[2] >= 60);
  assert.ok(engine.ratingOf(reachable.build.alloc, reachable.build.h - 63) < 99);

  const atWall = prepareBuild({ p: 0, h: 75, w: 170, s: 81, lock: Array(21).fill(false), alloc: [67,82,28,28,42,79,88,63,97,97,93,25,59,33,25,25,33,89,78,32,59] }, kernel, engine).build;
  const blocked = writeTargets(atWall, { 8: 99, 9: 99 }, kernel, engine);
  assert.ok(blocked.limited.length > 0);
  assert.ok(blocked.build.alloc.every((value, index) => value >= 25 && value <= kernel.W(blocked.build.h, blocked.build.w, blocked.build.s)[index]));
  assert.ok(engine.ratingOf(blocked.build.alloc, blocked.build.h - 63) < 99);

  const raised = editAttribute(empty, 2, 70, kernel, engine).build;
  const keepHigher = writeTargets(raised, { 2: 60 }, kernel, engine, { onlyRaise: true });
  assert.equal(keepHigher.build.alloc[2], 70, 'a badge target only raises an attribute');
});


test('an over-wall finder row can be fitted down while keeping its badge target', () => {
  const row = { p: 0, h: 69, w: 152, s: 76, alloc: [92,92,60,25,59,99,99,99,99,99,99,42,81,98,48,44,53,99,99,49,99] };
  assert.equal(prepareBuild(row, kernel, engine).ok, false);
  const fitted = fitTargets(row, { 2: 60 }, kernel, engine);
  assert.equal(fitted.ok, true, fitted.message);
  assert.ok(fitted.build.alloc[2] >= 60, 'the requested badge target is kept');
  assert.ok(fitted.overall < 99);
  const band = kernel.bands(fitted.build.p).find(entry => entry.h === fitted.build.h);
  assert.ok(fitted.build.w >= band.wmin && fitted.build.w <= band.wmax);
  assert.ok(fitted.build.s >= fitted.build.h && fitted.build.s <= fitted.build.h + 6);
});
