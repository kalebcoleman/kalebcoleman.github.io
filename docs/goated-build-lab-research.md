# Goated Build Lab research and Free Builder gap analysis

Research date: 2026-11-01. Reference: [Goated Build Lab](https://www.goatedbuildlab.com/). Rebuild: [Free Builder](https://kalebcoleman.github.io/), repository revision `44654c0` as inspected. The reference site can change; prices, counts, and availability below are observations from this date. No paid account was available during this pass.

## What the product does

Goated Build Lab is a collection of NBA 2K27 build, animation, training, analysis, and community tools. Its top-level navigation groups these as Find a build, Builds, Labs, Tools, League, and Community. The reference builder and several other features share build information: changing the active build can affect the Upgrade Planner and other tools. This is a product map, not a claim that every workflow has been tested end to end.

### Free access and account-dependent functions

| Area | What was seen | Access evidence |
| --- | --- | --- |
| Find a build | Simple skill sliders or Advanced exact attributes; position, height, cap breakers and badge constraints; preset searches; result sorting and comparison. | A signed-out browser showed 5 searches per day. A Floor General preset search completed and returned 12 builds; the counter fell to 4. |
| Builder | Body, attribute ceilings, overall and 99 wall, cap-breaker ladders, badge tiers and gaps, token counts, animation compatibility, undo/redo, sharing and screenshot import. | The example build loaded without signing in. Changing SG to PG updated the displayed body, raw overall, badge counts and player comparisons. |
| Cap-breaker finder | Filter a table of positions/heights and see how far allocations can rise with breakers. | The table was visible signed out. Building from a selected row opened a Premium prompt. |
| Upgrade Planner | Estimates VC to raise overall and orders upgrades around badge goals. | For the loaded PG example, entering 100,000 VC estimated an increase from 60.04 to 76.02 overall. “Plan it for me” produced a badge-by-badge sequence and cumulative costs without a sign-in prompt. These are site estimates, not independently verified game prices. |
| Mechanics Lab | Searchable badge, takeover, gameplay, boost and motion-style reference pages with requirements and explanations. | Searching “Limitless Range” returned a result; its detail page showed tier requirements, height options, a rating slider and token information. The site displayed a catalog of 53 badges, 21 takeover pages, 10 gameplay pages, 11 boost pages and 368 motion styles. |
| Jumpshot Lab | Trainer, recommended shots, look-alikes, delay calibration and community tabs; shot and meter settings, feedback, 3D player controls and timing information. | Changing shot type to free throw worked signed out; the selected example showed a 73 ms green window and 495 ms ideal release. The site says its trainer is a test build measured on one player, so treat claimed timing fidelity accordingly. |
| Facescan Lab | Finds licensed photos by person or character, accepts own photos, has community/on-demand entries, constructs and fine-tunes a head for the 2K HQ scanner. | The public page and controls were inspected; no photo or camera test was performed. |
| Community | Browse, filter, sort and compare posted builds; accounts for posting, following and other social features. | The signed-out feed loaded. It displayed 3 community loads per day and said Mid provides unlimited loads. Posting was presented as requiring sign-in. |
| League and Locker | League views include game modes, card uploads, standings, challenges, leaders and player statistics; Locker is a separate section. | The public league view loaded and requested sign-in to upload a 2K Card. The site says screenshot reading is on-device and only numbers are saved. Uploading, ranking and Locker flows were not tested. |
| Other Builds pages | Builder, GOAT Builds, GOATED Builds, Build presets and Highest overalls appear in the Builds navigation. | Navigation labels observed; the latter four workflows were not tested. |

The reference site says its core builder numbers, attribute ceilings, cap-breaker ladders, badge requirements and 99-wall calculations are free. Its claims about using game tuning tables have not been independently verified here.

## Paid plans

The reference site's Plans dialog showed these US-dollar prices and entitlements, with an account required to subscribe:

| Tier | Displayed price | Stated features |
| --- | --- | --- |
| Mid | $4.99 monthly or $29.99 yearly | Unlimited build searches; badge-token and Fuse planner; Optimize this build; Tokens tab with next-token costs; five saved builds. A community banner also advertised unlimited community loads. The shipped client additionally marks Max badge tokens, detailed grades/requirements for community jumpshots, sorting by those grades and the full recommended-jumpshot list as Mid features. |
| Premium | $9.99 monthly or $49.99 yearly | Everything in Mid; build from cap-breaker finder rows; badge-, archetype- and player-shade-based builders; min-max and better-frame searches; attribute thresholds and what they unlock; building for a specific animation; the full searchable 2,494-animation list; unlimited saved builds. |

These are the product's advertised entitlements, not a complete verified entitlement matrix. The Cap-breaker Finder table itself is free to browse even though building from a row is gated; the builder's animation panel is described as free even though opening the full standalone list brought up a Premium prompt.

### Paid gates tested while signed out

- Builder → Optimize: dialog said Optimize is part of Mid.
- Cap-breaker finder → first table row: dialog said building from the finder is Premium, while browsing remains free.
- Badge builder → select Aerial Wizard Silver → Find builds: dialog said building for a set of badges is Premium.
- Tools → Animations: dialog said the full animation list is Premium and the builder's animations panel remains free.

The paid calculations, result quality, quota enforcement, billing, saved-build limits and account experiences were not tested. Public interface descriptions and accessible shipped assets do not prove what inaccessible server-side code does. Access to an authorized signed-in paid account would be needed to test the premium workflows directly.

## Comparison with the current rebuild

The local repository is a compiled static distribution: HTML, bundled/minified JavaScript, local data files and a WASM engine. It is not the original site's complete source code. The live rebuild exposes a builder, finder, badge/animation/archetype/shade tools, jumpshot configuration, face scan, local community and a local games view. Many have different scope or UX from the reference.

| Feature | Reference | Rebuild evidence and gap |
| --- | --- | --- |
| Finder | Simple presets and exact Advanced targets, ranked detailed cards and comparisons. | Finder exists inside the builder and calls the local WASM engine. In two browser runs with targets Three-Point 78, Pass Accuracy 90 and Ball Handle 90, the first result loaded a 7′2″ center with Ball Handle 69 and a ceiling of 69. Investigate target handling before relying on results. |
| Builder experience | Interactive example build with live badge, overall, cap breaker, share and planner views. | Local build editor, ceilings, badge thresholds, saved builds and sharing controls exist. Numerical and UX parity has not been systematically verified. |
| Premium solvers | Dedicated paid workflows and curated result presentation. | The rebuild exposes min-max, better-frame, badge and animation solver controls free in its Tools area; their correctness and parity have not been established. |
| Jumpshot Lab | Interactive 3D/timing trainer, free throws, green windows, delay calibration and contextual settings. | Rebuild page offers shot composition, local saving, timing-meter bands and a separate browser-local Practice Lab with jump-shot and free-throw drills, calibration, session history and local suggestions. Every target and window is labelled as an estimated practice value; it does not reproduce the reference's claimed in-game timings, 3D player or community workflow. |
| Face scan | Photo/search-to-head workflow with refinement and 2K HQ scan-oriented presentation. | Rebuild exposes a local camera/MediaPipe landmark beta and local keep action. It does not demonstrate the reference photo-to-3D-head workflow. |
| Community and League | Public feed, accounts, following, shared posts, uploaded statistics, rankings and challenges. | The rebuild's community page explicitly says it is local only and has no server-side feed, accounts or moderation. Its league bundle includes local sample games. Backend-dependent parity is not established. |
| Mechanics Lab and Upgrade Planner | Dedicated interactive research pages and VC planning. | Rebuild now ships a searchable 96-entry Mechanics Lab hub and a full 368-style motion catalog with the recovered height gates and measured times. The VC Upgrade Planner now runs locally from the recovered `upF`/`upNeed`/`upPlan` functions, including the 85→99 cap ladder and badge-first ordering. |

### Finder investigation

The current builder gathers numeric target values and sends them in the `v` field along with the live build's lock flags (`o`) and allocations (`l`) in [the builder bundle](../assets/builder-DRDtM3V1.js). In [the worker bundle](../assets/worker-BWnw9nCb.js), the function constructing the WASM finder's requirement pairs iterates only entries with a truthy lock flag and prefers the current allocation over the requested target. This static reading is consistent with the failing browser example; it does not independently establish every failure mode or the best fix. The bridge now forwards targets and rejects candidates that miss a requested value or lock; regression tests cover the example and an impossible center build. The current WASM engine treats target pairs as fixed values rather than general minimums, so it may miss otherwise valid builds until the original finder is integrated.

## REA evidence and boundaries

REA 6.8.0 statically analyzed the local rebuild's `assets/shell-DuKJJrzf.js`, `assets/builder-DRDtM3V1.js`, `assets/home-DfH9EiUN.js`, and `assets/tables-Chhc7L8P.js`. Parent evidence ID: `ev_87a329b460f9659a38be790e0855f21dbc13c9d25deff01948140c58a7792270`. It parsed four JavaScript files without parse failures; 103 inventoried files were outside the selected source scope and graph coverage was partial. Its analysis was static and did not execute the app. The [REA summary](freebuilder-rea-summary.json) is saved with this report. The 19 MB full evidence bundle was written to `/tmp/freebuilder-rea-evidence.json` for this machine/session and is not committed.

### Original site's publicly delivered client code

After the initial browser pass, the reference site's public JavaScript was read through the browser and preserved for offline analysis. The saved snapshot is `/root/goated-reference-2026-11-01.zip` on this machine. It contains the public app bundle, engine, finder worker, card reader, a vendor bundle, and provenance-marked worker excerpts. It does not contain a complete original repository or server code. The files can also be located at the public URLs below while this deployment remains available:

- App: [main-D62m5Xum.js](https://www.goatedbuildlab.com/assets/main-D62m5Xum.js), SHA-256 `20fb92ec8445b9fa825ad5b4ed44bf8805fa3b4e29a8e5021b93e26921ae8440`.
- Engine: [engine.js](https://www.goatedbuildlab.com/engine/engine.js?v=802b53b6fd), SHA-256 `2171862d065f778eca9fb95e5772482d7ba0400310a29207f3cd38e7a197f74c`.
- Worker: [finder_worker.js](https://www.goatedbuildlab.com/engine/finder_worker.js?v=802b53b6fd), SHA-256 `2e8a56007393702359f764a457ddc604afa5d0883cc12ec7949cfb93a188ee5e`.
- Card reader: [readers.js](https://www.goatedbuildlab.com/engine/readers.js?v=802b53b6fd), SHA-256 `f342f3a128069c8e427ebaa9ef14007f76a6ed6f5edfd023ab562cb55a35fa55`.

**Static observations and inferences from the delivered code:**

- The app creates a finder web worker and sends it search or tool messages. The worker includes dispatch branches for optimize, min-max, cap-breaker finder, archetype search, shade search and verdict. That establishes these client code paths are shipped publicly; it does not prove their results without exercising them.
- The optimize routine is a bounded local heuristic: it attempts up to 60 one-point swaps and 900 one-point increases, applies build constraints, honors locked attributes, checks the 99 wall and maintains selected badge/player-type/breaker conditions. It has separate objectives for its default score and maximizing badge tokens. These bounds describe the inspected code, not a guarantee of global optimality.
- The min-max path snapshots earned badge tiers and converts them to attribute floors for the finder; the verdict compares kept/lost and gained badges, attribute points, cap-breaker spending and other measures. A separate frame-search path can sweep bodies. Dependencies outside the extracted functions still need tracing before reimplementation.
- The cap-breaker finder enumerates positions, legal heights and attributes, derives a starting allocation and landing value for the requested target and breaker count, and sorts candidate rows by saved allocation. Some cases use supplemental verification/fallback data. Its output depends on helpers and embedded tables, so the extracted routine alone is not a full specification.
- The archetype search scans candidate frames and allocations for the selected name with optional constraints. The multi-player shade routine matches supplied player names, samples bodies around average height and weight, evaluates candidates and ranks matches. Both are bounded searches; do not assume they enumerate every possible legal build.
- The client entitlement map adds two Mid details absent from the short plan dialog: full recommended jumpshot lists and detailed grades/requirements/heights plus sorting for community jumpshots. Posting and trying jumpshots and the top recommendation are described in code as free. These are static client declarations, not authenticated tests.
- The app reads account/subscription records and calls remote services for subscription and community functions; the complete server implementation, database permissions and payment webhooks cannot be recovered from these browser assets alone.

REA's initial attempt to analyze the complete 1.14 MB minified app timed out at its 180-second per-source deadline (partial observation `ev_988d5a34e71cd4e9a1e8150561a9e3ab6db8164202707a5641c0a4b30a0f462f`). A narrower REA analysis succeeded on the complete card-reader file and an extracted worker dispatcher/optimization excerpt: parent evidence `ev_86e335b352b30e60aa6aba3e7a9a1f693c6d50b960e00499bb0f83668e2a389e`, [summary](goated-reference-rea-summary.json). A second analysis covered extracted solver functions: parent `ev_02aa7e67cc855634e9c97cec67dea13a9dcac76c17a9a9fdea80302d305e066c`, [summary](goated-solvers-rea-summary.json). The excerpts preserve source character ranges and omit external dependencies, so their graph cannot establish complete runtime behavior. Further conclusions above also use direct static reading of the original saved bundles; they should not be attributed solely to REA.

The reference site's premium behavior remains unverified beyond the public UI, gates and static client logic. No paid entitlement, subscription or inaccessible server response was accessed.

## Suggested next work

1. Extend the finder regression tests to the reference worker and decide whether its slower, higher-fidelity search should be selectable beside the WASM finder.
2. Inventory the original UX and test more free workflows against equivalent rebuild inputs; preserve examples and version the data.
3. Build a feature-by-feature parity checklist for the builder, cap breakers, badges, animation data, sharing and persistence.
4. Decide whether the rebuild should remain local-only or recreate account, community and league backends; these are separate product and infrastructure decisions.
5. If paid access is available, repeat the gated workflow tests using that account and record actual inputs, outputs, limits and side effects.
