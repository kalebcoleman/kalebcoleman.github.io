# Kaleb Coleman Portfolio

Portfolio site for my robotics work: simulation digital twins of robotic systems (Unitree G1 humanoid, UR5e contact-rich assembly, quadrotor control), the Isaac Sim tooling behind them, and earlier data science projects. Flask and Jinja render the pages for local development and for a static GitHub Pages export.

## Public website

https://kalebcoleman.github.io/

The site used to live at `https://kalebcoleman.github.io/portfolio/`. Those links still work: the build writes redirect pages under `/portfolio/` and a `404.html` that forwards any other `/portfolio/...` path to the same path at the root.

## Build and preview

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python tests/test_routes.py
.venv/bin/python build_static.py
python3 -m http.server 8000 --directory dist
```

The export is built for the site root (`--base-path /`, the default). To serve it from a sub-path, pass that path, for example `--base-path /preview`. Do not commit generated `dist/` files.

## Adding a project

Every project is one entry in [`data/projects.yaml`](data/projects.yaml). No Python or template changes are needed.

1. Add an entry under `projects:`. Its position in the list is its position on the Projects page.

   ```yaml
   - slug: my-new-project            # unique; becomes the #anchor on the Projects page
     name: My New Project
     repo_name: my-new-project       # small label above the card
     repo_url: https://github.com/kalebcoleman/my-new-project   # public repositories only
     badge: Runs in simulation
     tagline: One or two sentences for the home page.
     summary: A short paragraph for the Projects page.
     stack: [Isaac Sim, Python]
     highlights:
       - A result, with its number and its limit.
     links:
       - label: Write-up
         url: https://github.com/kalebcoleman/my-new-project/blob/main/docs/RESULTS.md
     status:
       simulated: What runs in simulation today.
       developing: What is being built.
       planned: What is only a plan.
     limits: What the result does not show.
     credits: Whose work it builds on.
     media:                          # optional; files live under static/
       kind: image                   # or video (with poster; keep videos under 1 MB)
       src: images/my-new-project.jpg
       width: 960
       height: 540
       alt: A full sentence describing the image for screen readers.
       caption: What the image shows.
   ```

   Only `slug`, `name`, `repo_name`, `summary`, and `stack` are required. The comment at the top of the file lists every optional field, including `layout: feature` for a full-width panel like the NAU capstone.

2. Put any image or video under `static/images/` or `static/media/`.
3. To show it on the home page, add its slug to `home_layout` at the top of the same file (`lead`, `secondary`, `more_robotics`, or `data_science`). Home-page projects need a `tagline` and a `badge`; the lead needs `media`.
4. Run `python tests/test_routes.py`. The tests check that slugs are unique, media files exist, alt text is present, and no private repository is linked.

Profile text, skills, experience, and education are in [`data/site.yaml`](data/site.yaml).

## Deployment

GitHub Settings → Pages → Source: **GitHub Actions**. Pushes to `master` run `.github/workflows/pages.yml`, which tests the Flask routes, exports static HTML and assets, and deploys the Pages artifact. Because the repository is named `kalebcoleman.github.io`, Pages serves it from the root of that domain. No Azure subscription, Flask server, or secrets are needed for Pages. The old Azure workflow is manual-only for rollback.

The static export includes Home, Projects, Skills, Experience, Contact, the résumé PDF, and compatibility redirects for `/1` through `/5`, `/resume`, and the old `/portfolio/` paths. Templates are in `templates/`, styling and assets in `static/`, content in `data/`.

## Content conventions

- Robotics results are simulation-based. "Digital twin" here means the simulation side: a physics model of a real robot that is not yet calibrated against hardware. Hardware validation is future work, and the Jenga-playing robot is a research direction, not a built system.
- Robotics projects use a `status` mapping (`simulated`, `developing`, `planned`) so simulation results, work in progress, and plans stay distinct.
- Each project carries its own `media` and `image`, so reordering `home_layout` never mismatches media.
- Do not link or describe private repositories without the owner's approval.

## License

The site code (Python, templates, CSS, JavaScript) is released under the [MIT License](LICENSE). The content is not covered by it: the résumé, research poster, project text, images, and videos remain mine or their credited owners' and are not licensed for reuse.
