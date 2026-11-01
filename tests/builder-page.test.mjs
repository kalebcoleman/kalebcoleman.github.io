import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the builder exposes fill, reset, clear-breakers and build-name controls', async () => {
  const script = await readFile(new URL('../assets/builder-DRDtM3V1.js', import.meta.url), 'utf8');
  assert.match(script, /Fill to 99/);
  assert.match(script, /Clear breakers/);
  assert.match(script, /Keep my build name/);
  assert.match(script, /buildName/);
  assert.match(script, /tierCost/);
});
