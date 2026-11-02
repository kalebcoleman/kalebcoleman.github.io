# Premium-feature test report — 2026-11-01

Tested by the project context engineer against `main` at `b37abd0` on the local static server,
using headless Chromium 140 at a 1280 px desktop viewport and a 390 px mobile viewport.
The thread's own test suite passes **90/90**. CI and Pages are green for `b37abd0`.

This is a representative audit. It does not cover real 2K screenshots, a paid account, in-game
verification, every possible build state, or server-side functions.

## Premium surface matrix

| Surface | Desktop | Mobile layout | Evidence / notes |
| --- | --- | --- | --- |
| Optimize this build | Pass | No overflow | `+7 attribute points · +2 badge tiers`, player type held, cap breakers held, 1.5 s. |
| Max badge tokens | Pass | No overflow | `+1 badge tokens (50 → 51) · +1 attribute point · +1 badge tier`. |
| Min-max | Pass | No overflow | Returns a clear "0 verified results" message on the default 99 build in 1.5 s. No crash. |
| Find a better frame | Pass | No overflow | Same clear empty state, 1.2 s. |
| Build for a set of badges | Pass | No overflow | Aerial Wizard Bronze → 1 result, fitted to 98.1 while keeping the target. |
| Set badge tiers as Must-reach | Pass | No overflow | Writes 1 attribute target without running a search. |
| Attribute thresholds ("Numbers worth hitting") | Pass | No overflow | Chips set the attribute through the validated path and are clamped at the wall. |
| Build toward an animation | Pass (empty state) | No overflow | Unknown animation returns a clear message. A valid animation was not exercised. |
| Build an archetype name | Pass (empty state) | No overflow | `PlayShot Point` was not in this build's top results; clear message with the produced name. |
| Build toward an NBA player | Pass (lookup) | No overflow | Stephen Curry profile found at 93; 0 builds on the 99-overall default. Clear message. |
| Cap-breaker build | Pass | No overflow | 12 Close Shot rows; Load set Close Shot to 70 and reported the 99-wall limitation. |
| Badge catalog / tabs / icons | Pass | No overflow | 53 cards, 53 icons, All badges / Badge plan / Next tiers all switch, tier legend present. |
| Fuse candidates | Partial | Untested interaction | Panel lists 32 equipped tiers and 20 compatible pairs with token costs. It is a candidate list, not a full plan/apply planner. |
| Direct cap-breaker row build | Missing | — | Rows still prefill the finder; no "Build this row" action. This is a recovered Premium surface. |
| Upgrade Planner | Previously verified | Not retested | Earlier comparison: 60.00 → 76.00 for 100,000 VC vs reference 60.04 → 76.02; 176 VC / 0.04 overall difference. |
| Screenshot import | Pass with mocked OCR | No overflow | Review/apply DOM path works; partial-read warning path is covered by unit tests. Real 2K screenshot accuracy is unverified. |
| Cloud accounts | Pass | No overflow | Schema applied and verified in `docs/cloud-setup.md`: two-user RLS isolation, save/load/delete, delete-account cascade. Account deletion now clears the local session only. |

## P0 — builder Find builds returns zero results

On `/builder/`, clicking **Find builds** with no targets returns:

```
0 result(s) in 42.2 ms · engine scan 24343/24343 legal frames (stop: exhausted)
```

