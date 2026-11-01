/* tslint:disable */
/* eslint-disable */

/**
 * `_A` — the advisory engine's rule set as JSON `[{"id","head","why"}]`.
 *
 * **Reconstruction:** the evidence itemises five rule *tests* verbatim; the
 * remaining rule bodies are not in the artifact. `id` 0..4 are the verbatim
 * rules, 5..8 are rebuild-authored advisories marked `"original":true`.
 */
export function advisories(pos: number, height: number, alloc: Uint8Array, caps: Uint8Array): string;

/**
 * The 48-category histogram as JSON `[{count,name},…]`, count-descending.
 */
export function animation_categories(): string;

/**
 * `f.length`.
 */
export function animation_count(): number;

/**
 * The documented animation filter. Returns matching names as JSON.
 */
export function animation_filter(category: string, height: number, alloc: Uint8Array): string;

/**
 * `_Y(build)` — apply cap-breaker levels (12 entries) to an allocation.
 */
export function apply_cap_breakers(alloc: Uint8Array, caps: Uint8Array, pos: number, levels: Uint8Array): Uint8Array;

/**
 * `DescName.names.length`.
 */
export function archetype_count(): number;

/**
 * `DescName.describe(alloc, pos)`; `"null"` when nothing matches.
 */
export function archetype_describe(alloc: Uint8Array, pos: number): string;

/**
 * Archetype table integrity check; returns `""` when healthy.
 */
export function archetype_integrity(): string;

/**
 * `maskFor(pos, e)` — `-1` for the `null` case (`e <= 2 || e > 7`).
 */
export function archetype_mask_for(pos: number, e: number): number;

/**
 * `whenReady()`.
 */
export function archetype_ready(): boolean;

/**
 * `m.length`.
 */
export function badge_count(): number;

/**
 * `isOr` flags as `0/1` per row.
 */
export function badge_is_or_flags(): Uint8Array;

/**
 * All badge names, in table order (i18n glossary indices are load-bearing).
 */
export function badge_names(): string;

/**
 * `y[idx]` — the related-badge graph row.
 */
export function badge_related(index: number): Uint8Array;

/**
 * One badge row as JSON, or `"null"`.
 */
export function badge_row(name: string): string;

/**
 * `x(attr, tier)` — badges in the band, sorted by `(isOr, tier)`, as JSON
 * `[{"name":…,"tier":…}]`.
 */
export function badges_in_band(attr: number, tier: number): string;

/**
 * `OA(p)` — the best legal height for a position, or `-1`.
 */
export function best_legal_height(pos: number): number;

/**
 * All `N.pos` bands as `[pos, h, wmin, wmax]` quadruples (flattened).
 */
export function body_bands(): Uint16Array;

/**
 * `E(h,w,ws)` — the ceilings-table budget index, or `-1` when illegal.
 */
export function budget_index(h: number, w: number, ws: number): number;

/**
 * `E` with the full gate (position, weight floor, eligibility band).
 */
export function budget_index_checked(pos: number, h: number, w: number, ws: number): number;

/**
 * `E(h,w,ws)` — exposed for parity tests in the web layer.
 */
export function budget_index_formula(h: number, w: number, ws: number): number;

/**
 * `wY` — the 12 categories as JSON.
 */
export function cap_breaker_categories(): string;

/**
 * `qY` — the ladder as JSON `[null,{t,cap},…]`.
 */
export function cap_breaker_ladder(): string;

/**
 * `To(raw)` — parse `fb.lbrk`. `f_caps` is the `#fCaps` control value (pass
 * `-1` when absent).
 */
export function cap_breaker_level(stored: string, f_caps: number): number;

/**
 * `OY`.
 */
export function cap_breaker_max_level(): number;

/**
 * `CARD2K` per-game caps `[pts,reb,ast,stl,blk,tov,fouls]`.
 */
export function card_caps(): Uint8Array;

/**
 * Export filename for the PNG share path.
 */
export function card_export_filename(): string;

/**
 * `CARD2K` height bands `[PGlo,PGhi,SGlo,SGhi,…]`.
 */
