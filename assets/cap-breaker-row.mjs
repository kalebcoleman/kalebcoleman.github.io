/**
 * Cap-breaker row → builder handoff.
 *
 * The reference finder row does not include a complete allocation. The builder
 * rebuilds one with fitTargets(), which keeps the row's landing under the 99
 * wall and lowers the other attributes as needed.
 */

export const CAP_ROW_PARAMS = ['cbp', 'cbh', 'cba', 'cbt', 'cbl', 'cbs', 'cbk'];

function whole(value, min, max) {
  const number = Number(value);
  return Number.isInteger(number) && number >= min && number <= max ? number : null;
}

export function capBreakerRowQuery(row, caps) {
  const values = {
    cbp: whole(row?.p, 0, 4),
    cbh: whole(row?.h, 69, 88),
    cba: whole(row?.a, 0, 20),
    cbt: whole(row?.tgt, 25, 99),
    cbl: whole(row?.land, 25, 99),
    cbs: whole(row?.park, 25, 99),
    cbk: whole(caps, 0, 26),
  };
  if (Object.values(values).some(value => value === null) || values.cba === 7) {
    throw new Error('Invalid cap-breaker row');
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) params.set(key, String(value));
  return params.toString();
}

export function parseCapBreakerRow(search) {
  const params = new URLSearchParams(search);
  const values = {};
  for (const key of CAP_ROW_PARAMS) {
    const raw = params.get(key);
    if (raw === null || raw === '') return null;
    const number = Number(raw);
    if (!Number.isInteger(number)) return null;
    values[key] = number;
  }
  if (values.cbp < 0 || values.cbp > 4) return null;
  if (values.cbh < 69 || values.cbh > 88) return null;
  if (values.cba < 0 || values.cba > 20 || values.cba === 7) return null;
  if (values.cbt < 25 || values.cbt > 99) return null;
  if (values.cbl < 25 || values.cbl > 99) return null;
  if (values.cbs < 25 || values.cbs > 99) return null;
  if (values.cbk < 0 || values.cbk > 26) return null;
  return {
    position: values.cbp,
    height: values.cbh,
    attribute: values.cba,
    target: values.cbt,
    land: values.cbl,
    park: values.cbs,
    caps: values.cbk,
  };
}

export function capRowNotice(row, names, positions, overall = null) {
  const position = positions?.[row.position] ?? `Position ${row.position}`;
  const attribute = names?.[row.attribute] ?? `Attribute ${row.attribute + 1}`;
  const feet = `${Math.floor(row.height / 12)}'${row.height % 12}"`;
  const landed = Number.isFinite(overall) ? ` The build landed at Overall ${Math.round(overall)};` : '';
  return `Built cap-breaker row: ${position} ${feet} · ${attribute} ${row.park} → ${row.land} · ${row.caps} cap breaker${row.caps === 1 ? '' : 's'}.${landed} other attributes were lowered to keep it legal under the 99 overall wall.`;
}