Reproduced with no targets, a single Three-Point 60 target, and Three-Point 78 / Pass Accuracy 90 /
Ball Handle 90. The standalone `/finder/` page with the Floor general preset returns **12 builds
in 1.5 s** and the first build matches the reference (PlayShot Point, PG 6'4", 175 lb, true 98.9).

**Root cause (confirmed by calling the worker directly):** the builder's local engine worker
returns 12 rows, but they are illegal over-wall builds mislabeled `ovr: 99`. The first row is
`pos 4, body 86/290/86`, with actual engine values `ratingOf = 116.78`, `overallOf = 116`,
`trueOvr = 116.7`. `__filterSolverResults` is correctly dropping them. The standalone finder uses
`assets/reference-finder-worker.js` and returns legal rows, so the recovered reference worker is
the reliable path.

This also explains why the animation builder returns `0 result(s) · no build found` for a valid
animation (`Elite Alley-Oop`) in ~300 ms, and why min-max/better-frame often report no improvement.
Any solver that calls the local finder inherits the bug.

Acceptance: the builder returns 12 legal rows whose `ratingOf < 99` and which pass
`filterSolverResults`; the Floor general preset still matches `/finder/` on desktop and at 390 px.

## P1 — remaining recovered premium work

1. **Direct cap-breaker row build.** Add a Build this row action using the recovered row/ladder
   data, through `__applyCandidate`, and show the imported breaker plan explicitly.
2. **Full Fuse planner.** The candidates panel is a good start, but the full recovered planner is
   in the saved public bundle: `public-bundle/main.js`, `function GR` / `function WR` (around
   character offset 827k). It has Best plan / My picks, 0–9 fuse slots, 0–6 `+2` slots, per-slot
   badge and Reaction badge, resulting tier +1/+2, bonus tokens, per-group flex distribution and
   per-slot cap editing. The local engine already exports `effectivePlan`, `effectiveFuse`,
   `slotCaps`, `fusePairs`, `tierCost`, `synBoost` and the `PLANMODE`/`FUSESET`/`TIERSET`/`FLEX`/
   `FLEXSET`/`SYNN`/`SYN2` state. Build this as a local free UI.
3. **Tokens tab / next-token costs.** The builder's Next badges list shows token cost for up to 8
   entries; the Badge plan table has no token column. The reference's Mid tier has a Tokens tab
   with next-token costs. Use `GBLE.tierCost` and `GBLE.tokensAt` to add the full table.
4. **Mobile tap targets in the Jumpshot Lab.** The recovered trainer has 24 px-high buttons
   (`Jump`, `Set Point`, `Push`, `Release`, `Calibrate`); enlarge them for 390 px without changing
   the trainer's calculations.

## P2 — small polish

- Screenshot review shows `Body: PG · 75" · 170 lb · 81" wingspan`; format height as `6'3"`.
- When Apply is rejected, name the offending attribute and highlight its review input.
- Confirm the `/builder#cloud` anchor scrolls to the Cloud builds panel (the panel now has
  `id="cloud"`).
- Add a DOM-level test for the screenshot file input and Apply/Cancel flow (the current test only
  covers normalization).
- The animation and shade cards say `press Load to use the first one` even when the result count is
  0. Make that line conditional.
- The badge tier legend is appended under the screenshot import panel on the builder. Keep it next
  to the badge chips or limit it to the `/badges/` catalog.
- The screenshot import panel is a full sidebar panel above Body and repeats the privacy sentence.
  Make it a compact card in the sidebar, below Body.
- Mechanics Lab has 96 summary entries but no gameplay/boost detail pages; every badge row only
  links to the badge glossary. The reference has dedicated detail pages.
- A GOAT card opens at `Overall 98 · true 98.9` while the card header says 99. The fitted build is
  legal; explain or label the display difference so it does not look like a regression.

## Integration checks that pass

- Finder result → **Open in builder** loads the build and the builder shows the last 12-result
  search with **Edit search**.
- Cap-breaker table → **Find builds** pre-fills the standalone finder with the attribute, target,
  position, height and breaker count; pressing Find builds returns results and shows base → after
  breaker values. It does not auto-run and the builder opens the base allocation only.
- Highest Overalls board → **Open in the Builder** loads a fitted 99 build.
- Builds → **Fit to builder** loads, shows the adjustment notice, and stays legal.
- 6 rapid local saves all persist and list; the local library is unlimited.
- Optimize → Load applies the result (+7 points on the default build).
- Badge builder → Load applies the fitted result (Aerial Wizard Bronze → C 7'2" at 98.1).
- Badges search `Limitless Range` → 1 card; Animations search `Stephen Curry` → 35 rows;
  Archetypes search `PlayShot` → 37 of 3,721 names.
- Upgrade Planner `Plan it for me` produces the badge-first sequence and cap dependencies.
- Mobile (390 px) Min-max runs and the finder returns 12 cards with no overflow.

## Visual comparison (2026-11-01)

- Ours: `/tmp/opencode/ours-builder.png`
- Reference: `/tmp/opencode/ref-builder-cli.png`

The reference uses a desktop two-column builder: compact left sidebar (import card, body, action
grid, name) and a dense right attributes panel. Its range tracks are thick custom bars with filled
segments, cap/token markers and a larger thumb. Ours is a long vertical stack with native thin
ranges; control heights are inconsistent (select 32 px, button 30 px, range 18 px), the screenshot
import is above Body, and the tier legend is attached underneath it. A visual pass should
standardize a 34 px control height, style range tracks/thumbs explicitly for WebKit and Firefox,
use segmented position controls, and move import into the sidebar.

## Mobile audit

At 390 × 844, the document had no horizontal overflow on `/builder/`, `/finder/`, `/badges/`,
`/animations/`, `/archetypes/`, `/shades/`, `/upgrade-planner/`, `/cap-breakers/`, `/builds/`,
`/face-scan/` and `/jumpshot-lab/`. The nav is an intentional horizontal scroller. The only
undersized interactive controls found were in the recovered Jumpshot Lab.

## Post-fix verification — fb406ca

Feature commits `91955f4` (finder/Fuse/visual), `d372a75` (Build Doctor/Undo), `829136d`
(saved searches), `5db21e9` (44×44/cap wording), `5213404` (touch stability, mobile DOM
order, batching and unreachable badge targets), `81f7bc8` (vertical swipe direction lock,
clipboard fallback), `322e697` (coarse-pointer copy wording) `63a6f5b` (cloud deletion clears
the local session only), `e2989e6` (build from a sentence) and `fb406ca` (sentence apply
receipt, cancel copy and badge goals). Verified by the builder thread against `main` on the
local static server, using
headless Chromium 140 at 1280 px and 390 px. The historical matrix above is the earlier
`b37abd0` audit; this section is the post-fix state.

### P0 — builder Find builds

- **Root cause:** the builder called the local worker `find` handler. It returned 12 rows whose
  allocations were over the 99 wall while labelling them overall 99 (`ratingOf` up to 116.78),
  so `filterSolverResults` correctly dropped every row.
- **Fix:** `assets/builder-finder.mjs` maps the builder controls to the recovered reference
  finder worker and validates every returned row through `filterSolverResults`. The builder
  searches legal base allocations (`caps: 0`); cap-breaker plans stay in the cap-breaker planner.
- **No targets (current position, the new default):** 12 rows in ~1.0 s; first row PG 79" /
  204 lb / 79", true 98.9, raw 98.9985 / 99. Status: `12 result(s) · recovered reference finder`.
- **Three-Point 60 (current position):** 12 rows in ~5.6 s; 12/12 meet the target; 0 breakers;
  all raw < 99.
- **Three-Point 78 + Pass Accuracy 90 + Ball Handle 90 (current position):** 12 rows in
  ~5.6 s; 12/12 meet all three targets; 0 breakers; all raw < 99. The table title now prints
  six decimals so a value such as 98.99996 is not mistaken for 99.0000.
- **Any position** is now opt-in and labelled `Any position (slower)`. Checking it takes roughly
  24–26 s; progress entries are cleared when the search finishes.
- **Load:** applies the validated base allocation and re-checks the wall. Any-position searches
  remain the slow path; current-position searches are ~1–6 s.

### Fuse planner

The candidate list was replaced by `assets/fuse-planner.mjs`, mounted in the builder:

- **Best fit / My picks** toggle. Best fit uses the recovered `tierCost`, `tokensAt`,
  `maxTierOf`, `slotCaps` and `effectiveFuse` rules to choose tiers inside the token pools and
  group caps, then picks the best fuse assignment. My picks exposes manual slots and tier pins.
- **0–9 fuse slots** and **0–6 +2 slots**, per-slot badge and reaction selectors, resulting tier
  (`Silver → HOF` etc.), gain, and `0` token cost for fused badges.
- **Tier pins** for every badge that can earn a tier, **flex tokens per group**, and editable
  **group caps**.
- Summary: `30 planned tiers · 8 fuse slots · 21 / 50 tokens` on the default build; the group table
  shows pool, flex, budget, spent and over/full/ok status. The sidebar's `32 tiers` is the earned
  tier count; the planner's number is explicitly the planned tier count, and the unlocked line now
  uses the same 32-tier count as the sidebar.
- Honesty note kept: the in-game Fuse result table is the final authority.
- Desktop and 390 px: no console errors, no horizontal overflow; slots, +2 slots, pins and flex
  changes were exercised in the browser test.

### Tokens tab

`/badges/` now has a fourth **Tokens** tab with 212 badge-tier rows (53 badges × 4 tiers) and a
**Tokens** column in the **Badge plan** table. It loads `lab-engine.js` on demand for
`GBLE.tierCost`; the builder's **Next badges** list also populates on first render.

### Direct cap-breaker row build

`/cap-breakers/` rows now offer **Build this row** alongside **Find builds**. The row handoff
(`assets/cap-breaker-row.mjs`) rebuilds the row through `fitTargets` and the validated builder
path. The known row was exercised end to end:

- PG 5'9", Driving Dunk 28 → 77, 5 cap breakers.
- Result: Driving Dunk 77, Overall 92 · true 92.2 · raw 92.2982 / 99 (legal, under the wall).
- The attributes panel note names the row and the breaker plan; `fb.lbrk` stores `5`.
- Desktop and 390 px: no errors, no overflow.

### Visual workspace

The builder now uses a two-column workspace: sticky compact sidebar (Body, Import, Build actions,
Build name, Badges) and a dense attributes panel. It adds:

- Dark navy header and cream builder surface in light mode; theme-aware dark surface.
- Segmented PG/SG/SF/PF/C control and body sliders with exact values.
- 34 px control height, 6 px range tracks with ticks, 16 px thumbs, and per-row `max` hints.
- Per-row `−`/`+` steppers (26 × 21 px desktop, 44 × 44 px mobile), grouped category colors and
  a compact group legend.
- Compact screenshot import below Body with one privacy sentence; tier legend moved to the
  builder badge panel.
- The primary action is Fill to 99; solver actions are secondary.

Screenshots: `/tmp/desktop-light-builder-v2.png`, `/tmp/desktop-dark-builder-v2.png`,
`/tmp/mobile-builder-top-v3.png`. The builder nav fits at 1280 (client and scroll width 1148);
at 390 it is a single horizontal scroller.

### Fill to 99 and other controls

- **Fill to 99** now uses the recovered `badgeOptimise` `meta` path first and falls back to the
  local three-pass fill if the optimizer is unavailable. Reset → Fill to 99 gives
  `Overall 99 · true 98.9 · raw 98.9960 / 99`.
- Steppers were enlarged, and the all-position search is opt-in, so the earlier `Overall 98`,
  tiny-stepper and 26 s default-search findings are closed.

### Touch stability and mobile order (5213404)

- Mobile DOM order is now Body → Import → Build actions → Build name → Attributes → Find →
  Build Doctor → History → Badges → Share → Tools → Fuse. This is a real DOM reorder, not CSS
  `order`/`display: contents`, so tab and screen-reader order match the screen.
- `overflow-anchor: none` was removed. Ranges use `touch-action: pan-y pinch-zoom`; a vertical
  swipe starting on a slider scrolls the page, while a horizontal drag changes the value. A
  direction lock restores the starting value on vertical intent and applies a touch drag only
  after ~8 px of horizontal movement; the body weight/wingspan/height sliders use the same guard.
  Tested: a 120 px vertical swipe from 61 stayed 61 while scrollY moved 1214 → 1349.
- Coarse-pointer tablets get 44×44 steppers, 44 px controls and a static (not internally
  scrolling) sidebar. The builder nav uses `touch-action: pan-x` and contained overscroll.
- Reproduced 10 rapid `+` taps at 60 ms: row top stayed 376 px, scrollY stayed 1214, value
  went 51 → 61. History/Badges may grow below Attributes but no longer move the row under the
  finger. History/Badges/Doctor are below Attributes on mobile.
- Steppers batch for 80 ms and commit the share/QR code after 250 ms. A click-capture flush
  makes immediate Copy code / Save to this device / Undo use the final displayed value:
  copy 56, saved 54, history captured 55, then Undo returned 51. A range pointerdown cancels a
  pending stepper and reverts its preview.
- Build Doctor HOF target now says “HOF is unreachable on this frame” with the ceiling detail
  and a **Find a body** link instead of leaving a dead `Write 1 target` button.
- `Copy code` guards `navigator.clipboard?.writeText`; on denial it selects the code input and
  shows “Copy failed — the code is selected; press Ctrl/Cmd+C.” instead of an uncaught rejection.
- Browser tests: `builder-touch.browser.cjs`, `builder-batching.browser.cjs` and
  `builder-clipboard.browser.cjs` cover vertical/horizontal gestures, 10-tap stability,
  Copy/Save/Undo flush, range cancellation and the denied-clipboard fallback.

### Independent verification — 766a7db vs 81f7bc8

The builder thread re-ran the same checks from a clean `git archive 766a7db` on port 8124,
with 390×844 touch emulation and CDP, and compared them with the context engineer's run.

| Check | Independent (766a7db) | Context (766a7db) | Verdict |
| --- | --- | --- | --- |
| 10 taps on Raise Close Shot | 51 → 61; scrollY 1214 → 1214; row top 376 → 376 | 51 → 61; scrollY 1214 → 1214; row top 400 → 400 | Same behavior; row-top baseline differs with the scroll position |
| Vertical swipe starting on range | scrollY 1214 → 1343; value 61 → 61 | scrollY 1214 → 1360; value 61 → 61 | Same invariant; scroll distance differs with gesture slop/timing |
| Weight vertical swipe | weight 180 → 180; scrollY 0 → 128 | weight 180 → 180; scrollY 38 → 169 | Same invariant; starting scroll differs |
| Weight horizontal drag | weight 180 → 216; scroll unchanged | weight 180 → 230; scroll unchanged | Same behavior; drag distance/start differed |
| Immediate Copy / Save / Undo | copy 56; save 54; history 55; undo 51 | copy 56; save 54; history 55; undo 51 | Exact match |
| Range pointerdown cancels stepper | value 51; code 51 | value 51; code 51 | Exact match |
| Denied clipboard | toast shown; input focused; 128 chars; 0 errors | same | Exact match |
| Aerial Wizard HOF | unreachable text; no Write; Find a body | same | Exact match |
| DOM order at 390 | Body → Import → Actions → Name → Attributes → Find → Doctor → History → Badges → Share → Tools → Fuse | same | Exact match |
| Unit suite | 103 pass / 0 fail | 103 pass / 0 fail | Exact match |

The row-top and scroll-distance differences are baseline/gesture differences, not behavior
differences: both runs show the row and scrollY unchanged during the tap burst and the range
value unchanged during the vertical swipe. The copy nit was real: on `766a7db` the mobile toast
said “press Ctrl/Cmd+C”. `322e697` uses **“use your copy menu”** on coarse pointers and keeps
“press Ctrl/Cmd+C” on fine pointers; the clipboard test now covers both.

### Build from a sentence (e2989e6, hardened in fb406ca)

`assets/build-from-sentence.mjs` adds a **Build from a sentence** panel directly after
**Find a build** in the mobile DOM order. It parses:

- Heights `6'8"`, `6’8”`, `6ft8`, `6 foot 8`, `6-8`, `68"`; weights `205 lb`/`205lbs`/
  `205 pounds`; wingspans `7'0 WS`, `wingspan 7'`, `80" wingspan`, `+2 wingspan`.
- PG/SG/SF/PF/C plus guard/wing/forward/big/center.
- Attribute synonyms including `three`/`3pt`, `perim d`, `swb`, `rebound`/`board`,
  `dunk`, `pass`, `handle`.
- Targets `90+ three`, `90 three`, `at least 88 perimeter D`, `max speed`, `min 75 pass`.
- Breakers `22 cap breakers`, `+5 on three`, `use 3 breakers on steal`.
- Badges `HOF posterizer`, `gold limitless`, `contact dunks`, `no badges below silver`.

Validation uses `GBLE.heightsFor`, `PB`, `ceilingsFor`, `upStart`, `settle`, `ratingOf`,
`overallOf`, `trueOvr` and `badgeTiersOf`. The review card shows the chosen body, body
adjustments, every target's current/requested/cap/result and a cap/99-wall/linked reason,
badge goals, breaker budget/shortfall and the badge floor. Badge-derived target rows are
labelled `from <badge>`. A badge tier that cannot be reached on the body is reported once on
the badge goal (for example `HOF Posterizer is unreachable on this body: needs Driving Dunk
99 (cap 90)`), and a badge-only request does not produce the generic explicit-target warning
or the closest-legal button label. Unrecognized text is listed under **I didn't understand**;
nonsense input has no Apply button.

The current build is unchanged until **Apply to builder**. On success Apply becomes a
disabled **Applied** button, a single receipt replaces the pending state, **Undo** appears
and Cancel becomes **Clear review**. Pressing Apply again does nothing and cannot stack
receipts. Undo restores the build and the previous breaker level; re-applying restores the
candidate. **Clear review** after an apply says the applied build stays and points at Undo;
before an apply it says the current build was not changed. The review area has a fixed height
(340 px desktop, 360 px mobile) so the panel does not shift the page when a review appears;
at 390 the five target columns fit without page overflow.

Browser test `tests/browser/builder-sentence.browser.cjs` covers a reachable request,
an unreachable perimeter target (cap 87, applies 87 with the closest-legal label), pure
nonsense (unrecognized list, no Apply), no build change before Apply, double Apply (one
receipt, disabled action), Undo/re-apply, Clear review after apply, a badge-only `6'4 PG HOF
posterizer` request (two `from Posterizer` rows, one unreachable badge line, no generic
warning, Apply to builder, unchanged until confirm), 44 px mobile Apply, and no overflow at
1280/390. `tests/build-from-sentence.test.mjs` has 41 parser/validation cases, including the
badge goal's single unreachable requirement.

Screenshots:

- `docs/evidence/build-from-sentence/empty-1280.png`
- `docs/evidence/build-from-sentence/empty-390.png`
- `docs/evidence/build-from-sentence/review-unreachable-1280.png`
- `docs/evidence/build-from-sentence/review-unreachable-390.png`
- `docs/evidence/build-from-sentence/applied-1280.png`
- `docs/evidence/build-from-sentence/applied-390.png`

The applied screenshots show the sentence panel, the single receipt and the post-apply action
row (Applied / Undo / Clear review) at both widths.

### Cloud account deletion (63a6f5b)

- `deleteAccountWith()` runs `delete_own_account` first, then `signOut({ scope: 'local' })`.
  The normal Sign out button still uses the global `signOut()`.
- Unit tests assert the RPC/sign-out order, the `scope: 'local'` option, and that a failed RPC
  does not sign out.
- Browser test mocks sign-in, `getUser`, the builds list, the delete RPC and a local logout;
  it asserts the UI reports success, no global logout is requested, and no logout response is
  4xx. The real client still issues a `scope=local` request; Supabase treats 401/403/404 there
  as non-fatal and clears the local session.

### Build Doctor and history (own features)

- **Build Doctor** (`assets/build-doctor.mjs`) reports the displayed overall, true overall and raw
  score, explains why the build is below a target, lists frame ceilings, and suggests legal
  single-step changes. **Plan to target** walks the recovered validator to a target overall; from
  the reset build it reached 99 in 162 small steps in ~0.5 s. **Apply plan** writes the final
  allocation through `__applyCandidate`, so the wall and linked ratings still apply.
- **Target a badge tier** shows the current tier and every requirement gap, and writes the
  missing targets through `__writeTargets(..., true)`.
- **Undo/Redo + history** (`assets/builder-history.mjs`) snapshots the builder's own share codes
  locally, supports Ctrl/Cmd+Z and Shift+Ctrl+Z, lists recent edits with Restore, and stores
  named versions in `fb.versions.v1`. It never uploads anything.
- **Saved searches** (`assets/builder-saved-searches.mjs`) stores target sets, any-position and
  position in `fb.searches.v1`; Load/Run reuse them, and Copy link creates a `?find=` URL that
  pre-fills the same controls. The shared link was verified at 390.
- Browser tests: reset → Diagnose → Apply → Undo → Plan to target → Apply plan → named version,
  and save → load → run → shared link, at 1280 and 390, with no console errors or overflow.
- `node --test tests/*.mjs`: **146/146 pass** (Build Doctor, cloud, parser/validation and the existing suites). Independent clean-archive run on `766a7db`: 103/103.

### Mechanics Lab and other P2

- Mechanics Lab cards now open a detail panel with kind/category, height range, requirements,
  summary and all four badge tier requirements (e.g. Aerial Wizard). Back to results closes it.
- Screenshot review prints `6'3"` / `6'9"` instead of raw inches. A rejected Apply highlights the
  offending attribute and names it (e.g. `Standing Dunk is the likely blocker`).
- Animation and shade empty states no longer say "press Load to use the first one" when there is
  no result.
- Jumpshot Lab cue buttons and the Calibrate button are 44 px tall at 390 px; timing math is
  unchanged.
- GOAT/GOATED cards explain that a fitted build's overall can be one point below the card header.

### Verification

- `node --test tests/*.mjs`: **98/98 pass**.
- Browser tests pass: badges (including Tokens), screenshot import/rejection, builder controls,
  builder finder, cap-breaker row, Fuse planner, Mechanics detail, Build Doctor/history, saved searches, builder touch, builder batching, builder clipboard, build from a sentence.
- 390 px: no horizontal overflow on builder, cap-breakers, badges, mechanics, jumpshot-lab.

## Not tested

- Real 2K HQ / bar-screen / Attribute Editor screenshots (the user offered to supply them).
- A paid account or any entitlement-only server response.
- In-game validation of any solver output.
- Every input combination for every solver.
- Supabase sign-up/save/load/delete end to end until the schema SQL is run.
