import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatTakeoverRequirements } from '../assets/takeover-data.mjs';

test('recovered takeover catalog retains requirements and effects', async () => {
  const data = JSON.parse(await readFile(new URL('../data/takeovers.json', import.meta.url), 'utf8'));
  assert.equal(data.rows.length, 24);
  const attrs = Array.from({ length: 21 }, (_, i) => `Attr ${i}`);
  const shot = data.rows.find(row => row[2] === 'Shot Artist');
  const air = data.rows.find(row => row[2] === 'Airspace');
  assert.equal(formatTakeoverRequirements(shot[4], attrs), 'Attr 6 89 or Attr 5 89');
  assert.equal(formatTakeoverRequirements(air[4], attrs), 'Attr 2 87 + Attr 20 75');
  assert.ok(data.rows.every(row => typeof row[5] === 'string' && row[5].length));
});
