# Free-feature parity check: Free Builder vs. Goated Build Lab

Date: 2026-11-01. Tested signed out in a desktop Chromium browser.

- Reference: <https://www.goatedbuildlab.com/>
- Rebuild: local static server at <http://127.0.0.1:8123/> (repository `main`, commit `c0d7735`).
- No account was created, no plan was purchased and no premium action was completed. One free finder search was used; the reference counter moved from 5 to 4.

## Result in one line

The free data tools work on both sites. Mechanics Lab and Motion Styles are close matches in content and presentation. The rebuild is a simpler product on the Home, Builder, Finder, Cap Breaker and Jumpshot surfaces: the same core numbers are present, but the reference exposes much more dense result cards, the original position/height cap-breaker table, and a 3D trainer that uses the game's own timing arithmetic.

## What was tested on the reference (free, signed out)

| Flow | Input | Observed result |
| --- | --- | --- |
| Find a build | Floor general preset, PG, any height | `12 builds found in 3.8s`; detailed result cards with true overall, cap-breaker ladders, 25 badges by tier, badge-token counts and every attribute; one search used (5 → 4 left) |
| Builder | Opened `/builder`, changed SG to PG | Body changed to `PG · 6′6″ · 230 LB · 6′10″ WINGSPAN`; true overall changed from 98.9989 to 98.8699; attribute rows, badge tiers, cap-breaker ladders and tokens remained live |
| Cap Breaker Finder | Browsed default Driving Dunk table, then selected Three-Point | Table filtered and resorted; rows still show `current → target`, `+free points`, position and height (45 frames on the default view) |
| Jumpshot Lab | Changed shot type to Free throw, Stephen Curry, 75 rating | Real window shown as `green 73 ms`; ideal release `495 ms`; free-throw style, difficulty, meter and delay controls all worked |
| Mechanics Lab | Searched `Limitless Range` inside the embedded Lab | One matching badge card remained, showing Three-Point, deep-three effect, Gold value and 6 tokens at 6′6″ |
| Motion Styles | Opened `/mechanics-lab/motion-styles` | 3 groups, 458 rows, 368 styles; 232 styles at 6′6″; recommended `Drew Eubanks`, 4.87 s combined sprint |
| Premium gates | Clicked Builder Optimize; clicked the first cap-breaker row | Dialogs confirmed `Optimize this build is part of Mid` and `Building from the Cap breaker finder is Premium`; both remain inferred/observed client gates, not purchased |

## What was tested in the rebuild (free)

| Flow | Input | Observed result |
| --- | --- | --- |
| Find a build | Three-Point 78, Pass Accuracy 90, Ball Handle 90, any position | `12 result(s)` in ~52 ms; every displayed candidate met the three targets; results are a table (`POS / BODY / OVR / POINTS / LOAD`), not detailed cards |
| Builder | Changed position to SG, height to 6′3″ | Height/weight options and ceilings updated; overall and badge/next-badge readouts recalculated; no errors |
| Builder solvers | Optimize this build after setting Three-Point and Ball Handle to 90 | Local optimizer returned `+1001 attribute points · +56 badge tiers`, held the player type and cap-breaker landings, and produced a loadable result |
| Badge builder | Deadeye Silver | `11 result(s)`, one attribute target, loadable result; Limitless Range Gold correctly reported as unreachable by any PG body |
| Cap Breakers | Level 10, SG, 6′7″ | Ladder and 12 category levels work; `Parks` table rendered 18 rows with target/lands/free points; this is a planner plus table, not the reference's position/height finder |
| Jumpshot composer | Composed a shot, saved, shared | Settings persist locally; share query uses the recovered `j*` field names |
| Jumpshot Practice Lab | Free throws, 10-rep ladder, one rep | Set started, rep logged, `1 of 10` status and local log updated; no errors |
| Mechanics Lab | Searched `Limitless Range` | `1 of 96 entries`; link to the badge glossary and motion catalog |
| Motion Styles | 6′6″, default sort | 232 styles; groups, filters, sort, recommended line and all four runs per style rendered; matches the reference's counts and recommendation |
| Data pages | Badges, Takeovers | 53 badges and 24 takeover rows (21 specific + 3 default) rendered; no errors |
| All routes | `/`, builder, cap-breakers, badges, takeovers, animations, archetypes, shades, jumpshots, jumpshot-trainer, face-scan, locker, mechanics, motion-styles, legal pages | All returned 200 with no console/page errors |

## Visual comparison

- **Close:** Mechanics Lab hub content and Motion Styles page. The local Motion Styles page deliberately follows the reference's cream card layout, group count, labels, filters and recommendation rule; the live and local 6′6″ views both show 232 styles and recommend Drew Eubanks at 4.87 s.
- **Same palette family, different density:** Builder and Cap Breakers. The local dark theme uses the same dark navy/amber direction, but the reference is much denser: live attribute rows show caps, token pips, badge tiers and cap-breaker ladders inline, while the rebuild uses simpler rows and separate panels.
- **Meaningful UX difference:** Finder results. The reference's free result card is a full build summary; the rebuild's result is a compact table. Both return 12 builds for equivalent targets, but the rebuild does not expose badges/tokens per result.
- **Feature gap, not a bug:** Cap Breaker Finder. The rebuild's page is a cap-breaker planner with a Parks table; the reference's free surface is a position/height table of `current → target` rows. The original worker client and data exist in the repo but are not wired into this page.
- **Deliberate honesty gap:** Jumpshot Practice Lab. The reference shows game-arithmetic values (73 ms green at 75 Free Throw, 495 ms release) and a 3D player. The rebuild shows an estimated 495 ms target and 92 ms window with a 2D court and explicitly labels every value as an estimate. It is useful practice, but it is not the same trainer.
- **Home:** The reference opens directly on the Find a build form; the rebuild opens on a directory of tool cards.

## Premium features (inferred, not purchased)

The reference's client confirms these gates: Mid unlocks Optimize, badge-token/Fuse planning and unlimited finder searches; Premium unlocks cap-breaker-row building, badge/archetype/shade builders, min-max/better-frame, the full 2,494-animation list and unlimited saved builds. The rebuild exposes the equivalent solvers for free (Optimize, badge builder, min-max, cap-breaker build, full animation list). Existing REA evidence in `docs/goated-reference-rea-summary.json` and `docs/goated-solvers-rea-summary.json` covers the recovered worker/solver logic; no new REA pass was needed for this check.

## Recommended next work, in impact order

1. Wire the existing `cap-breaker-reference-finder.js` and `reference-finder-worker.js` into the Cap Breakers page as a position/height table, keeping the current planner below it.
2. Upgrade finder results from a table to reference-style cards with badges, token counts and key attributes.
3. Add a Starter/example build to the Builder so the first visit shows a complete build instead of the 25-across default.
4. Decide whether to vendor the public Jumpshot Lab trainer assets (`lab.js`, model/assets) for real game-arithmetic timing, or keep the clearly labelled local estimator.
5. Optionally default the rebuild to the dark theme, which is visibly closer to the reference than the current auto/light default.
