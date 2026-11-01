/* @ts-self-types="./fb_engine_core.d.ts" */

/**
 * `_A` — the advisory engine's rule set as JSON `[{"id","head","why"}]`.
 *
 * **Reconstruction:** the evidence itemises five rule *tests* verbatim; the
 * remaining rule bodies are not in the artifact. `id` 0..4 are the verbatim
 * rules, 5..8 are rebuild-authored advisories marked `"original":true`.
 * @param {number} pos
 * @param {number} height
 * @param {Uint8Array} alloc
 * @param {Uint8Array} caps
 * @returns {string}
 */
export function advisories(pos, height, alloc, caps) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(caps, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.advisories(retptr, pos, height, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred3_0 = r0;
        deferred3_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred3_0, deferred3_1, 1);
    }
}

/**
 * The 48-category histogram as JSON `[{count,name},…]`, count-descending.
 * @returns {string}
 */
export function animation_categories() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.animation_categories(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `f.length`.
 * @returns {number}
 */
export function animation_count() {
    const ret = wasm.animation_count();
    return ret >>> 0;
}

/**
 * The documented animation filter. Returns matching names as JSON.
 * @param {string} category
 * @param {number} height
 * @param {Uint8Array} alloc
 * @returns {string}
 */
export function animation_filter(category, height, alloc) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(category, wasm.__wbindgen_export, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.animation_filter(retptr, ptr0, len0, height, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred3_0 = r0;
        deferred3_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred3_0, deferred3_1, 1);
    }
}

/**
 * `_Y(build)` — apply cap-breaker levels (12 entries) to an allocation.
 * @param {Uint8Array} alloc
 * @param {Uint8Array} caps
 * @param {number} pos
 * @param {Uint8Array} levels
 * @returns {Uint8Array}
 */
