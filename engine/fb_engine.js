/**
 * Free Builder — engine seam adapter (ES module for the browser).
 *
 * This is the file the web layer loads at `/engine/fb_engine.js`
 * (`web/src/engine/wasm.ts` → `probeEngine()`, contract in
 * `web/src/engine/ENGINE_SEAM.md` §2). It is produced by
 * `node engine/tools/package-engine.mjs`, which builds the Rust crate with
 * wasm-pack (`--out-name fb_engine_core`) and copies this file next to the
 * generated module.
 *
 * ## Why an adapter exists
 *
 * wasm-pack's `--target web` module exports the raw wasm-bindgen surface:
 * a `default` async instantiation function, `initSync`, and one named export
 * per `#[wasm_bindgen]` function. The seam contract requires the documented
 * shape instead:
 *
 *     init(input?)  -> Promise<{ version: string }>
 *     capMath()     -> { E, W, overall, slot, … }
 *
 * The two would collide on the name `init` (the core module already exports a
 * readiness check called `init`), and the core `init` returns `undefined` while
 * the seam expects a `{ version }` record — so the seam is expressed here as an
 * explicit, additive adapter rather than by renaming the Rust exports. Every
 * other core export is re-exported verbatim, so `import('/engine/fb_engine.js')`
 * exposes the complete engine surface.
 *
 * ## Layout shipped to the web
 *
 *     /engine/fb_engine.js            ← this adapter (the seam module)
 *     /engine/fb_engine_core.js       ← wasm-pack output (generated)
 *     /engine/fb_engine_core_bg.wasm  ← the wasm binary (generated)
 *     /engine/package.json             ← {"type":"module"} (generated)
 *
 * The module resolves `fb_engine_core_bg.wasm` relative to `fb_engine_core.js`
 * (`new URL(..., import.meta.url)`), so the whole directory can be served as
 * static files from any path — including a `FB_ENGINE_URL` override.
 *
 * 100% static: no network calls beyond the same-origin wasm fetch, no DOM access,
 * no accounts, no premium gate (`AGENTS.md`, `docs/research/specs/*` decisions).
 */

// Re-export the complete engine surface. `export *` deliberately skips `default`
// and is shadowed by the local `init` below (an explicit export always wins over
// a star export), so `init` here is the seam's promise-returning entry point.
export * from './fb_engine_core.js';

import * as core from './fb_engine_core.js';

/** Number of attributes in every allocation. */
export const ATTRS = 21;

/** Default height for the `capMath()` helpers when no body is supplied. */
export const DEFAULT_HEIGHT = 75;

/**
 * Instantiate the wasm module and run the engine's start-up integrity gate.
 *
 * @param {{ module?: WebAssembly.Module | Uint8Array | ArrayBuffer,
 *           wasmBytes?: Uint8Array | ArrayBuffer,
 *           module_or_path?: WebAssembly.Module | Uint8Array | ArrayBuffer }} [input]
 *   Optional pre-loaded wasm bytes. Omit it in the browser: the default path
 *   fetches `fb_engine_core_bg.wasm` from next to this module using
 *   `import.meta.url`. Tests pass the bytes directly so the same module can be
 *   exercised with no HTTP server (see `engine/tools/check-seam.mjs`).
 * @returns {Promise<{ version: string }>} the engine version (cache-busting).
 * @throws {Error} when the wasm cannot be instantiated, or when the embedded
 *   tables fail their start-up integrity check (`init()` in `src/lib.rs`).
 */
export async function init(input) {
  const source =
    input && (input.module ?? input.wasmBytes ?? input.module_or_path);

  if (source !== undefined && source !== null) {
    const module =
      source instanceof WebAssembly.Module
        ? source
        : new WebAssembly.Module(source);
    core.initSync({ module });
  } else {
    // Browser path: instantiate ./fb_engine_core_bg.wasm.
    await core.default();
  }

  // Table + archetype integrity gate: throws on corruption, in which case
  // `probeEngine()` correctly reports `kind: 'fallback'` instead of rendering
  // numbers from a broken table set.
  try {
    core.init();
  } catch (err) {
    throw new Error(`fb-engine integrity gate failed: ${String(err)}`);
  }

  return { version: core.version() };
}

/** Coerce `number[] | Uint8Array` to the `Uint8Array` the core expects. */
function bytes(alloc) {
  return alloc instanceof Uint8Array ? alloc : Uint8Array.from(alloc ?? []);
}

/** Accept `number | [h, w, ws] | { h, w, ws } | { height }`; default 75". */
function heightOf(body) {
  if (typeof body === 'number' && Number.isFinite(body)) return body | 0;
  if (Array.isArray(body)) return Number(body[0]) | 0;
  if (body && typeof body === 'object') {
    if (Number.isFinite(body.h)) return body.h | 0;
    if (Number.isFinite(body.height)) return body.height | 0;
  }
  return DEFAULT_HEIGHT;
}

/**
 * The cap-math kernel in the shape the seam documents
 * (`web/src/engine/ENGINE_SEAM.md` §2, `web/src/engine/wasm.ts` `CapMath`).
 *
 * Every member mirrors the recovered kernel exactly
 * (`docs/research/specs/builder-cap-math.md`):
 *
 * * `E(h, w, ws)` — ceilings-table budget index; `-1` when the body is illegal.
 * * `W(h, w, ws)` — the 21 attribute ceilings; `[]` when the body is illegal.
 * * `overall(alloc, body)` — displayed overall via the per-`e` 4-point map,
 *   **unrounded** (the UI applies `J()`/`floor` for display). `-1` on a bad
 *   allocation. `body` is optional; see `heightOf`.
 * * `slot(alloc, body)` — the best of the 15 weighted slot scores, floored at 25.
 *
 * Extras (additive, documented in `engine/ENGINE_API.md`):
 * `trueOverall` (`c()` fixup), `bands` (`N.pos`), `caps` (alias of `W`),
 * `heights` (legal heights for a position), `version`.
 */
export function capMath() {
  return {
    E(h, w, ws) {
      return core.budget_index(h | 0, w | 0, ws | 0);
    },
    W(h, w, ws) {
      return Array.from(core.ceilings(h | 0, w | 0, ws | 0));
    },
    caps(h, w, ws) {
      return Array.from(core.ceilings(h | 0, w | 0, ws | 0));
    },
    overall(alloc, body) {
      return core.overall(bytes(alloc), heightOf(body));
    },
    slot(alloc, body) {
      return core.slot_score(bytes(alloc), heightOf(body));
    },
    /**
     * `c(A, e, caps)` — the true-overall fixup. `caps` is required (it is what
     * makes the `+1` probe meaningful); `body` only supplies the height and
     * defaults to `DEFAULT_HEIGHT`. `-1` on a malformed allocation or caps array.
     */
    trueOverall(alloc, caps, body) {
      return core.true_overall(
        bytes(alloc),
        bytes(caps),
        heightOf(body),
      );
    },
    /** `N.pos` bands for a position as `[pos, h, wmin, wmax]` quadruples. */
    bands(pos) {
      const flat = core.body_bands();
      const out = [];
      for (let i = 0; i + 3 < flat.length; i += 4) {
        if (flat[i] === (pos | 0)) {
          out.push([flat[i], flat[i + 1], flat[i + 2], flat[i + 3]]);
        }
      }
      return out;
    },
    version() {
      return core.version();
    },
  };
}
