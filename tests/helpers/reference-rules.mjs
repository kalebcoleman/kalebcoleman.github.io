import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { t as Kernel } from '../../assets/kernel-BWpHXNaH.js';

// Execute only the shipped engine prefix containing the real build rules.
export async function loadRules() {
  const worker = await readFile(new URL('../../assets/reference-finder-worker.js', import.meta.url), 'utf8');
  const source = await readFile(new URL('../../assets/lab-engine.js', import.meta.url), 'utf8');
  globalThis.self = globalThis;
  globalThis.location = { href: 'https://example.test/', origin: 'https://example.test', hostname: 'example.test' };
  globalThis.postMessage = () => {};
  vm.runInThisContext(worker.slice(0, worker.indexOf('(function(A){"use strict"')));
  const start = source.lastIndexOf('(function(){', source.indexOf('function F(A,Y,j){for(var e=0;e<24'));
  const end = source.indexOf('var ej=99;', start) + 'var ej=99;'.length;
  assert.ok(start >= 0 && end > start, 'reference rule engine was located');
  vm.runInThisContext(source.slice(start, end) + 'window.testRules={ratingOf:J,settle:F,ceilingsFor:h,overallOf:c,trueOvr:G};})();');
  const body = JSON.parse(await readFile(new URL('../../data/body.json', import.meta.url), 'utf8'));
  const bytes = await readFile(new URL('../../data/math/capmath.bin', import.meta.url));
  const ceilings = Uint8Array.from(bytes.subarray(0, 199185));
  return { engine: globalThis.testRules, kernel: new Kernel({ body, math: { ceilings } }) };
}
