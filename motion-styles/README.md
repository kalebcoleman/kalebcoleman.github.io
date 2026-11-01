# Motion styles catalog

Standalone, local-only rebuild of the Goated Build Lab Mechanics Lab **Motion styles** page. The canonical page is `/motion-styles/`; it needs no account, backend, build step or runtime network call other than loading its own static JSON.

## Files

- `motion-styles/index.html` — the page shell and static controls.
- `motion-styles/styles.css` — page styling; light/dark and responsive.
- `motion-styles/app.mjs` — loads the data, starts the catalog, registers the offline worker.
- `motion-styles/sw.js` — precaches the page, CSS, app, module and data for offline use.
- `assets/motion-styles.mjs` — pure data/filter/sort/recommendation helpers plus the DOM renderer.
- `data/motion-styles.json` — the recovered table and provenance.
- `tests/motion-styles.test.mjs` — 16 source-count and filtering tests.

## Recovered data

`data/motion-styles.json` contains the recovered NBA 2K27 `MOTIONT` table:

- 3 height groups / test builds: Guard at 6'2" (74 in), Wing at 6'6" (78 in), Big at 7'0" (84 in).
- 458 measured rows: 107 Guard, 238 Wing, 113 Big.
- 368 unique style names, each with one height range and optional Speed/Agility asks.
- Four runs per row: offense jog, offense sprint, defense jog, defense sprint. Each run is a `[time, top speed]` pair over 47 ft.

Both recovered copies agree row for row:

- `engine.js` — `window.GBLE.MOTIONT` (the minified variable `Tl`).
- `mlab-motion.html` — the rendered page's `<script type="application/json" id="bp-data">` `motion.builds`.

Provenance, the original method, counts and a SHA-256 of the row table are stored under `about` in the JSON. The tests recompute the hash.

### Timing gaps worth preserving

- At 5'9"–6'4" heights, 114 styles fit the height gate but only 107 have Guard-build times. Seven styles (Damion Baugh, Kendrick Nunn, Kent Bazemore, Kira Lewis Jr., Malik Beasley, Terence Davis, Terry Rozier III) were timed only on the 6'6" build. They appear untimed and sort last; no times are borrowed.
- The Wing build has 238 measured rows but only 232 styles fit the Wing height band. Six rows were timed on that build despite not covering the band, which the group summary calls out.

## Behavior

- Height picker covers every MyPLAYER height from 5'9" to 7'4" and selects the times from that height's band build.
- Search is case-, diacritic- and whitespace-tolerant (for example `doncic` matches `Luka Dončić` and `alondes williams` matches the source's `Alondes  Williams`).
- Run picker highlights the selected run(s) and controls the sort key. Sort modes are fastest time, top speed and name.
- Optional "My Speed" / "My Agility" filters apply the recovered minimum asks; a style with no ask always passes.
- Recommended is calculated from all timed styles at the height, not from the filtered result: fastest combined offense + defense sprint time, ties to the higher combined top speed.
- Cards have accessible headings and gate labels, selected runs use `aria-current`, the status is a compact live region, and the empty state names near-miss heights.

## Offline

The module registers `sw.js` with the `/motion-styles/` scope when service workers are available. The worker precaches the page, CSS, app, module and data. The page still works normally without a service worker; the catalog is fully static.

## Tests

```sh
node --test tests/motion-styles.test.mjs
```

The suite covers source-derived 3/458/368 counts, the row hash, band counts (114/107/7 and 232/238 with 6 extra Wing rows), height/requirement gates, search, rating filters, every sort mode, recommendation ties, untimed ordering, group summaries, validation failures and local-only/offline asset checks.

## Limitations

- Times and gates are recovered, not re-run in the game. They are the reference site's own timing runs.
- A run's 47 ft time moves about 0.05 s from run to run; close times are even. Top speed repeats better.
- A motion style affects off-ball movement only. Dribbling speed is governed by Speed With Ball.
- The canonical page is `/motion-styles/`. The parent integration owns any root `motion-styles.html` route copy and site navigation outside this directory.
