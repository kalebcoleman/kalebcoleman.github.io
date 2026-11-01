import { initMotionStyles, loadCatalog } from '../assets/motion-styles.mjs';

const DATA_URL = new URL('../data/motion-styles.json', import.meta.url);

function showError(error) {
  const status = document.getElementById('motion-status');
  const empty = document.getElementById('motion-empty');
  if (status) status.textContent = 'The motion-style data could not be loaded.';
  if (empty) {
    empty.hidden = false;
    const message = document.createElement('p');
    message.textContent = 'The recovered motion-style file is missing or unreadable. Serve the site from a local web server and reload.';
    const detail = document.createElement('p');
    detail.className = 'hint';
    detail.textContent = error instanceof Error ? error.message : String(error);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'btn';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => globalThis.location.reload());
    empty.replaceChildren(message, detail, retry);
  }
  console.error('Motion styles could not start.', error);
}

async function start() {
  if (document.readyState === 'loading') {
    await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, { once: true }));
  }

  try {
    const data = await loadCatalog(DATA_URL);
    initMotionStyles(data);
    document.documentElement.dataset.motionStyles = 'ready';
  } catch (error) {
    document.documentElement.dataset.motionStyles = 'error';
    showError(error);
  }
}

// A same-directory service worker keeps the page, data and module available
// offline after the first visit. Registration is optional: the catalog still
// works normally when service workers are unavailable or blocked.
async function registerOfflineCopy() {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(globalThis.location.protocol)) return;
  try {
    await navigator.serviceWorker.register(new URL('./sw.js', import.meta.url), { scope: '/motion-styles/' });
  } catch {
    /* offline caching is a progressive enhancement */
  }
}

start();
registerOfflineCopy();
