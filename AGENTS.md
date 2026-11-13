# Portfolio Agent Notes

This file captures implementation decisions for the Flask portfolio app in this repository.

## Current Product Decisions

- Keep a single visual theme across all endpoint pages using the existing light blue/clean style from page 1.
- Keep all five endpoints active: `/1`, `/2`, `/3`, `/4`, `/5`.
- On `/2`, do not render the NAU sample table under the scraper card.
- `/3` should show only:
  - the NBA image gallery
  - the AI course findings table
- Do not re-add the two top dashboard charts on `/3` unless explicitly requested.
- `/4` is a case-studies page and should use challenge/role/process/outcomes format for featured projects.
- `/5` is a cross-project build-notes page (not NAU-only) and should cover all showcased projects.

## `/3` NBA Gallery Rules

- Use exactly two images in the gallery:
  - `static/images/nba_plots/shot_difficulty_vs_actual_efficiency.png`
  - `static/images/nba_plots/player_archetypes_scatter.png`
- Gallery layout must be responsive and fit cleanly on desktop/mobile:
  - keep the framed image container (`.plot-media`)
  - keep `img` width fluid with `height: auto`
  - avoid overflow/cropping

## Content Accuracy Rules

- Keep project descriptions factual and consistent with real work.
- NAU Course Catalog Scraper:
  - Selenium + PDF prefix extraction + cleaning + CSV/export analysis flow
  - AI/ethics analysis in R Markdown
  - supports high-precision and broad recall analysis scripts plus ethics analysis
  - not presented as a SQLite storage project
- NBA Shot Data Engineering Package:
  - multi-source ingestion + cleaning + schema validation
  - rerunnable load/upsert behavior in SQLite
  - GAM modeling, clustering, and shot-archetype analysis
- Any NAU pipeline wording must remain CSV/report based (not NAU SQLite load claims).

## Naming Preferences

- Keep project name: `NBA Shot Data Engineering Package`
- Keep project name: `NAU Course Catalog Scraper`

## Run/Test Commands

- Install deps: `pip install -r requirements.txt`
- Run app: `export FLASK_APP=app.py && flask run --port 5001`
- Run tests: `python3 tests/test_routes.py`

## Deployment Notes

- Deployment target is Azure **Web App** (not Azure Static Web Apps).
- GitHub workflow: `.github/workflows/azure-webapp-deploy.yml`
- Required GitHub config:
  - Secret: `AZURE_WEBAPP_PUBLISH_PROFILE`
  - Variable: `AZURE_WEBAPP_NAME`
- Azure Web App startup command should be:
  - `gunicorn --bind=0.0.0.0 --timeout 600 app:app`

## October 2026 migration

The user requested GitHub Pages hosting. `.github/workflows/pages.yml` is the primary deployment workflow; Azure is manual-only for rollback. Build static output with `python build_static.py` (see the November 2026 note for the base path). Retain the existing page style and factual content rules. Current routes follow the README; the numbered legacy routes redirect.

## November 2026: apex hosting, data files, digital-twin positioning

- The repository is `kalebcoleman/kalebcoleman.github.io` and the site is served from `https://kalebcoleman.github.io/` (base path `/`). `build_static.py` also writes `/portfolio/...` redirect pages and a `404.html` so old `/portfolio/` links keep working.
- Content lives in `data/projects.yaml` (projects and home-page layout) and `data/site.yaml` (profile, skills, experience, education). Add or edit projects there, not in `app.py` or the templates.
- Positioning: digital twins across systems (Unitree G1, contact-rich assembly, twinsmith, quadrotor). Keep every claim scoped to simulation unless hardware results exist, and keep the upstream credits.
- Do not use LEGO or brick-stacking framing. The `contact-assembly-lab` project is described as a contact-rich robotic assembly testbed; BrickSim is named only as a credit.
- Never link private repositories. The two-arm UR5e test (`rise-two-arm-research`) was removed from the site and made private in November 2026; do not re-add it. The image reconstruction project is an older coursework entry and stays last, off the home page.
- The older sections above that describe `/1` to `/5` page content and the NBA gallery predate the current site; the numbered routes only redirect now.

