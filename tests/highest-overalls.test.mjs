import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);

test('the highest-overalls page and recovered board data are present', async () => {
  const html = await readFile(new URL('highest-overalls/index.html', root), 'utf8');
  assert.match(html, /NBA 2K27 Highest Overalls/);
  assert.match(html, /\/assets\/highest-overalls\.mjs/);
  assert.match(html, /\/assets\/highest-overalls\.css/);
  assert.match(html, /id="highest"/);
  const board = JSON.parse(await readFile(new URL('data/highest-overalls.json', root), 'utf8'));
  for (const position of ['PG', 'SG', 'SF', 'PF', 'C']) {
    assert.ok(Array.isArray(board[position]['1']), position);
    assert.ok(Array.isArray(board[position]['26']), position);
    assert.ok(Array.isArray(board[position]['1s']), position);
  }
  assert.equal(board.PG['1'][0].length, 7);
});
