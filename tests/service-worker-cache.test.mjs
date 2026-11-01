import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

test('a new static cache fetches fresh files instead of seeding stale HTTP cache', async () => {
  const source = await readFile(new URL('../sw.js', import.meta.url), 'utf8');
  const handlers = {}, network = [], saved = [];
  const cache = { match: async () => undefined, put: async (...args) => saved.push(args) };
  const context = {
    self: { location: { origin: 'https://example.test' }, addEventListener: (name, fn) => { handlers[name] = fn; } },
    caches: { open: async () => cache }, URL, Response,
    fetch: async (...args) => { network.push(args); return { ok: true, type: 'basic', clone() { return this; } }; },
  };
  vm.runInNewContext(source, context);
  let response;
  const request = { method: 'GET', url: 'https://example.test/assets/builder-rules.mjs', mode: 'cors', headers: { get: () => '' } };
  handlers.fetch({ request, respondWith: promise => { response = promise; } });
  await response;
  assert.equal(network.length, 1);
  assert.equal(network[0][1].cache, 'no-store');
  assert.equal(saved.length, 1);
});
