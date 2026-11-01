/**
 * Types for the engine seam module `/engine/fb_engine.js`.
 *
 * The core wasm-bindgen surface is re-exported verbatim; this file adds the
 * seam entry points documented in `web/src/engine/ENGINE_SEAM.md` §2.
 */
export * from './fb_engine_core.js';

/** Attributes per allocation. */
export declare const ATTRS: number;
/** Default height used by the `capMath()` helpers when no body is given. */
export declare const DEFAULT_HEIGHT: number;

export interface InitInput {
  /** Pre-compiled wasm module, or its bytes (tests / custom loaders). */
  module?: WebAssembly.Module | Uint8Array | ArrayBuffer;
  /** Raw wasm bytes (alias of `module`). */
  wasmBytes?: Uint8Array | ArrayBuffer;
  /** wasm-bindgen's own parameter name for the same thing. */
  module_or_path?: WebAssembly.Module | Uint8Array | ArrayBuffer;
}

/** A body as `[height, weight, wingspan]`, a bare height, or the default. */
export type BodyRef = number | [number, number, number] | { h?: number; height?: number };

export interface SeamCapMath {
  /** `E(h,w,ws)` — ceilings-table budget index, `-1` when the body is illegal. */
  E(h: number, w: number, ws: number): number;
  /** `W(h,w,ws)` — the 21 ceilings, `[]` when the body is illegal. */
  W(h: number, w: number, ws: number): number[];
  /** Alias of `W`. */
  caps(h: number, w: number, ws: number): number[];
  /** Displayed overall (unrounded); `-1` on a bad allocation. */
  overall(alloc: number[] | Uint8Array, body?: BodyRef): number;
  /** Best of the 15 weighted slot scores, floored at 25; `-1` on a bad allocation. */
  slot(alloc: number[] | Uint8Array, body?: BodyRef): number;
  /** `c(A, e, caps)` — the true-overall fixup. */
  trueOverall(alloc: number[] | Uint8Array, caps: number[] | Uint8Array, body?: BodyRef): number;
  /** `N.pos` bands for a position as `[pos, h, wmin, wmax]` quadruples. */
  bands(pos: number): Array<[number, number, number, number]>;
  version(): string;
}

/** Instantiate the wasm module and run the start-up integrity gate. */
export declare function init(input?: InitInput): Promise<{ version: string }>;

/** The cap-math kernel in the seam's documented shape. */
export declare function capMath(): SeamCapMath;
