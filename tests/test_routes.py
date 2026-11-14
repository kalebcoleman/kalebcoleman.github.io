import re
import sys
from html import escape
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import app as portfolio  # noqa: E402
from app import HOME_LAYOUT, PAGE_DESCRIPTIONS, PROFILE, PROJECTS, SKILLS, STATUS_LABELS, app, home_sections  # noqa: E402

# twinsmith's former name, in any case and with a hyphen, underscore or space; spelled as a pattern so the repository never contains it.
OLD_PROJECT_NAME = re.compile(r"isaac[- _]mcp", re.IGNORECASE)


class PortfolioRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_primary_routes_render(self) -> None:
        route_markers = {
            "/home": b"Digital twins across systems",
            "/projects": b"Curated technical work",
            "/skills": b"Technical toolkit",
            "/experience": b"Applied work, research direction, and recognition",
            "/contact": b"Get in touch",
        }

        for route, marker in route_markers.items():
            with self.subTest(route=route):
                response = self.client.get(route)
                self.assertEqual(response.status_code, 200)
                self.assertIn(marker, response.data)

    def test_root_redirects_to_home(self) -> None:
        response = self.client.get("/", follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.headers["Location"].endswith("/home"))

    def test_resume_redirects_to_repo_pdf(self) -> None:
        response = self.client.get("/resume", follow_redirects=False)
        self.assertEqual(response.status_code, 302)
        self.assertTrue(response.headers["Location"].endswith("/static/resume.pdf"))

    def test_legacy_routes_redirect_to_new_pages(self) -> None:
        redirect_targets = {
            "/1": "/home",
            "/2": "/projects",
            "/3": "/projects",
            "/4": "/experience",
            "/5": "/projects",
        }

        for route, target in redirect_targets.items():
            with self.subTest(route=route):
                response = self.client.get(route, follow_redirects=False)
                self.assertEqual(response.status_code, 302)
                self.assertTrue(response.headers["Location"].endswith(target))

    def test_capstone_poster_is_linked_and_present(self) -> None:
        response = self.client.get("/projects")
        self.assertEqual(response.status_code, 200)
        self.assertIn(b"static/nau-capstone-poster.pdf", response.data)
        self.assertIn(b"static/images/nau-capstone-poster-preview.jpg", response.data)
        for name in ("nau-capstone-poster.pdf", "images/nau-capstone-poster-preview.jpg"):
            with self.subTest(file=name):
                self.assertTrue((PROJECT_ROOT / "static" / name).is_file())
        self.assertTrue((PROJECT_ROOT / "static" / "nau-capstone-poster.pdf").read_bytes().startswith(b"%PDF"))

    def test_nba_modeling_project_links_render(self) -> None:
        response = self.client.get("/projects")
        self.assertEqual(response.status_code, 200)
        for marker in (
            b"Leakage-Aware NBA Win Modeling",
            b"https://kalebcoleman.github.io/nba-modeling/",
            b"https://kalebcoleman.github.io/nba-modeling/paper/paper.pdf",
            b"https://github.com/kalebcoleman/nba-data",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, response.data)

    def test_curated_content_is_exposed(self) -> None:
        self.assertGreaterEqual(len(PROJECTS), 6)
        self.assertGreaterEqual(len(SKILLS), 5)

        projects_page = self.client.get("/projects")
        self.assertEqual(projects_page.status_code, 200)
        self.assertIn(b"NBA Shot Data Engineering Package", projects_page.data)
        self.assertIn(b"Diffusion and Autoencoder Image Models", projects_page.data)
        self.assertIn(b"AI Multitool Assistant", projects_page.data)
        self.assertNotIn(b"Build Notes Across Portfolio Projects", projects_page.data)

    def test_navigation_and_resume_action_present(self) -> None:
        home_page = self.client.get("/home")
        self.assertEqual(home_page.status_code, 200)
        self.assertIn(b"Primary navigation", home_page.data)
        self.assertIn(b"Resume", home_page.data)

    def _layout_slugs(self) -> list[str]:
        return [HOME_LAYOUT["lead"], *HOME_LAYOUT["secondary"], *HOME_LAYOUT["more_robotics"], *HOME_LAYOUT["data_science"]]

    def test_home_layout_is_deliberate_and_media_follows_projects(self) -> None:
        slugs = [project["slug"] for project in PROJECTS]
        self.assertEqual(len(slugs), len(set(slugs)))
        layout = self._layout_slugs()
        self.assertEqual(len(layout), len(set(layout)))
        for slug in layout:
            self.assertIn(slug, slugs)
        for project in PROJECTS:
            for ref in filter(None, [project.get("image"), project.get("media"), *(project.get("gallery") or []), *(project.get("figures") or [])]):
                with self.subTest(project=project["slug"], media=ref.get("src") or ref.get("file")):
                    self.assertTrue((PROJECT_ROOT / "static" / (ref.get("src") or ref.get("file"))).is_file())
                    self.assertGreater(len(ref["alt"]), 30)
        # Reordering the layout keeps each project's own media attached to it.
        original = dict(HOME_LAYOUT)
        HOME_LAYOUT["secondary"] = list(reversed(original["secondary"]))
        try:
            html = self.client.get("/home").get_data(as_text=True)
        finally:
            HOME_LAYOUT.update(original)
        for project in home_sections()["secondary"]:
            card = html.split(f'id="sec-{project["slug"]}"')[0].rsplit("<article", 1)[1]
            if project.get("media"):
                self.assertIn(project["media"]["src"], card)
            else:
                self.assertIn(project["placeholder"], card)
        self.assertIn("media", home_sections()["lead"])

    def test_home_leads_with_digital_twins_across_systems_and_keeps_older_work_below(self) -> None:
        home = self.client.get("/home").get_data(as_text=True)
        order = (
            "Unitree G1 Humanoid Locomotion", "Contact-Rich Robotic Assembly Testbed", "twinsmith</h3>",
            "Prescribed-Time Quadrotor Control", "TurtleBot3 ROS 2 Sensing and Nav2", "DataFest", "NBA Win Modeling",
        )
        for marker in order:
            self.assertIn(marker, home)
        positions = [home.index(marker) for marker in order]
        self.assertEqual(positions, sorted(positions))
        self.assertEqual(HOME_LAYOUT["lead"], "g1-locomotion-lab")
        self.assertIn("237 of 256", home)
        for older in ("AI Multitool", "NAU Course Catalog Scraper", "NBA Shot Data Engineering Package", "Diffusion and Autoencoder Image Models"):
            self.assertNotIn(older, home)
            self.assertIn(older, self.client.get("/projects").get_data(as_text=True))

    def test_image_reconstruction_is_a_minor_older_project(self) -> None:
        robotics_and_data = [p["slug"] for p in PROJECTS if p.get("layout") != "feature"]
        self.assertEqual(robotics_and_data[-1], "image-reconstruction")
        project = next(p for p in PROJECTS if p["slug"] == "image-reconstruction")
        self.assertEqual(project["badge"], "Older coursework")
        for group in SKILLS:
            self.assertNotIn("ImageReconstruction", str(group.get("evidence", "")))

    def test_video_media_is_accessible_and_light(self) -> None:
        html = self.client.get("/home").get_data(as_text=True)
        self.assertNotIn("autoplay", html)
        featured = home_sections()["secondary"] + [home_sections()["lead"]]
        videos = sum(1 for project in featured if project.get("media", {}).get("kind") == "video")
        self.assertGreaterEqual(videos, 1)
        self.assertEqual(html.count("<video controls"), videos)
        self.assertEqual(html.count('preload="none"'), videos)
        for project in featured:
            media = project.get("media")
            if media and media["kind"] == "video":
                size = (PROJECT_ROOT / "static" / media["src"]).stat().st_size
                self.assertLess(size, 1_000_000)
                self.assertTrue((PROJECT_ROOT / "static" / media["poster"]).is_file())

    def test_contact_assembly_is_scoped_and_credited(self) -> None:
        html = self.client.get("/projects").get_data(as_text=True)
        for marker in (
            "https://github.com/kalebcoleman/contact-assembly-lab", "docs/STRUCTURES.md", "FAILURES.md",
            "21 complete in simulation", "no real-robot trials have been run", "not evidence of robustness",
            "Intelligent Control Lab",
        ):
            self.assertIn(marker, html)

    def test_g1_project_uses_the_published_evaluation(self) -> None:
        html = self.client.get("/projects").get_data(as_text=True)
        for marker in (
            "https://github.com/kalebcoleman/g1-locomotion-lab", "237 of 256", "231 and 233",
            "one policy from one training seed", "not a new algorithm of mine",
        ):
            self.assertIn(marker, html)
        # The older 16-episode twinsmith walking figures are gone.
        self.assertNotIn("16 episodes", html)
        self.assertNotIn("39% of episodes", html)

    def test_claims_stay_scoped(self) -> None:
        text = " ".join(self.client.get(r).get_data(as_text=True) for r in ("/home", "/projects", "/experience", "/skills"))
        self.assertNotIn("Researcher, RISE Lab", text)
        self.assertNotIn("self-calibrating", text.lower())
        # "Digital twin" is the positioning, so it must stay scoped to simulation.
        self.assertIn("digital twin", text.lower())
        self.assertIn("not yet calibrated against hardware", text)
        self.assertIn("Everything here runs in simulation", text)
        self.assertIn("not a finished robot or a proven controller", text)
        self.assertIn("separately record a simulated", text)
        self.assertNotIn("use a Create 3, not this TurtleBot", text)
        self.assertIn("Nav2 navigates the simulated robot to a goal", text)
        self.assertIn("measured accuracy or repeated", text)
        # The TurtleBot3 card no longer says navigation or localization is not shown.
        self.assertNotIn("closed-loop Nav2 navigation", text)
        self.assertNotIn("SUCCEEDED", text)
        self.assertNotIn("PCA", text)
        self.assertNotIn("20 ms", text)

    def test_brick_framing_is_de_emphasized(self) -> None:
        for route in ("/home", "/projects", "/skills", "/experience", "/contact"):
            text = self.client.get(route).get_data(as_text=True).lower()
            with self.subTest(route=route):
                self.assertNotIn("lego", text)
                self.assertNotIn("brick stacking", text)
        # On the home page the only remaining mention is the BrickSim credit.
        self.assertNotIn("brick", self.client.get("/home").get_data(as_text=True).lower().replace("bricksim", ""))

    def test_private_team_repository_is_not_exposed(self) -> None:
        text = self.client.get("/projects").get_data(as_text=True)
        self.assertNotIn("ClearCastLLC", text)
        self.assertNotIn("PrescribedTimeDroneController", text)

    def test_twinsmith_project_and_status_labels(self) -> None:
        html = self.client.get("/projects").get_data(as_text=True)
        self.assertIn("https://github.com/kalebcoleman/twinsmith", html)
        self.assertIn("31 listed tools", html)
        self.assertIn("15,178", html)
        self.assertIn("28,450", html)
        self.assertNotIn("129 tools", html)
        self.assertIsNone(OLD_PROJECT_NAME.search(html))
        for label in STATUS_LABELS.values():
            self.assertIn(label, html)
        for project in PROJECTS:
            if project["slug"] in ("g1-locomotion-lab", "contact-assembly-lab", "twinsmith", "quadrotor-control"):
                self.assertEqual(set(project["status"]), {"simulated", "developing", "planned"})
        for route in ("/home", "/projects", "/skills", "/experience", "/contact"):
            page = self.client.get(route).get_data(as_text=True)
            with self.subTest(route=route):
                self.assertIsNone(OLD_PROJECT_NAME.search(page))
                self.assertNotIn("129 tools", page)

    def test_seo_description_reflects_current_work(self) -> None:
        html = self.client.get("/home").get_data(as_text=True)
        self.assertIn(f'<meta name="description" content="{PROFILE["site_description"]}">', html)
        self.assertIn("UR5e", PROFILE["site_description"])
        self.assertIn("digital twins", PROFILE["site_description"])
        self.assertLessEqual(len(PROFILE["site_description"]), 170)

    def test_private_repositories_are_not_linked(self) -> None:
        private = (
            "ur5e-digital-twin", "rise-ur5e-twin", "bricksim-learning", "jenga-rl", "jenga-ur5e-twin", "urdf-reaching",
            "semiconductor-amr-demo", "g1-recovery", "drone-controller-validation", "PrescribedTimeDroneController",
            "BrickSim", "rise-two-arm-research", "unsupervised-machine-learning", "malware-analysis", "deep-learning-projects", "neovim-config",
            "nba-outcome-predictor", "free-builder", "free-builder-site", "portfolio",
        )
        for route in ("/home", "/projects", "/skills", "/experience", "/contact"):
            html = self.client.get(route).get_data(as_text=True)
            for name in private:
                with self.subTest(route=route, repo=name):
                    self.assertNotIn(f"github.com/kalebcoleman/{name}", html)
            with self.subTest(route=route, link="old /portfolio/ path"):
                self.assertNotIn("kalebcoleman.github.io/portfolio", html)
            with self.subTest(route=route, removed="two-arm test"):
                self.assertNotIn("rise-two-arm-research", html)
                self.assertNotIn("two-arm", html.lower())
                self.assertNotIn("shared-bar", html.lower())

    def test_x_profile_is_linked(self) -> None:
        for route in ("/home", "/contact"):
            with self.subTest(route=route):
                self.assertIn("https://x.com/kalebcoIeman", self.client.get(route).get_data(as_text=True))

    def test_every_project_entry_is_complete(self) -> None:
        for project in PROJECTS:
            with self.subTest(project=project.get("slug")):
                for key in ("slug", "name", "repo_name", "summary", "stack"):
                    self.assertTrue(project.get(key), key)
                for link in project.get("links", []):
                    self.assertTrue(link.get("label"))
                    self.assertTrue(bool(link.get("url")) != bool(link.get("file")))
                    if link.get("file"):
                        self.assertTrue((PROJECT_ROOT / "static" / link["file"]).is_file())
        for slug in self._layout_slugs():
            project = next(p for p in PROJECTS if p["slug"] == slug)
            self.assertTrue(project.get("tagline"), slug)
            self.assertTrue(project.get("badge"), slug)

    def test_capstone_is_data_driven(self) -> None:
        capstone = next(p for p in PROJECTS if p["slug"] == "nau-capstone")
        self.assertEqual(capstone["layout"], "feature")
        html = self.client.get("/projects").get_data(as_text=True)
        self.assertIn('id="nau-capstone"', html)
        self.assertIn(capstone["name"], html)
        self.assertNotIn("nau-capstone", (PROJECT_ROOT / "templates" / "projects.html").read_text(encoding="utf-8"))

    def test_static_export_serves_from_root_and_redirects_old_portfolio_paths(self) -> None:
        import tempfile
        import build_static

        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp)
            build_static.build(out, "/")
            home = (out / "index.html").read_text(encoding="utf-8")
            self.assertIn('href="/static/css/base.css', home)
            self.assertIn('href="/projects/"', home)
            self.assertNotIn("/portfolio/", home)
            for page in ("", "home/", "projects/", "skills/", "experience/", "contact/", "resume/"):
                with self.subTest(legacy=page):
                    redirect = (out / "portfolio" / page / "index.html").read_text(encoding="utf-8")
                    self.assertIn("http-equiv=\"refresh\"", redirect)
                    self.assertNotIn("url=/portfolio", redirect)
            self.assertIn('url=/projects/"', (out / "portfolio" / "projects" / "index.html").read_text(encoding="utf-8"))
            self.assertIn("/portfolio", (out / "404.html").read_text(encoding="utf-8"))
            self.assertTrue((out / "static" / "resume.pdf").is_file())
            self.assertEqual((out / "favicon.ico").read_bytes(), (PROJECT_ROOT / "static" / "favicon.ico").read_bytes())
            for name in build_static.LEGACY_FILES:
                self.assertTrue((out / "portfolio" / "static" / name).is_file())

    ROUTES = ("/home", "/projects", "/skills", "/experience", "/contact")

    def test_phone_number_is_not_published(self) -> None:
        self.assertNotIn("phone", PROFILE)
        for route in self.ROUTES:
            html = self.client.get(route).get_data(as_text=True)
            with self.subTest(route=route):
                for needle in ("480-359", "4803598122", "tel:", "Phone"):
                    self.assertNotIn(needle, html)

    def test_recruiter_audit_trims(self) -> None:
        pages = {route: self.client.get(route).get_data(as_text=True) for route in self.ROUTES}
        everything = " ".join(pages.values())
        for gone in ("Halma", "GRAMMY", "Career Accelerator", "TypeScript", "JavaScript", "/ 2026", "System identification",
                     "Model predictive control</span>", ">MPC<", "extends the portfolio", "interlocking bricks"):
            with self.subTest(gone=gone):
                self.assertNotIn(gone, everything)
        self.assertNotIn("halma-ai", [project["slug"] for project in PROJECTS])
        self.assertIn("Energy-Aware Prescribed-Time Quadrotor Control", pages["/projects"])
        self.assertIn("NMPC baseline reproduction", pages["/projects"])
        self.assertIn("A course lab done with classmates", pages["/projects"])
        # Brick wording survives only in the BrickSim credit.
        for route, html in pages.items():
            with self.subTest(route=route):
                self.assertNotIn("brick", html.lower().replace("bricksim", ""))
                self.assertNotIn("lego", html.lower())

    def test_social_preview_and_favicon(self) -> None:
        self.assertEqual(set(PAGE_DESCRIPTIONS), {"home", "projects", "skills", "experience", "contact"})
        self.assertEqual(len(set(PAGE_DESCRIPTIONS.values())), 5)
        for route in self.ROUTES:
            html = self.client.get(route).get_data(as_text=True)
            description = PAGE_DESCRIPTIONS[route.strip("/")]
            with self.subTest(route=route):
                self.assertLessEqual(len(description), 170)
                self.assertIn(f'<meta name="description" content="{description}">', html)
                self.assertIn(f'<meta property="og:description" content="{description}">', html)
                self.assertIn('<meta property="og:image" content="https://kalebcoleman.github.io/static/images/og-card.jpg">', html)
                self.assertIn('<meta name="twitter:card" content="summary_large_image">', html)
                self.assertIn('<meta property="og:title" content="Kaleb Coleman | ', html)
                self.assertIn('rel="icon"', html)

    def test_favicon_files_exist(self) -> None:
        for name in ("favicon.ico", "favicon.svg", "apple-touch-icon.png", "images/og-card.jpg"):
            with self.subTest(file=name):
                self.assertTrue((PROJECT_ROOT / "static" / name).is_file())
        self.assertLess((PROJECT_ROOT / "static" / "images" / "og-card.jpg").stat().st_size, 300_000)
        response = self.client.get("/favicon.ico")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data[:4], b"\x00\x00\x01\x00")
        response.close()

    def test_resume_file_is_the_approved_version(self) -> None:
        # Pinned so the résumé only changes on purpose: update this hash when a new PDF is approved.
        import hashlib
        data = (PROJECT_ROOT / "static" / "resume.pdf").read_bytes()
        self.assertTrue(data.startswith(b"%PDF"))
        self.assertEqual(hashlib.sha256(data).hexdigest(), "418a78ffb560ef32190e8dd3f0d2d376f8e306b9d5f730f92a8df4b653319429")

    def test_resume_links_resolve_to_the_pdf(self) -> None:
        for route in ("/home", "/projects", "/skills", "/experience", "/contact"):
            with self.subTest(route=route):
                self.assertIn('href="/resume"', self.client.get(route).get_data(as_text=True))
        import re
        pdf = (PROJECT_ROOT / "static" / "resume.pdf").read_bytes()
        links = {m.decode("latin-1") for m in re.findall(rb"/URI\s*\(([^)]*)\)", pdf)}
        slugs = {project["slug"] for project in PROJECTS}
        for link in links:
            with self.subTest(link=link):
                self.assertNotIn("/portfolio", link)
                self.assertNotIn("rise-two-arm-research", link)
                self.assertNotIn("BrickSim", link)
                if "/projects/#" in link:
                    self.assertIn(link.split("#", 1)[1], slugs)

if __name__ == "__main__":
    unittest.main()
