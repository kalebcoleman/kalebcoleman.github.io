/** Convert the finder's attribute targets and locked allocations to engine pairs. */
export function finderConstraints(request) {
  const locks = Array.isArray(request.o) ? request.o : [];
  const targets = Array.isArray(request.v) ? request.v : [];
  if (locks.length && locks.length !== 21 && !targets.length) {
    return Uint8Array.from(locks, value => Math.max(0, Math.min(255, Math.round(value))));
  }
  const pairs = [];
  for (let index = 0; index < 21; index++) {
    const target = Math.max(0, Math.min(99, Math.round(Number(targets[index]) || 0)));
    const locked = locks.length === 21 && !!locks[index];
    const allocation = Math.max(0, Math.min(99, Math.round(Number(request.l?.[index]) || 0)));
    if (locked && target > allocation) {
      throw new Error('A locked attribute is below its requested target. Unlock it or lower the target.');
    }
    if (locked || target > 0) pairs.push(index, locked ? allocation : target);
  }
  return Uint8Array.from(pairs);
}

/** Never present an engine candidate that misses an explicit target or lock. */
export function meetsFinderConstraints(result, request) {
  return Array.from(request.v ?? []).every((target, index) =>
    !Number(target) || Number(result.alloc?.[index] ?? 0) >= Number(target)
  ) && Array.from(request.o?.length === 21 ? request.o : []).every((locked, index) =>
    !locked || Number(result.alloc?.[index]) === Number(request.l?.[index] ?? 0)
  );
}
