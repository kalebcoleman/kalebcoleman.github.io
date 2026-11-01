import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('shot animation classifications include all recovered shot categories', async () => {
  const data = JSON.parse(await readFile(new URL('../data/animations.json', import.meta.url), 'utf8'));
  const counts = new Map();
  for (const row of data.rows) if (row[5] === 1) counts.set(row[1], (counts.get(row[1]) || 0) + 1);
  assert.equal(data.rows.length, 2494);
  for (const [name, expected] of [['Jumper Base', 781], ['Dribble Pull-Up', 150], ['Go-To Shot', 80], ['Hop Jumper', 79], ['Spin Jumper', 32]]) {
    assert.equal(counts.get(name), expected, name);
  }
});