export function card_height_bands(): Uint8Array;

/**
 * `_numOf(raw)` as JSON, or `"null"`.
 */
export function card_num_of(raw: string): string;

/**
 * `navigator.share` text for the card.
 */
export function card_share_text(origin: string): string;

/**
 * `W(h,w,ws)` — the 21 ceilings, or an empty array when the body is illegal.
 */
export function ceilings(h: number, w: number, ws: number): Uint8Array;

/**
 * `W` — the ceilings table digest metadata as JSON (`{len, rows, cols}`).
 */
export function ceilings_meta(): string;

/**
 * The exhaustive legal-frame scan.
 *
 * * `pos` — 0..4, or `-1` for "any position".
 * * `target` — desired displayed overall (`0` = best frame).
 * * `cap_level` — `fb.lbrk` in `0..=26`.
 * * `top` — how many ranked results to return.
 * * `lock` — flattened `[attr, value, …]` pairs to hold fixed.
 *
 * Returns the `done` payload shape as JSON.
 */
export function finder_search(pos: number, target: number, cap_level: number, top: number, lock: Uint8Array): string;

/**
 * The float array formatting helper used internally, exposed for the UI's
 * tooltips (kept tiny on purpose).
 */
export function format_floats(values: Float64Array): string;

/**
 * `fround` — exposed so the web layer can mirror the kernel exactly.
 */
export function fround(x: number): number;

/**
 * Message catalogue for the engine's own validation failures (`u()` gate,
 * decode failures). The web layer maps these to i18n keys.
 */
export function gate_message(kind: number, a: number, b: number): string;

/**
 * `/#p=\d/` — a share link lands in Builder.
 */
export function hash_sets_finder_home(hash: string): boolean;

/**
 * `bA(h)` — the height worth-scalar.
 */
export function height_scalar(h: number): number;

/**
 * One-shot start-up check: parses every embedded table and verifies the
 * archetype integrity counts. Throws with a message when anything is off.
 */
export function init(): void;

/**
 * `ws.ids` — the 27 Jumpshot Lab persistence field names, in shipped order.
 */
export function jumper_ids(): string;

/**
 * `qA(attr, cur)` -> `[dead, last, next, gap]`.
 */
export function ladder_gap(attr: number, cur: number): Uint8Array;

/**
 * The number of legal frames in the exhaustive scan (all positions).
 */
export function legal_frame_count(): number;

/**
 * The number of legal frames for one position.
 */
export function legal_frame_count_pos(pos: number): number;

/**
 * `SA` meter marks as `[{label,value}]`.
 */
export function meter_marks(): string;

/**
 * `gA` meter states.
 */
export function meter_states(): string;

/**
 * `F(A, e, caps)` — the min-attribute closure.
 */
export function min_closure(alloc: Uint8Array, h: number, w: number, ws: number): Uint8Array;

/**
 * `checksums().of`.
 */
export function ocr_checksum_total(): number;

/**
 * Tesseract parameters: `pageseg`, `whitelistStats`, `whitelistNames`.
 */
export function ocr_params(): string;

/**
 * `_parseCell(raw)` as JSON, or `"null"`.
 */
export function ocr_parse_cell(raw: string): string;

/**
 * `BOXSCORE.STAT_NAMES` as JSON.
 */
export function ocr_stat_names(): string;

/**
 * Displayed overall (clamped to 25..99), or `-1` on a bad allocation.
 */
export function overall(alloc: Uint8Array, height: number): number;

/**
 * `b:pkpick{row,caps}` — partner attributes for a park.
 */
export function park_partners(attr: number, pos: number): Uint8Array;

/**
 * `b:parks{attr,caps,tgt}` — park rows as JSON.
 */
export function parks(attr: number, caps: Uint8Array, tgt: number): string;

/**
 * `wA(attr)` — the per-attribute threshold ladder (index 0 unused).
 */
export function planner_ladder(attr: number): Uint8Array;

/**
 * `Z(attr, tier)` — the derived planner threshold.
 */
