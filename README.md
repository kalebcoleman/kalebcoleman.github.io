# Kaleb Coleman Portfolio

Robotics, control, machine learning, and data engineering portfolio. Flask/Jinja provides a shared source for local development and a static GitHub Pages export.

## Public website

https://kalebcoleman.github.io/portfolio/

## Build and preview

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python tests/test_routes.py
.venv/bin/python build_static.py --base-path /portfolio
python3 -m http.server 8000 --directory dist
```

The export uses the `/portfolio` base path expected by GitHub Pages. To preview at the server root, build with `--base-path ''` instead. Do not commit generated `dist/` files.

## Deployment

GitHub Settings → Pages → Source: **GitHub Actions**. Pushes to `master` run `.github/workflows/pages.yml`, test the Flask routes, export static HTML and assets, and deploy the Pages artifact. No Azure subscription, Flask server, or secrets are needed for Pages. The old Azure workflow is manual-only for rollback; its resources are not deleted by this migration.

The static export includes Home, Projects, Skills, Experience, Contact, the résumé PDF, and compatibility redirects for `/1` through `/5` and `/resume`. Source content is in `app.py`, templates in `templates/`, styling and assets in `static/`.

Robotics results are explicitly simulation-based; physical digital-twin calibration and quadrotor hardware validation remain future work. The downloadable résumé was updated in October 2026 with current robotics research, technical skills, and education.

## Content conventions

Home-page featured projects are chosen by `FEATURED_SLUGS` in `app.py`; each project carries its own `image` (or a `placeholder` label), so reordering never mismatches images. Robotics projects use a `status` mapping (`simulated`, `developing`, `planned`) so simulation results, work in progress, and future plans stay distinct. Do not link or describe private repositories without the owner's approval.
