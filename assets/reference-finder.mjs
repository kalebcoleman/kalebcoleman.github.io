/**
 * Browser wrapper for the recovered reference finder worker.
 *
 * The worker is the public Goated Build Lab finder worker. It runs locally,
 * sends progress messages and returns the same result shape the reference
 * finder used: pos, body, alloc, order, after, needs, used, met, live, points,
 * gain, capFree, bs, nfree, tokShort and alt.
 */
export function findReferenceBuilds(raw, { onProgress, timeoutMs = 45000 } = {}) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL('./reference-finder-worker.js', import.meta.url));
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    const id = Math.floor(Math.random() * 0x7fffffff);
    const timer = setTimeout(() => {
      finish();
      reject(new Error('the reference finder did not answer in time'));
    }, timeoutMs);
    function finish() {
      clearTimeout(timer);
      try { worker.terminate(); } catch { /* already gone */ }
    }
    worker.onmessage = event => {
      const data = event?.data ?? {};
      if (data.type === 'prog') {
        onProgress?.({
          done: Number(data.d) || 0,
          total: Number(data.t) || 1,
          note: data.note ? String(data.note) : '',
          pos: data.pos ?? null,
        });
        return;
      }
      if (data.type === 'error') {
        finish();
        reject(new Error(String(data.msg || 'the reference finder failed')));
        return;
      }
      if (data.type === 'done') {
        finish();
        resolve({
          res: Array.isArray(data.res) ? data.res : [],
          caps: data.caps,
          skipped: data.skipped ?? [],
          notes: data.notes ?? [],
          ms: Number(data.ms) || 0,
          raised: data.raised ?? null,
          preps: data.preps ?? [],
        });
      }
    };
    worker.onerror = event => {
      finish();
      reject(new Error(event?.message || 'the reference finder worker failed to start'));
    };
    try {
      worker.postMessage({ type: 'find', id, raw, sets: [], sort: 'value' });
    } catch (error) {
      finish();
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
}

export function buildQuery(result) {
  const params = new URLSearchParams();
  params.set('p', String(result.pos));
  params.set('h', String(result.body?.[0] ?? 75));
  params.set('w', String(result.body?.[1] ?? 185));
  params.set('s', String(result.body?.[2] ?? 80));
  params.set('v', (result.alloc ?? []).join('.'));
  return params.toString();
}

export function buildLink(result) {
  return `/builder?${buildQuery(result)}`;
}
