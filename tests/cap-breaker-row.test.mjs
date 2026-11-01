import test from 'node:test';
import assert from 'node:assert/strict';
import { capBreakerRowQuery, capRowNotice, parseCapBreakerRow } from '../assets/cap-breaker-row.mjs';

const row = { p: 0, h: 69, a: 2, tgt: 77, land: 77, park: 28 };

test('cap-breaker row query round-trips through the builder parser', () => {
  const query = capBreakerRowQuery(row, 5);
  assert.equal(query, 'cbp=0&cbh=69&cba=2&cbt=77&cbl=77&cbs=28&cbk=5');
  assert.deepEqual(parseCapBreakerRow(`?${query}`), {
    position: 0,
    height: 69,
    attribute: 2,
    target: 77,
    land: 77,
    park: 28,
    caps: 5,
  });
});

test('cap-breaker row parser rejects missing, out-of-range and Free Throw rows', () => {
  assert.equal(parseCapBreakerRow(''), null);
  assert.equal(parseCapBreakerRow('?cbp=0&cbh=69&cba=7&cbt=77&cbl=77&cbs=28&cbk=5'), null);
  assert.equal(parseCapBreakerRow('?cbp=5&cbh=69&cba=2&cbt=77&cbl=77&cbs=28&cbk=5'), null);
  assert.equal(parseCapBreakerRow('?cbp=0&cbh=69&cba=2&cbt=77&cbl=77&cbs=28&cbk=27'), null);
});

test('cap-breaker notice names the row landing and breaker count', () => {
  const notice = capRowNotice(
    { position: 0, height: 69, attribute: 2, land: 77, park: 28, caps: 5 },
    ['Close Shot', 'Driving Layup', 'Driving Dunk'],
    ['PG', 'SG', 'SF', 'PF', 'C'],
  );
  assert.match(notice, /PG 5'9"/);
  assert.match(notice, /Driving Dunk 28 → 77/);
  assert.match(notice, /5 cap breakers/);
});
