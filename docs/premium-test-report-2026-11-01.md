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
This isolates the failure to the builder's local WASM finder path, not the recovered reference
worker or the data.

Likely causes to investigate, in order:

1. The builder passes `l: y.alloc` and `o: y.lock` to the local finder; the local bridge may treat
   `l` as fixed values instead of only locked ones.
2. `__filterSolverResults` may be discarding every engine row after the search.
3. The builder may need the recovered reference worker, as `/finder/` already uses, instead of the
   local WASM finder.

Do not mark this fixed until the builder returns the same 12-result Floor general example as the
standalone finder and `/finder/` at a phone viewport.

## P1 — remaining recovered premium work

1. **Direct cap-breaker row build.** Add a Build this row action using the recovered row/ladder
   data, through `__applyCandidate`, and show the imported breaker plan explicitly.
2. **Full Fuse planner.** The candidates panel is a good start. A full planner should let the user
   pick a compatible pair and show the resulting tier/slots and token cost, or clearly say the fuse
   result table is not recovered. Keep the current honesty note if the result rules are unknown.
3. **Mobile tap targets in the Jumpshot Lab.** The recovered trainer has 24 px-high buttons
   (`Jump`, `Set Point`, `Push`, `Release`, `Calibrate`); enlarge them for 390 px without changing
   the trainer's calculations.

## P2 — small polish

- Screenshot review shows `Body: PG · 75" · 170 lb · 81" wingspan`; format height as `6'3"`.
- When Apply is rejected, name the offending attribute and highlight its review input.
- Confirm the `/builder#cloud` anchor scrolls to the Cloud builds panel (the panel now has
  `id="cloud"`).
- Add a DOM-level test for the screenshot file input and Apply/Cancel flow (the current test only
  covers normalization).

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
