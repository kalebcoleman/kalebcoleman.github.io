// Run the recovered reference badge map (b:mm) for min-max / better-frame.
export function badgeMapReference(st, sweep = false, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    let worker;
    try {
      worker = new Worker(new URL('./reference-finder-worker.js', import.meta.url));
    } catch (error) {
      reject(error instanceof Error ? error : new Error(String(error)));
      return;
    }
    const finish = () => { clearTimeout(timer); try { worker.terminate(); } catch { /* gone */ } };
    const timer = setTimeout(() => { finish(); reject(new Error('Badge map timed out.')); }, timeoutMs);
    worker.onerror = event => { finish(); reject(new Error(event.message || 'Badge map failed.')); };
    worker.onmessage = event => {
      const result = event.data || {};
      if (result.type === 'b:err' || result.type === 'error') {
        finish();
        reject(new Error(String(result.msg || 'Badge map failed.')));
        return;
      }
      if (result.type === 'b:mm') {
        finish();
        resolve({
          map: result.map || {},
          n: Number(result.n) || 0,
          spent: Number(result.spent) || 0,
          dropped: Array.isArray(result.dropped) ? result.dropped : [],
          sweep: !!result.sweep,
          engine: 'reference badge map',
        });
      }
    };
    worker.postMessage({ type: 'b:mm', st, sweep: !!sweep });
  });
}
