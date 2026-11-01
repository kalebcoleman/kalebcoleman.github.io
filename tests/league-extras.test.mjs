import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('the league view adds local standings, leaders and challenges', async () => {
  const script = await readFile(new URL('../assets/league-DJOCnJxr.js', import.meta.url), 'utf8');
  assert.match(script, /league-core/);
  assert.match(script, /Season board/);
  assert.match(script, /Leaders/);
  assert.match(script, /Challenges/);
  assert.match(script, /fb_my_games/);
});
