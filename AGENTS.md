# Free Builder — working agreement

This file is the standing brief for agents working in this repository. Read it before changing code.

## Mission

Build the fastest, best-looking free browser planner for NBA 2K builds, with parity to the
public client-side features of <https://www.goatedbuildlab.com/>. The site is a static
GitHub Pages distribution. It must keep working without a build step.

The user's explicit non-goals:

- No Community, radio, League, Locker, MyTEAM, Discord, payments, subscriptions or premium gates.
  Do not re-add these surfaces or link to them.
- No paid service. Cloud saves use the free Supabase tier only; the builder must keep working
  fully offline.

## Repository reality

- There is no `package.json` in the site root and no frontend build pipeline. The shipped UI is
  mostly compiled/minified JavaScript. Newer seams are plain ES modules in `assets/*.mjs`.
- Tests run with `node --test tests/*.mjs`.
- Serve locally with `python3 -m http.server 8000`; ES modules and workers need HTTP.
- `builder.html` and `builder/index.html` are identical. They load `assets/builder-BiMSljHZ.js`,
  which is only an entry point; the real builder component is `assets/builder-DRDtM3V1.js`.
- The reference engine and data are in `assets/lab-engine.js`, `assets/lab.js`, `assets/lab.css`,
  `j3d/`, `engine/` and `face-scan/`. These are recovered assets, not disposable build output.
- `assets/lab-engine.js` exposes `window.GBLE`. It already contains the reference screenshot
  readers (`GBLE.OCR.read`, `GBLE.ocrToRaw`, `GBLE.vetImport`), the upgrade planner math
  (`upStart`, `upCost`, `upPlan`) and the true-overall calculation (`trueOvr`). Check for an
  existing engine function before writing a replacement.

## Change rules

1. Put new logic in unminified `.mjs` modules where possible. Avoid hand-editing large minified
   data tables; if a bundle must change, keep the edit minimal and add a behavioral test.
2. Every behavior change needs a test that would fail before the change. Prefer worker, engine
   and DOM-level tests over `assert.match` on minified bundle strings.
3. When a surface is removed, remove its routes, nav links, lazy chunks, tests, docs and dead
   references. Do not leave a route table entry or a preload map pointing at a deleted file.
4. Bump `VERSION` in `sw.js` whenever the shell or cached assets change, and verify no precached
   URL is missing.
5. Keep legal copy truthful. `privacy.html`, `terms.html` and `delete-account.html` currently
   still say there are no accounts even though Supabase accounts exist. Update them whenever
   account or cloud behavior changes.
6. Never put a Supabase `service_role` key or any secret in browser files. The publishable/anon
   key is public and RLS is the security boundary.
7. Do not claim parity or a passing feature without evidence. State what was exercised, on which
   commit and route, and what remains untested.

## Verification before reporting done

```sh
node --test tests/*.mjs
git status --short
git log --oneline -3
```

Then smoke-test every route you changed against a local server. Check the browser console for
errors and check the mobile 390 px layout. For deployed changes, confirm the GitHub Actions test
run and Pages deployment are green with `gh run list`.

## Current priority queue

### 1. Screenshot import (only unfinished item from the user's last list)

Add builder import for 2K HQ app, bar-screen and Attribute Editor screenshots.

- The layout reader already exists: `assets/lab-engine.js` defines `GBLE.OCR` with `read`,
  `templatesFromCanvas`, `gameTemplates` and `VERSION`; `GBLE.ocrToRaw` maps recognized layouts
  (`A = 2K HQ app`, `B = bar screen`, `C = Attribute Editor`) to `{pos, height, weight, wingspan,
  attrs, current, unreadable, weak}`; `GBLE.vetImport` validates a candidate against the engine.
- Process images locally. Never upload them.
- Show recognized layout, body and every attribute; let the user review before applying. Use the
  existing validated builder path (`__applyCandidate`) so ceilings, linked ratings and the 99 wall
  still apply. Do not silently overwrite the current build.
- Handle unreadable fields explicitly. A partial read is acceptable; a false "imported" state is not.
- Add tests with synthetic OCR payloads for mapping/validation, plus a DOM test for the file
  input and review/apply flow. Do not add string-only tests for this.
- Add a short privacy note that screenshot processing stays on-device.

### 2. Account and legal correctness

- `privacy.html`, `terms.html` and `delete-account.html` must describe Supabase email/password
  accounts, what is stored (email, build name, build code, timestamps) and how to delete it.
- Add a user-facing account deletion path. The clean free-tier approach is a `security definer`
  RPC such as `delete_own_account()` in `supabase/schema.sql`, called from the Cloud builds panel.
  It must only delete `auth.uid()`. Document that the schema must be re-run once.
- Do not add payments or plan gating.

### 3. Test hardening

- Replace the current string-only `tests/builder-page.test.mjs` checks with a DOM test for
  Fill to 99, Reset, Clear breakers and Keep my build name.
- Add an asset-integrity test: every local `href`/`src` in HTML and every lazy import referenced by
  the shell exists, and no page links to a removed route.

### 4. Remaining parity work, in order

1. Mechanics Lab gameplay/boost detail pages.
2. Deeper badge-token/Fuse planning detail if the current Optimize/Max-token view is insufficient.
3. Finder result cards with badges/tokens per result if they still lag the reference.

### 5. Cloud verification (after the user runs the SQL)

Create a real free account, confirm email, save/load/delete a build, sign out and back in, and
verify a second account cannot read the first account's rows. Then update `docs/cloud-setup.md`
with the verified result.

## Reporting format

Lead with what changed and what is verified. Include the exact test command and count, the commit,
CI/Pages links, and an explicit "not tested" list. Avoid claiming the whole reference is replicated
from a sample of screens.
