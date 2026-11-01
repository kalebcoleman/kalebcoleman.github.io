// Service worker — F17 (specs/i18n-theme-pwa.md §3). VERSION bump semantics are REQUIRED:
// retiring a version drops stale entries (the original documented a v2 icon incident, v3 WebView
// pinning and v4 per-address docs). Policy, reproduced from the spec:
//   · non-GET → passthrough; cross-origin → IGNORED (never cached);
//   · bypass /j3d/ (206 ranges + huge payloads);
//   · docs (navigate/html) NETWORK-FIRST, re-cached under home→"/" else pathname; offline →
//     cache-by-path else "/"; a Locker-frame miss returns the inline "needs a connection" page;
//   · static same-origin CACHE-FIRST, filled on `ok && type === 'basic'`.
//
// ADDITION (rebuild-authored, not in the original — the original shipped no wasm): `/engine/*` is
// cached under a cache named after the DEPLOY MANIFEST's wasm digest instead of VERSION, so a new
// engine build is picked up on the next load and its predecessor is dropped on activate. Without
// this, the cache-first rule served the previous 1.1 MB wasm for the lifetime of a VERSION — and
// because the engine's `version()` string is unchanged across builds, nothing else could signal it.
//
// REBRAND (2026-10-15): the version string is `fb-v1`, NOT `gbl-v6`. The rebrand retires every
// pre-rebrand cache, so the name does not continue the old series: activate() deletes any cache
// that is neither the current `VERSION` nor the current engine cache, which drops `gbl-v*` and
// `gbl-engine-*` in one step (plus the pre-rebrand `gbl_engine*` URLs / engine cache name).
const VERSION = 'fb-v28';
const ENGINE_PREFIX = 'fb-engine-';
const SHELL = ['/', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/apple-touch-icon.png'];
const BYPASS = [/^\/j3d\//];

let engineCacheName = null;
/** The `/engine/*` cache, keyed by the deployed wasm digest (`engine/deploy-manifest.json`). */
async function engineCache() {
  if (!engineCacheName) {
    try {
      const res = await fetch('/engine/deploy-manifest.json', { cache: 'no-store' });
      const manifest = await res.json();
      const digest = manifest?.files?.['fb_engine_core_bg.wasm']?.sha256;
      engineCacheName = `${ENGINE_PREFIX}${String(digest || VERSION).slice(0, 12)}`;
    } catch {
      engineCacheName = `${ENGINE_PREFIX}${VERSION}`;
    }
  }
  return caches.open(engineCacheName);
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(SHELL);            // all-or-nothing
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    await engineCache(); // resolve the current engine cache name before pruning
    const keepEngine = engineCacheName;
    const names = await caches.keys();
    await Promise.all(names.filter((n) => n !== VERSION && n !== keepEngine).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;             // cross-origin ignored
  if (BYPASS.some((re) => re.test(url.pathname))) return;       // never cached

  const isDoc = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
  if (isDoc) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(request);
        const cache = await caches.open(VERSION);
        await cache.put(url.pathname === '/' ? '/' : url.pathname, fresh.clone());
        return fresh;
      } catch {
        const cache = await caches.open(VERSION);
        const byPath = await cache.match(url.pathname);
        if (byPath) return byPath;
        const home = await cache.match('/');
        if (home) return home;
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      }
    })());
    return;
  }

  if (url.pathname.startsWith('/engine/')) {
    event.respondWith((async () => {
      const cache = await engineCache();
      const hit = await cache.match(request);
      if (hit) return hit;
      const fresh = await fetch(request);
      if (fresh.ok && fresh.type === 'basic') await cache.put(request, fresh.clone());
      return fresh;
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(request);
    if (hit) return hit;
    // A new service-worker cache must not be seeded from a stale HTTP cache.
    const fresh = await fetch(request, { cache: 'no-store' });
    if (fresh.ok && fresh.type === 'basic') await cache.put(request, fresh.clone());
    return fresh;
  })());
});