export function apply_cap_breakers(alloc, caps, pos, levels) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(caps, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(levels, wasm.__wbindgen_export);
        const len2 = WASM_VECTOR_LEN;
        wasm.apply_cap_breakers(retptr, ptr0, len0, ptr1, len1, pos, ptr2, len2);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v4 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v4;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `DescName.names.length`.
 * @returns {number}
 */
export function archetype_count() {
    const ret = wasm.archetype_count();
    return ret >>> 0;
}

/**
 * `DescName.describe(alloc, pos)`; `"null"` when nothing matches.
 * @param {Uint8Array} alloc
 * @param {number} pos
 * @returns {string}
 */
export function archetype_describe(alloc, pos) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.archetype_describe(retptr, ptr0, len0, pos);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Archetype table integrity check; returns `""` when healthy.
 * @returns {string}
 */
export function archetype_integrity() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.archetype_integrity(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `maskFor(pos, e)` — `-1` for the `null` case (`e <= 2 || e > 7`).
 * @param {number} pos
 * @param {number} e
 * @returns {number}
 */
export function archetype_mask_for(pos, e) {
    const ret = wasm.archetype_mask_for(pos, e);
    return ret;
}

/**
 * `whenReady()`.
 * @returns {boolean}
 */
export function archetype_ready() {
    const ret = wasm.archetype_ready();
    return ret !== 0;
}

/**
 * `m.length`.
 * @returns {number}
 */
export function badge_count() {
    const ret = wasm.badge_count();
    return ret >>> 0;
}

/**
 * `isOr` flags as `0/1` per row.
 * @returns {Uint8Array}
 */
export function badge_is_or_flags() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.badge_is_or_flags(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * All badge names, in table order (i18n glossary indices are load-bearing).
 * @returns {string}
 */
export function badge_names() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.badge_names(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `y[idx]` — the related-badge graph row.
 * @param {number} index
 * @returns {Uint8Array}
 */
export function badge_related(index) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.badge_related(retptr, index);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * One badge row as JSON, or `"null"`.
 * @param {string} name
 * @returns {string}
 */
export function badge_row(name) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(name, wasm.__wbindgen_export, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.badge_row(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `x(attr, tier)` — badges in the band, sorted by `(isOr, tier)`, as JSON
 * `[{"name":…,"tier":…}]`.
 * @param {number} attr
 * @param {number} tier
 * @returns {string}
 */
export function badges_in_band(attr, tier) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.badges_in_band(retptr, attr, tier);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `OA(p)` — the best legal height for a position, or `-1`.
 * @param {number} pos
 * @returns {number}
 */
export function best_legal_height(pos) {
    const ret = wasm.best_legal_height(pos);
    return ret;
}

/**
 * All `N.pos` bands as `[pos, h, wmin, wmax]` quadruples (flattened).
 * @returns {Uint16Array}
 */
export function body_bands() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.body_bands(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU16FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 2, 2);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `E(h,w,ws)` — the ceilings-table budget index, or `-1` when illegal.
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @returns {number}
 */
export function budget_index(h, w, ws) {
    const ret = wasm.budget_index(h, w, ws);
    return ret;
}

/**
 * `E` with the full gate (position, weight floor, eligibility band).
 * @param {number} pos
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @returns {number}
 */
export function budget_index_checked(pos, h, w, ws) {
    const ret = wasm.budget_index_checked(pos, h, w, ws);
    return ret;
}

/**
 * `E(h,w,ws)` — exposed for parity tests in the web layer.
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @returns {number}
 */
export function budget_index_formula(h, w, ws) {
    const ret = wasm.budget_index_formula(h, w, ws);
    return ret;
}

/**
 * `wY` — the 12 categories as JSON.
 * @returns {string}
 */
export function cap_breaker_categories() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.cap_breaker_categories(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `qY` — the ladder as JSON `[null,{t,cap},…]`.
 * @returns {string}
 */
export function cap_breaker_ladder() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.cap_breaker_ladder(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `To(raw)` — parse `fb.lbrk`. `f_caps` is the `#fCaps` control value (pass
 * `-1` when absent).
 * @param {string} stored
 * @param {number} f_caps
 * @returns {number}
 */
export function cap_breaker_level(stored, f_caps) {
    const ptr0 = passStringToWasm0(stored, wasm.__wbindgen_export, wasm.__wbindgen_export3);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.cap_breaker_level(ptr0, len0, f_caps);
    return ret;
}

/**
 * `OY`.
 * @returns {number}
 */
export function cap_breaker_max_level() {
    const ret = wasm.cap_breaker_max_level();
    return ret;
}

/**
 * `CARD2K` per-game caps `[pts,reb,ast,stl,blk,tov,fouls]`.
 * @returns {Uint8Array}
 */
export function card_caps() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.card_caps(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * Export filename for the PNG share path.
 * @returns {string}
 */
export function card_export_filename() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.card_export_filename(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `CARD2K` height bands `[PGlo,PGhi,SGlo,SGhi,…]`.
 * @returns {Uint8Array}
 */
export function card_height_bands() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.card_height_bands(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `_numOf(raw)` as JSON, or `"null"`.
 * @param {string} raw
 * @returns {string}
 */
export function card_num_of(raw) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(raw, wasm.__wbindgen_export, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.card_num_of(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `navigator.share` text for the card.
 * @param {string} origin
 * @returns {string}
 */
export function card_share_text(origin) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(origin, wasm.__wbindgen_export, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.card_share_text(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `W(h,w,ws)` — the 21 ceilings, or an empty array when the body is illegal.
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @returns {Uint8Array}
 */
export function ceilings(h, w, ws) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.ceilings(retptr, h, w, ws);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `W` — the ceilings table digest metadata as JSON (`{len, rows, cols}`).
 * @returns {string}
 */
export function ceilings_meta() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.ceilings_meta(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

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
 * @param {number} pos
 * @param {number} target
 * @param {number} cap_level
 * @param {number} top
 * @param {Uint8Array} lock
 * @returns {string}
 */
export function finder_search(pos, target, cap_level, top, lock) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(lock, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.finder_search(retptr, pos, target, cap_level, top, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * The float array formatting helper used internally, exposed for the UI's
 * tooltips (kept tiny on purpose).
 * @param {Float64Array} values
 * @returns {string}
 */
export function format_floats(values) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArrayF64ToWasm0(values, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.format_floats(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `fround` — exposed so the web layer can mirror the kernel exactly.
 * @param {number} x
 * @returns {number}
 */
export function fround(x) {
    const ret = wasm.fround(x);
    return ret;
}

/**
 * Message catalogue for the engine's own validation failures (`u()` gate,
 * decode failures). The web layer maps these to i18n keys.
 * @param {number} kind
 * @param {number} a
 * @param {number} b
 * @returns {string}
 */
export function gate_message(kind, a, b) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.gate_message(retptr, kind, a, b);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `/#p=\d/` — a share link lands in Builder.
 * @param {string} hash
 * @returns {boolean}
 */
export function hash_sets_finder_home(hash) {
    const ptr0 = passStringToWasm0(hash, wasm.__wbindgen_export, wasm.__wbindgen_export3);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.hash_sets_finder_home(ptr0, len0);
    return ret !== 0;
}

/**
 * `bA(h)` — the height worth-scalar.
 * @param {number} h
 * @returns {number}
 */
export function height_scalar(h) {
    const ret = wasm.height_scalar(h);
    return ret;
}

/**
 * One-shot start-up check: parses every embedded table and verifies the
 * archetype integrity counts. Throws with a message when anything is off.
 */
export function init() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.init(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        if (r1) {
            throw takeObject(r0);
        }
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `ws.ids` — the 27 Jumpshot Lab persistence field names, in shipped order.
 * @returns {string}
 */
export function jumper_ids() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.jumper_ids(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `qA(attr, cur)` -> `[dead, last, next, gap]`.
 * @param {number} attr
 * @param {number} cur
 * @returns {Uint8Array}
 */
export function ladder_gap(attr, cur) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.ladder_gap(retptr, attr, cur);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * The number of legal frames in the exhaustive scan (all positions).
 * @returns {number}
 */
export function legal_frame_count() {
    const ret = wasm.legal_frame_count();
    return ret >>> 0;
}

/**
 * The number of legal frames for one position.
 * @param {number} pos
 * @returns {number}
 */
export function legal_frame_count_pos(pos) {
    const ret = wasm.legal_frame_count_pos(pos);
    return ret >>> 0;
}

/**
 * `SA` meter marks as `[{label,value}]`.
 * @returns {string}
 */
export function meter_marks() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.meter_marks(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `gA` meter states.
 * @returns {string}
 */
export function meter_states() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.meter_states(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `F(A, e, caps)` — the min-attribute closure.
 * @param {Uint8Array} alloc
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @returns {Uint8Array}
 */
export function min_closure(alloc, h, w, ws) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.min_closure(retptr, ptr0, len0, h, w, ws);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `checksums().of`.
 * @returns {number}
 */
export function ocr_checksum_total() {
    const ret = wasm.ocr_checksum_total();
    return ret >>> 0;
}

/**
 * Tesseract parameters: `pageseg`, `whitelistStats`, `whitelistNames`.
 * @returns {string}
 */
export function ocr_params() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.ocr_params(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `_parseCell(raw)` as JSON, or `"null"`.
 * @param {string} raw
 * @returns {string}
 */
export function ocr_parse_cell(raw) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(raw, wasm.__wbindgen_export, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.ocr_parse_cell(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `BOXSCORE.STAT_NAMES` as JSON.
 * @returns {string}
 */
export function ocr_stat_names() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.ocr_stat_names(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Displayed overall (clamped to 25..99), or `-1` on a bad allocation.
 * @param {Uint8Array} alloc
 * @param {number} height
 * @returns {number}
 */
export function overall(alloc, height) {
    const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.overall(ptr0, len0, height);
    return ret;
}

/**
 * `b:pkpick{row,caps}` — partner attributes for a park.
 * @param {number} attr
 * @param {number} pos
 * @returns {Uint8Array}
 */
export function park_partners(attr, pos) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.park_partners(retptr, attr, pos);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `b:parks{attr,caps,tgt}` — park rows as JSON.
 * @param {number} attr
 * @param {Uint8Array} caps
 * @param {number} tgt
 * @returns {string}
 */
export function parks(attr, caps, tgt) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(caps, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.parks(retptr, attr, ptr0, len0, tgt);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * `wA(attr)` — the per-attribute threshold ladder (index 0 unused).
 * @param {number} attr
 * @returns {Uint8Array}
 */
export function planner_ladder(attr) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.planner_ladder(retptr, attr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `Z(attr, tier)` — the derived planner threshold.
 * @param {number} attr
 * @param {number} tier
 * @returns {number}
 */
export function planner_threshold(attr, tier) {
    const ret = wasm.planner_threshold(attr, tier);
    return ret;
}

/**
 * `jj()` / `aj()` for a position as `{importance:[…], priority:[…]}` JSON.
 * @param {number} pos
 * @returns {string}
 */
export function position_weights(pos) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.position_weights(retptr, pos);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Decode a 124-byte QR record; JSON or `"null"`.
 * @param {Uint8Array} record
 * @returns {string}
 */
export function qr_decode(record) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(record, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.qr_decode(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Why a 124-byte QR record failed to decode; `"null"` when it decodes.
 *
 * The `brand-mismatch` opcode is the loud rejection of a code that carries a
 * different brand magic — `"legacy": true` means the pre-rebrand `GBLSCDC1…`
 * tag, which must never be misparsed (`ENGINE_API.md` §9.3).
 * @param {Uint8Array} record
 * @returns {string}
 */
export function qr_decode_error(record) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(record, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.qr_decode_error(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * The 124-byte QR record. Returns an empty array on invalid input.
 * @param {number} pos
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @param {Uint8Array} values
 * @param {number} edge_id
 * @param {number} mode
 * @returns {Uint8Array}
 */
export function qr_encode(pos, h, w, ws, values, edge_id, mode) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(values, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.qr_encode(retptr, pos, h, w, ws, ptr0, len0, edge_id, mode);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * The rebuild's own 16-byte QR magic (never the observed `Sc`; FB-brand
 * `FBBLDC1…` since the 2026-10-15 retag — `ENGINE_API.md` §9.3).
 * @returns {Uint8Array}
 */
export function qr_magic() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.qr_magic(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * The shade pool size.
 * @returns {number}
 */
export function shades_count() {
    const ret = wasm.shades_count();
    return ret >>> 0;
}

/**
 * `SHADES.matchBuild` — top matches as JSON.
 *
 * `top = 0` uses the shipped default (`3`). `era` is always `""`: the shipped
 * `matchBuild` hard-codes it (`eraOf` is exported but never called; its regex
 * matches none of the 3,361 pool names) — see `shades.rs`.
 * @param {number} bucket
 * @param {number} hin
 * @param {number} wt
 * @param {Uint8Array} alloc
 * @param {number} top
 * @returns {string}
 */
export function shades_match(bucket, hin, wt, alloc, top) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.shades_match(retptr, bucket, hin, wt, ptr0, len0, top);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Decode a build code; returns JSON or `"null"`.
 * @param {string} qs
 * @returns {string}
 */
export function share_decode(qs) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passStringToWasm0(qs, wasm.__wbindgen_export, wasm.__wbindgen_export3);
        const len0 = WASM_VECTOR_LEN;
        wasm.share_decode(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * Encode a build code (`p=…&h=…&w=…&s=…&v=…[&o=…]`).
 * @param {number} pos
 * @param {number} h
 * @param {number} w
 * @param {number} ws
 * @param {Uint8Array} values
 * @param {Uint8Array} locked
 * @returns {string}
 */
export function share_encode(pos, h, w, ws, values, locked) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(values, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(locked, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.share_encode(retptr, pos, h, w, ws, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred3_0 = r0;
        deferred3_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Raw slot score `s(A, e)` for a height. `-1` on a bad allocation.
 * @param {Uint8Array} alloc
 * @param {number} height
 * @returns {number}
 */
export function slot_score(alloc, height) {
    const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.slot_score(ptr0, len0, height);
    return ret;
}

/**
 * `h(A, e)` — all 15 slot scores.
 * @param {Uint8Array} alloc
 * @param {number} height
 * @returns {Float64Array}
 */
export function slot_scores(alloc, height) {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.slot_scores(retptr, ptr0, len0, height);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v2 = getArrayF64FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 8, 8);
        return v2;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `uN` — the solver budget as JSON.
 * @returns {string}
 */
export function solver_budget() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.solver_budget(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * The authored takeover dataset as JSON.
 * @returns {string}
 */
export function takeover_dataset() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.takeover_dataset(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `Ne(A, e)` — the `kind:"tko"` entries for an allocation.
 * @param {Uint8Array} alloc
 * @returns {string}
 */
export function takeover_entries(alloc) {
    let deferred2_0;
    let deferred2_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        wasm.takeover_entries(retptr, ptr0, len0);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred2_0 = r0;
        deferred2_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred2_0, deferred2_1, 1);
    }
}

/**
 * The QA hook: `typeof TAKEOVERS === "undefined"` must be `true`.
 * @returns {boolean}
 */
export function takeovers_global_is_undefined() {
    const ret = wasm.takeovers_global_is_undefined();
    return ret !== 0;
}

/**
 * `g` tier threshold grid.
 * @returns {Uint8Array}
 */
export function tier_grid() {
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.tier_grid(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        var v1 = getArrayU8FromWasm0(r0, r1).slice();
        wasm.__wbindgen_export2(r0, r1 * 1, 1);
        return v1;
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
    }
}

/**
 * `G[t]` label for a tier (0 -> `""`).
 * @param {number} tier
 * @returns {string}
 */
export function tier_label(tier) {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.tier_label(retptr, tier);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `G` tier labels.
 * @returns {string}
 */
export function tier_labels() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.tier_labels(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}

/**
 * `J()` — the 0.1 rounding helper.
 * @param {number} x
 * @returns {number}
 */
export function to_tenths(x) {
    const ret = wasm.to_tenths(x);
    return ret;
}

/**
 * `c()` — the true-overall fixup.
 * @param {Uint8Array} alloc
 * @param {Uint8Array} caps
 * @param {number} height
 * @returns {number}
 */
export function true_overall(alloc, caps, height) {
    const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(caps, wasm.__wbindgen_export);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.true_overall(ptr0, len0, ptr1, len1, height);
    return ret;
}

/**
 * `gN()` — unasked body knobs. `touched` has 21 entries.
 * @param {Uint8Array} alloc
 * @param {Uint8Array} touched
 * @returns {string}
 */
export function unasked_probes(alloc, touched) {
    let deferred3_0;
    let deferred3_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(touched, wasm.__wbindgen_export);
        const len1 = WASM_VECTOR_LEN;
        wasm.unasked_probes(retptr, ptr0, len0, ptr1, len1);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred3_0 = r0;
        deferred3_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred3_0, deferred3_1, 1);
    }
}

/**
 * `u(alloc)` — the input gate (`0 <= v < 100`).
 * @param {Uint8Array} alloc
 * @returns {boolean}
 */
export function validate_allocation(alloc) {
    const ptr0 = passArray8ToWasm0(alloc, wasm.__wbindgen_export);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.validate_allocation(ptr0, len0);
    return ret !== 0;
}

/**
 * Engine version string (use it for cache-busting).
 * @returns {string}
 */
export function version() {
    let deferred1_0;
    let deferred1_1;
    try {
        const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
        wasm.version(retptr);
        var r0 = getDataViewMemory0().getInt32(retptr + 4 * 0, true);
        var r1 = getDataViewMemory0().getInt32(retptr + 4 * 1, true);
        deferred1_0 = r0;
        deferred1_1 = r1;
        return getStringFromWasm0(r0, r1);
    } finally {
        wasm.__wbindgen_add_to_stack_pointer(16);
        wasm.__wbindgen_export2(deferred1_0, deferred1_1, 1);
    }
}
function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_now_78bf1f2f810f0d26: function() {
            const ret = performance.now();
            return ret;
        },
        __wbindgen_generic_0000000000000001: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return addHeapObject(ret);
        },
    };
    return {
        __proto__: null,
        "./fb_engine_core_bg.js": import0,
    };
}

function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1);
    const idx = heap_next;
    heap_next = heap[idx];

    heap[idx] = obj;
    return idx;
}

function dropObject(idx) {
    if (idx < 1028) return;
    heap[idx] = heap_next;
    heap_next = idx;
}

function getArrayF64FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getFloat64ArrayMemory0().subarray(ptr / 8, ptr / 8 + len);
}

function getArrayU16FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint16ArrayMemory0().subarray(ptr / 2, ptr / 2 + len);
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

let cachedFloat64ArrayMemory0 = null;
function getFloat64ArrayMemory0() {
    if (cachedFloat64ArrayMemory0 === null || cachedFloat64ArrayMemory0.byteLength === 0) {
        cachedFloat64ArrayMemory0 = new Float64Array(wasm.memory.buffer);
    }
    return cachedFloat64ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
}

let cachedUint16ArrayMemory0 = null;
function getUint16ArrayMemory0() {
    if (cachedUint16ArrayMemory0 === null || cachedUint16ArrayMemory0.byteLength === 0) {
        cachedUint16ArrayMemory0 = new Uint16Array(wasm.memory.buffer);
    }
    return cachedUint16ArrayMemory0;
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function getObject(idx) { return heap[idx]; }

let heap = new Array(1024).fill(undefined);
heap.push(undefined, null, true, false);

let heap_next = heap.length;

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passArrayF64ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 8, 8) >>> 0;
    getFloat64ArrayMemory0().set(arg, ptr / 8);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

function takeObject(idx) {
    const ret = getObject(idx);
    dropObject(idx);
    return ret;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasmInstance, wasm;
function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedFloat64ArrayMemory0 = null;
    cachedUint16ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (!module.ok) {
            throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
        }

        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('fb_engine_core_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
