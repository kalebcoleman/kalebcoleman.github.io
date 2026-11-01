// Shared query contract for links into the public finder and its worker.
export const FINDER_ATTRIBUTES = [
  'Close Shot', 'Driving Layup', 'Driving Dunk', 'Standing Dunk', 'Post Control',
  'Mid-Range', 'Three-Point', 'Free Throw', 'Pass Accuracy', 'Ball Handle',
  'Speed w/ Ball', 'Interior D', 'Perimeter D', 'Steal', 'Block',
  'Off Rebound', 'Def Rebound', 'Speed', 'Agility', 'Strength', 'Vertical',
];
export const FINDER_POSITIONS = ['PG', 'SG', 'SF', 'PF', 'C'];

function integer(value, min, max) {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

export function capBreakerFinderLink(row, caps) {
  const attribute = integer(row?.a, 0, 20);
  const target = integer(row?.tgt, 25, 99);
  const position = integer(row?.p, 0, 4);
  const height = integer(row?.h, 69, 88);
  const breakers = integer(caps, 0, 26);
  if ([attribute, target, position, height, breakers].includes(null) || attribute === 7) {
    throw new Error('Invalid cap-breaker row');
  }
  const params = new URLSearchParams({ attribute: String(attribute), target: String(target), position: String(position), height: String(height), caps: String(breakers) });
  return `/finder/?${params}`;
}

export function parseFinderLink(search) {
  const params = new URLSearchParams(search);
  const attribute = integer(params.get('attribute'), 0, 20);
  const target = integer(params.get('target'), 25, 99);
  const position = integer(params.get('position'), 0, 4);
  const height = integer(params.get('height'), 69, 88);
  const caps = integer(params.get('caps'), 0, 26);
  if ([attribute, target, position, height, caps].includes(null) || attribute === 7) return null;
  return { attribute, target, position, height, caps };
}

export function finderPayload({ position, anyPosition, height, caps, targets, levels }) {
  const selectedHeight = integer(height, 69, 88);
  return {
    pos: FINDER_POSITIONS[position] ?? 'PG', anyPos: !!anyPosition, poss: null,
    attrs: levels ? {} : targets, fmode: {}, btw: {}, land: {}, maxv: {}, kmax: {},
    caps: caps === 'auto' ? 'auto' : integer(caps, 0, 26) ?? 0,
    lean: false, hard: false, spez: null, capcat: null,
    hmin: null, hmax: null, hset: selectedHeight === null ? null : [selectedHeight],
    wsmin: null, wsmax: null, comm: null,
    ...(levels ? { levels } : {}),
  };
}
