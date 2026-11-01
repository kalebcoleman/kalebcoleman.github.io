# Jumpshot Practice Lab

A free, browser-local jumpshot and free-throw timing trainer for Free Builder. It is a standalone page reached at `/jumpshot-trainer/`; no existing shared file is required for it to run. There is no backend, authentication, paywall or external service dependency.

## What it includes

- **Jump-shot practice** with a large pointer/keyboard shot pad, visual cue, optional audio cue and an estimated green window.
- **Free-throw ladder**: ten reps per set, a dot-per-rep scorecard, clean-release count and previous-set summaries.
- **Calibration**: samples recent jump-shot releases at the current offset, estimates a residual bias and suggests a local target offset. Samples taken at an older offset are not reused, so applying an adjustment requires fresh reps.
- **Recommendations**: practice adjustments and next drills derived only from the local timing log. The recommendation engine never claims to tune NBA 2K.
- **Shot setup**: the recovered `jType` / `jBase` / `jR1` / `jR2` / `jSpeed` / `jInput` / `jCue` / `jDiff` / `jSpot` / `jHand` / `jSprint` / `jMeterOn` / `jMeterIn` vocabulary, plus cue bar, free-throw rating, meter placement, sound and auto-advance.
- **Local persistence** under `fb.jumpshotTrainer.v1`, including settings, attempts and the selected tab.
- **Backup and restore**: export a JSON practice log or import a previous export.
- **A Jumpshot Lab link**: generates a local `/?tab=jumpshots&j*...` link with the recovered field names. It sends nothing.
- **Accessibility**: semantic tabs with arrow-key navigation, keyboard start/release (`Space` or the focused shot pad), `S`, `Esc`, live status regions, visible focus, high-contrast and reduced-motion support.

## Honesty boundary

Every timing number is an **estimated local practice target** derived from the selected setup and the browser clock. It is not an NBA 2K measurement, a capture of game tuning tables, or a simulation of NBA 2K shot physics. Clean releases are timing-drill scores, not simulated makes. The page says this in its hero, in feedback, in the calibration panel, in recommendations and in the footer limits section.

The 3D-looking court is a decorative CSS/SVG scene. It is not a game capture.

## Run locally

From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/jumpshot-trainer/`. A local server is needed for ES modules and the animation-table fetch. The trainer still boots if `/data/animations.json` is unavailable; animation names are labels and do not affect the timer.

## Tests

```sh
node --check assets/trainer-engine.mjs
node --check assets/trainer-app.mjs
node --test tests/trainer-engine.test.mjs tests/trainer-page.test.mjs
```

The engine tests cover the recovered settings shape, estimated profiles, timing bands, summaries, free-throw drills, calibration bias and offset isolation, recommendations, import/export validation, share-query fields and attempt normalization. The page tests cover local-only assets, accessibility wiring, tab semantics, handler IDs, honesty copy and the documented commands.

## Files

```text
jumpshot-trainer/index.html        page shell and static content
jumpshot-trainer/trainer.css       page-specific visual system
jumpshot-trainer/README.md         this document
assets/trainer-engine.mjs          pure timing, calibration, storage and recommendation logic
assets/trainer-app.mjs             DOM, keyboard, pointer, audio and persistence wiring
tests/trainer-engine.test.mjs      engine regression tests
tests/trainer-page.test.mjs        static integration and accessibility contract tests
```

The engine has no imports, DOM access, network access or third-party runtime dependency. The app imports only `./trainer-engine.mjs` and fetches only the same-origin animation table.

## Calibration model

A positive local offset shifts the estimated target earlier; a negative offset shifts it later. The calibration panel uses the median residual error from recent non-free-throw reps at the current offset. It becomes ready at six reps, but the Apply button stays disabled while confidence is low; collect a larger or steadier sample first. Applying a suggested offset invalidates the old sample by design, so the next calibration reading needs fresh reps at the new offset. The manual slider remains available at any time. This is browser reaction calibration, not game latency measurement.

## Known limitations

- The timing model is a deliberate local practice aid, not recovered NBA 2K tuning data.
- The local animation table has no separate Release category, so the Jumpshot Lab base list is used as the release fallback, matching the recovered asset's fallback.
- There is no game/console integration, account, cloud sync or community feed.
- No exact 3D player or animation playback is claimed; the court scene is decorative.
- A shot is cancelled without logging if the page becomes hidden, because background timers would not be trustworthy.
- localStorage limits, private browsing and storage permissions vary by browser; export a backup before clearing site data.
- Audio cues require a browser audio context created by the first shot gesture. Visual cues, text feedback and keyboard controls remain available without audio.
