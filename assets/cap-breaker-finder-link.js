/*
 * "Send to finder" handoff for the cap-breaker page.
 *
 * There is no server or shared account state here. The only honest handoff is
 * to open the existing Find a build page and fill its target input. This module
 * does exactly that and reports whether the fill actually happened. It never
 * fabricates a complete build or claims one was loaded.
 */

export const FINDER_PATH = '/?tab=find';

export function finderTargetId(attributeIndex) {
  return `finder-target-${Number(attributeIndex)}`;
}

/**
 * Fill one target input in an already-opened same-origin finder window.
 * @returns {{ok: true, input: Element} | {ok: false, reason: 'blocked'|'cross-origin'|'not-ready'|'error'}}
 */
export function prefillFinderTarget(win, { attributeIndex, target } = {}) {
  if (!win) return { ok: false, reason: 'blocked' };
  let doc;
  try {
    doc = win.document;
  } catch {
    return { ok: false, reason: 'cross-origin' };
  }
  if (!doc || typeof doc.getElementById !== 'function') return { ok: false, reason: 'not-ready' };
  const input = doc.getElementById(finderTargetId(attributeIndex));
  if (!input) return { ok: false, reason: 'not-ready' };
  try {
    input.focus?.();
    input.value = String(target);
    const EventCtor = doc.defaultView?.Event ?? (typeof Event === 'function' ? Event : null);
    if (EventCtor) {
      // The builder's finder keeps its target array in a closure and updates it
      // from the input handler, so a value assignment alone is not enough.
      input.dispatchEvent(new EventCtor('input', { bubbles: true }));
      input.dispatchEvent(new EventCtor('change', { bubbles: true }));
    }
    input.scrollIntoView?.({ block: 'center' });
    return { ok: true, input };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForTarget(win, attributeIndex, timeoutMs, pollMs) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (!win || win.closed) return { ok: false, reason: 'closed' };
    let doc;
    try {
      doc = win.document;
    } catch {
      return { ok: false, reason: 'cross-origin' };
    }
    const input = doc && typeof doc.getElementById === 'function'
      ? doc.getElementById(finderTargetId(attributeIndex))
      : null;
    if (input) return { ok: true, win, input };
    if (Date.now() >= deadline) return { ok: false, reason: 'not-ready' };
    await delay(pollMs);
  }
}

/**
 * Open the existing finder and prefill exactly one target input.
 *
 * @param {object} options
 * @param {number} options.attributeIndex
 * @param {number} options.target
 * @param {(url: string) => Window|null} [options.open] injection for tests
 * @param {string} [options.base] URL base, defaults to the current page
 * @param {number} [options.timeoutMs]
 * @param {number} [options.pollMs]
 * @returns {Promise<{ok: boolean, reason?: string}>}
 */
export async function sendTargetToFinder({
  attributeIndex,
  target,
  open,
  base,
  timeoutMs = 12000,
  pollMs = 100,
} = {}) {
  const opener = open ?? (typeof window !== 'undefined' ? (url => window.open(url, '_blank')) : null);
  if (!opener) return { ok: false, reason: 'blocked' };
  let url;
  try {
    const origin = base ?? (typeof location !== 'undefined' ? location.href : undefined);
    url = new URL(FINDER_PATH, origin).toString();
  } catch {
    url = FINDER_PATH;
  }
  let win;
  try {
    win = opener(url);
  } catch {
    return { ok: false, reason: 'blocked' };
  }
  if (!win) return { ok: false, reason: 'blocked' };
  const ready = await waitForTarget(win, attributeIndex, timeoutMs, pollMs);
  if (!ready.ok) return { ok: false, reason: ready.reason };
  const filled = prefillFinderTarget(ready.win, { attributeIndex, target });
  return filled.ok ? { ok: true } : { ok: false, reason: filled.reason };
}

/** User-facing status for a send attempt. Keeps "prefilled" distinct from "loaded". */
export function describeSendResult(result, { attrName, target } = {}) {
  const wanted = `${attrName} ${target}`;
  if (result?.ok) {
    return `Opened Find a build in a new tab and prefilled the ${wanted} target. It did not load a build — check the body shown there, then press “Find builds”.`;
  }
  switch (result?.reason) {
    case 'blocked':
      return `Your browser blocked the new tab, so nothing was prefilled. Open Find a build and enter ${wanted} as the target.`;
    case 'cross-origin':
      return `The finder tab could not be reached, so nothing was prefilled. Open Find a build and enter ${wanted} as the target.`;
    case 'closed':
      return `The finder tab was closed before it was ready, so nothing was prefilled. Enter ${wanted} there if you reopen it.`;
    case 'not-ready':
      return `Opened Find a build, but its target inputs were not ready, so nothing was prefilled. Enter ${wanted} as the target there.`;
    default:
      return `Could not prefill the finder, so nothing was sent. Open Find a build and enter ${wanted} as the target.`;
  }
}