export function planner_threshold(attr: number, tier: number): number;

/**
 * `jj()` / `aj()` for a position as `{importance:[…], priority:[…]}` JSON.
 */
export function position_weights(pos: number): string;

/**
 * Decode a 124-byte QR record; JSON or `"null"`.
 */
export function qr_decode(record: Uint8Array): string;

/**
 * Why a 124-byte QR record failed to decode; `"null"` when it decodes.
 *
 * The `brand-mismatch` opcode is the loud rejection of a code that carries a
 * different brand magic — `"legacy": true` means the pre-rebrand `GBLSCDC1…`
 * tag, which must never be misparsed (`ENGINE_API.md` §9.3).
 */
export function qr_decode_error(record: Uint8Array): string;

/**
 * The 124-byte QR record. Returns an empty array on invalid input.
 */
export function qr_encode(pos: number, h: number, w: number, ws: number, values: Uint8Array, edge_id: number, mode: number): Uint8Array;

/**
 * The rebuild's own 16-byte QR magic (never the observed `Sc`; FB-brand
 * `FBBLDC1…` since the 2026-10-15 retag — `ENGINE_API.md` §9.3).
 */
export function qr_magic(): Uint8Array;

/**
 * The shade pool size.
 */
export function shades_count(): number;

/**
 * `SHADES.matchBuild` — top matches as JSON.
 *
 * `top = 0` uses the shipped default (`3`). `era` is always `""`: the shipped
 * `matchBuild` hard-codes it (`eraOf` is exported but never called; its regex
 * matches none of the 3,361 pool names) — see `shades.rs`.
 */
export function shades_match(bucket: number, hin: number, wt: number, alloc: Uint8Array, top: number): string;

/**
 * Decode a build code; returns JSON or `"null"`.
 */
export function share_decode(qs: string): string;

/**
 * Encode a build code (`p=…&h=…&w=…&s=…&v=…[&o=…]`).
 */
export function share_encode(pos: number, h: number, w: number, ws: number, values: Uint8Array, locked: Uint8Array): string;

/**
 * Raw slot score `s(A, e)` for a height. `-1` on a bad allocation.
 */
export function slot_score(alloc: Uint8Array, height: number): number;

/**
 * `h(A, e)` — all 15 slot scores.
 */
export function slot_scores(alloc: Uint8Array, height: number): Float64Array;

/**
 * `uN` — the solver budget as JSON.
 */
export function solver_budget(): string;

/**
 * The authored takeover dataset as JSON.
 */
export function takeover_dataset(): string;

/**
 * `Ne(A, e)` — the `kind:"tko"` entries for an allocation.
 */
export function takeover_entries(alloc: Uint8Array): string;

/**
 * The QA hook: `typeof TAKEOVERS === "undefined"` must be `true`.
 */
export function takeovers_global_is_undefined(): boolean;

/**
 * `g` tier threshold grid.
 */
export function tier_grid(): Uint8Array;

/**
 * `G[t]` label for a tier (0 -> `""`).
 */
export function tier_label(tier: number): string;

/**
 * `G` tier labels.
 */
export function tier_labels(): string;

/**
 * `J()` — the 0.1 rounding helper.
 */
export function to_tenths(x: number): number;

/**
 * `c()` — the true-overall fixup.
 */
export function true_overall(alloc: Uint8Array, caps: Uint8Array, height: number): number;

/**
 * `gN()` — unasked body knobs. `touched` has 21 entries.
 */
export function unasked_probes(alloc: Uint8Array, touched: Uint8Array): string;

/**
 * `u(alloc)` — the input gate (`0 <= v < 100`).
 */
export function validate_allocation(alloc: Uint8Array): boolean;

/**
 * Engine version string (use it for cache-busting).
 */
