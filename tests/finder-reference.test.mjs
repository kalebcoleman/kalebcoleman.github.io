import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { capBreakerFinderLink, finderPayload, parseFinderLink } from '../assets/finder-query.mjs';
import { prepareBuild } from '../assets/builder-rules.mjs';
import { loadRules } from './helpers/reference-rules.mjs';

test('cap-breaker row links preserve frame, target and breaker budget', () => {
  const row = { p: 1, h: 75, a: 6, tgt: 91 };
  const url = new URL(capBreakerFinderLink(row, 5), 'https://example.test');
  assert.equal(url.pathname, '/finder/');
  assert.deepEqual(parseFinderLink(url.search), { position: 1, height: 75, attribute: 6, target: 91, caps: 5 });
  assert.equal(parseFinderLink('?attribute=6&target=91&position=1&height=75&caps=27'), null);
  assert.equal(parseFinderLink('?attribute=7&target=91&position=1&height=75&caps=5'), null);
  assert.throws(() => capBreakerFinderLink({ ...row, h: 100 }, 5), /Invalid/);
});

test('reference worker searches the selected height before ranking results', { timeout: 90000 }, async () => {
  // The actual shipped classic worker, with only the host globals a worker provides.
  const { engine, kernel } = await loadRules();
  const source = await readFile(new URL('../assets/reference-finder-worker.js', import.meta.url), 'utf8');
  const raw = finderPayload({ position: 0, anyPosition: true, height: '75', caps: '0', targets: { 'Three-Point': 78 } });
  assert.deepEqual(raw.hset, [75]);
  let complete;
  const answer = new Promise((resolve, reject) => {
    complete = message => {
      if (message.type === 'done') resolve(message);
      if (message.type === 'error' || message.type === 'b:err') reject(new Error(message.msg));
    };
  });
  globalThis.self = globalThis;
  globalThis.location = { href: 'https://example.test/assets/reference-finder-worker.js', origin: 'https://example.test', hostname: 'example.test' };
  globalThis.postMessage = message => complete(message);
  vm.runInThisContext(source, { filename: 'reference-finder-worker.js' });
  globalThis.onmessage({ data: { type: 'find', id: 1, raw, sets: [], sort: 'value' } });
  const result = await answer;
  assert.ok(result.res.length > 0, 'a legal height should return builds');
  assert.ok(result.res.every(row => row.body[0] === 75), 'every returned build uses the requested height');
  assert.ok(result.res.every(row => row.alloc[6] >= 78), 'every returned build meets its three-point target');
  for (const row of result.res) {
    const checked = prepareBuild({ p: row.pos, h: row.body[0], w: row.body[1], s: row.body[2], alloc: row.alloc }, kernel, engine);
    assert.equal(checked.ok, true, checked.message);
    assert.deepEqual(checked.build.alloc, row.alloc, 'loading a finder result should not change its attributes');
  }
  const secondAnswer = new Promise((resolve, reject) => {
    complete = message => {
      if (message.type === 'done') resolve(message);
      if (message.type === 'error' || message.type === 'b:err') reject(new Error(message.msg));
    };
  });
  const row = { p: 0, h: 69, a: 2, tgt: 77 };
  const prefill = parseFinderLink(new URL(capBreakerFinderLink(row, 5), 'https://example.test').search);
  const secondRaw = finderPayload({ position: prefill.position, anyPosition: false, height: prefill.height, caps: prefill.caps, targets: { 'Driving Dunk': prefill.target } });
  globalThis.onmessage({ data: { type: 'find', id: 2, raw: secondRaw, sets: [], sort: 'value' } });
  const second = await secondAnswer;
  assert.ok(second.res.length > 0, 'a cap-breaker row should lead to matching builds');
  assert.ok(second.res.every(candidate => candidate.pos === 0 && candidate.body[0] === 69 && candidate.after[2] >= 77));
  assert.ok(second.res.some(candidate => candidate.alloc[2] < candidate.after[2]), 'base and post-breaker values must remain distinguishable');
});
