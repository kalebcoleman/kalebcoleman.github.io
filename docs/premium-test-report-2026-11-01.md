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
| Cloud accounts | Panel mounts | No overflow | Sign-in form loads; password reset and Delete account controls exist. Supabase schema still needs the user's one-time SQL run. |

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

## Not tested

- Real 2K HQ / bar-screen / Attribute Editor screenshots (the user offered to supply them).
- A paid account or any entitlement-only server response.
- In-game validation of any solver output.
- Every input combination for every solver.
- Supabase sign-up/save/load/delete end to end until the schema SQL is run.