export function version(): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly advisories: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly animation_categories: (a: number) => void;
    readonly animation_count: () => number;
    readonly animation_filter: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly apply_cap_breakers: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => void;
    readonly archetype_count: () => number;
    readonly archetype_describe: (a: number, b: number, c: number, d: number) => void;
    readonly archetype_integrity: (a: number) => void;
    readonly archetype_mask_for: (a: number, b: number) => number;
    readonly archetype_ready: () => number;
    readonly badge_count: () => number;
    readonly badge_is_or_flags: (a: number) => void;
    readonly badge_names: (a: number) => void;
    readonly badge_related: (a: number, b: number) => void;
    readonly badge_row: (a: number, b: number, c: number) => void;
    readonly badges_in_band: (a: number, b: number, c: number) => void;
    readonly best_legal_height: (a: number) => number;
    readonly body_bands: (a: number) => void;
    readonly budget_index: (a: number, b: number, c: number) => number;
    readonly budget_index_checked: (a: number, b: number, c: number, d: number) => number;
    readonly budget_index_formula: (a: number, b: number, c: number) => number;
    readonly cap_breaker_categories: (a: number) => void;
    readonly cap_breaker_ladder: (a: number) => void;
    readonly cap_breaker_level: (a: number, b: number, c: number) => number;
    readonly cap_breaker_max_level: () => number;
    readonly card_caps: (a: number) => void;
    readonly card_export_filename: (a: number) => void;
    readonly card_height_bands: (a: number) => void;
    readonly card_num_of: (a: number, b: number, c: number) => void;
    readonly card_share_text: (a: number, b: number, c: number) => void;
    readonly ceilings: (a: number, b: number, c: number, d: number) => void;
    readonly ceilings_meta: (a: number) => void;
    readonly finder_search: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly format_floats: (a: number, b: number, c: number) => void;
    readonly fround: (a: number) => number;
    readonly gate_message: (a: number, b: number, c: number, d: number) => void;
    readonly hash_sets_finder_home: (a: number, b: number) => number;
    readonly height_scalar: (a: number) => number;
    readonly init: (a: number) => void;
    readonly jumper_ids: (a: number) => void;
    readonly ladder_gap: (a: number, b: number, c: number) => void;
    readonly legal_frame_count: () => number;
    readonly legal_frame_count_pos: (a: number) => number;
    readonly meter_marks: (a: number) => void;
    readonly meter_states: (a: number) => void;
    readonly min_closure: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly ocr_checksum_total: () => number;
    readonly ocr_params: (a: number) => void;
    readonly ocr_parse_cell: (a: number, b: number, c: number) => void;
    readonly ocr_stat_names: (a: number) => void;
    readonly overall: (a: number, b: number, c: number) => number;
    readonly park_partners: (a: number, b: number, c: number) => void;
    readonly parks: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly planner_ladder: (a: number, b: number) => void;
    readonly planner_threshold: (a: number, b: number) => number;
    readonly position_weights: (a: number, b: number) => void;
    readonly qr_decode: (a: number, b: number, c: number) => void;
    readonly qr_decode_error: (a: number, b: number, c: number) => void;
    readonly qr_encode: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly qr_magic: (a: number) => void;
    readonly shades_count: () => number;
    readonly shades_match: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly share_decode: (a: number, b: number, c: number) => void;
    readonly share_encode: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number, i: number) => void;
    readonly slot_score: (a: number, b: number, c: number) => number;
    readonly slot_scores: (a: number, b: number, c: number, d: number) => void;
    readonly solver_budget: (a: number) => void;
    readonly takeover_dataset: (a: number) => void;
    readonly takeover_entries: (a: number, b: number, c: number) => void;
    readonly takeovers_global_is_undefined: () => number;
    readonly tier_grid: (a: number) => void;
    readonly tier_label: (a: number, b: number) => void;
    readonly tier_labels: (a: number) => void;
    readonly to_tenths: (a: number) => number;
    readonly true_overall: (a: number, b: number, c: number, d: number, e: number) => number;
    readonly unasked_probes: (a: number, b: number, c: number, d: number, e: number) => void;
    readonly validate_allocation: (a: number, b: number) => number;
    readonly version: (a: number) => void;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number) => void;
    readonly __wbindgen_export3: (a: number, b: number, c: number, d: number) => number;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
