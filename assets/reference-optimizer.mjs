// Run the recovered browser-local optimization worker with the current build.
export function optimizeReference(st, objective) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./reference-finder-worker.js', import.meta.url));
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    const timer = setTimeout(() => { finish(); reject(new Error('Optimization timed out.')); }, 30000);
    worker.onerror = event => { finish(); reject(new Error(event.message || 'Optimization failed.')); };
    worker.onmessage = event => {
      const result = event.data || {};
      if (result.type === 'b:err') { finish(); reject(new Error(result.msg || 'Optimization failed.')); }
      if (result.type === 'b:opt') {
        finish();
        resolve({ ...result, msg: String(result.msg || '').replace(/<[^>]*>/g, ''), engine: 'local optimizer' });
      }
    };
    worker.postMessage({ type: 'b:opt', obj: objective, st });
  });
}
