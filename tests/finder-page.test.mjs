import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the finder exposes result sorting and multi-build comparison', async () => {
  const script = await readFile(new URL('../assets/finder-page.mjs', import.meta.url), 'utf8');
  assert.match(script, /Sort results/);
  assert.match(script, /Highest true overall/);
  assert.match(script, /Most free points/);
  assert.match(script, /Most badges/);
  assert.match(script, /comparePanel/);
  assert.match(script, /Compare \$\{selected\.length\} builds/);
  assert.match(script, /fb_finder_last/);
  const recents = await readFile(new URL('../assets/builder-recents.mjs', import.meta.url), 'utf8');
  assert.match(recents, /Last finder search/);
  assert.match(recents, /buildLink/);
});
