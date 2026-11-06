import sys
from html import escape
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import app as portfolio  # noqa: E402
from app import FEATURED_SLUGS, PROFILE, PROJECTS, SKILLS, SPOTLIGHT_SLUGS, STATUS_LABELS, app, featured_projects, spotlight_projects  # noqa: E402


class PortfolioRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_primary_routes_render(self) -> None:
        route_markers = {
            "/home": b"Simulation, control, and sensing",
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
        self.assertIn(b"Image Reconstruction and Generative Modeling", projects_page.data)
        self.assertIn(b"AI Multitool Assistant", projects_page.data)
        self.assertNotIn(b"Build Notes Across Portfolio Projects", projects_page.data)

    def test_navigation_and_resume_action_present(self) -> None:
        home_page = self.client.get("/home")
        self.assertEqual(home_page.status_code, 200)
        self.assertIn(b"Primary navigation", home_page.data)
        self.assertIn(b"Resume", home_page.data)

    def test_featured_selection_is_deliberate_and_images_follow_projects(self) -> None:
        slugs = [project["slug"] for project in PROJECTS]
        self.assertEqual(len(slugs), len(set(slugs)))
        self.assertEqual([p["slug"] for p in featured_projects()], FEATURED_SLUGS)
        for project in PROJECTS:
            with self.subTest(project=project["slug"]):
                image = project["image"]
                if image:
                    self.assertTrue((PROJECT_ROOT / "static" / image["file"]).is_file())
                    self.assertTrue(image["alt"])
                elif project["slug"] in FEATURED_SLUGS:
                    self.assertTrue(project.get("placeholder"))
        # Reordering the featured list must keep each image attached to its project.
        reordered = featured_projects(list(reversed(FEATURED_SLUGS)))
        self.assertEqual([p["slug"] for p in reordered], list(reversed(FEATURED_SLUGS)))
        original_slugs = portfolio.FEATURED_SLUGS[:]
        portfolio.FEATURED_SLUGS[:] = list(reversed(original_slugs))
        try:
            html = self.client.get("/home").get_data(as_text=True)
        finally:
            portfolio.FEATURED_SLUGS[:] = original_slugs
        for project in featured_projects():
            if project["image"]:
                card = html.split(f"<h3>{project['name']}</h3>")[0].rsplit("<article", 1)[1]
                self.assertIn(project["image"]["file"], card)

    def test_home_shows_all_featured_projects(self) -> None:
        html = self.client.get("/home").get_data(as_text=True)
        self.assertEqual(html.count('class="project-card"'), len(FEATURED_SLUGS))
        self.assertIn("Isaac MCP", html)

    def test_isaac_mcp_project_and_status_labels(self) -> None:
        html = self.client.get("/projects").get_data(as_text=True)
        self.assertIn("https://github.com/kalebcoleman/isaac-mcp", html)
        for label in STATUS_LABELS.values():
            self.assertIn(label, html)
        for project in PROJECTS:
            if project["slug"] in ("ur5e-digital-twin", "isaac-mcp", "two-arm-manipulation", "quadrotor-control"):
                self.assertEqual(set(project["status"]), {"simulated", "developing", "planned"})

    def test_seo_description_reflects_current_work(self) -> None:
        html = self.client.get("/home").get_data(as_text=True)
        self.assertIn(f'<meta name="description" content="{PROFILE["site_description"]}">', html)
        self.assertIn("digital twin", PROFILE["site_description"])
        self.assertLessEqual(len(PROFILE["site_description"]), 170)

    def test_private_repositories_are_not_linked(self) -> None:
        private = ("ur5e-digital-twin", "rise-ur5e-twin", "bricksim-learning", "jenga-rl", "urdf-reaching", "semiconductor-amr-demo")
        for route in ("/home", "/projects", "/skills", "/experience", "/contact"):
            html = self.client.get(route).get_data(as_text=True)
            for name in private:
                with self.subTest(route=route, repo=name):
                    self.assertNotIn(f"github.com/kalebcoleman/{name}", html)

    def test_spotlight_media_exists_with_alt_text_and_stays_with_project(self) -> None:
        self.assertEqual([p["slug"] for p in spotlight_projects()], SPOTLIGHT_SLUGS)
        html = self.client.get("/home").get_data(as_text=True)
        for project in spotlight_projects():
            media = project["spotlight"]["media"]
            items = [media] + ([media["second"]] if media.get("second") else [])
            with self.subTest(project=project["slug"]):
                for item in items:
                    self.assertTrue((PROJECT_ROOT / "static" / item["src"]).is_file())
                    self.assertGreater(len(item["alt"]), 30)
                    self.assertIn(escape(item["alt"]), html)
                if media["kind"] == "video":
                    self.assertTrue((PROJECT_ROOT / "static" / media["poster"]).is_file())
                    self.assertIn("<video controls", html)
                    self.assertNotIn("autoplay", html)
                block = html.split(f'id="spotlight-{project["slug"]}"')[0].rsplit("<article", 1)[1]
                self.assertIn(media["src"], block)
        # Spotlight media stays small enough for quick loading.
        total = sum((PROJECT_ROOT / "static" / m["spotlight"]["media"]["src"]).stat().st_size for m in spotlight_projects())
        self.assertLess(total, 400_000)

    def test_home_leads_with_new_work_and_keeps_older_projects_on_projects_page(self) -> None:
        home = self.client.get("/home").get_data(as_text=True)
        for marker in ("Unitree G1", "TurtleBot3", "BrickSim", "Isaac MCP"):
            self.assertIn(marker, home)
        for older in ("Leakage-Aware NBA Win Modeling", "NBA Shot Data Engineering Package", "Halma Game AI"):
            self.assertNotIn(older, home)
            self.assertIn(older, self.client.get("/projects").get_data(as_text=True))

    def test_claims_stay_scoped(self) -> None:
        text = " ".join(self.client.get(r).get_data(as_text=True) for r in ("/home", "/projects", "/experience"))
        self.assertIn("not a new locomotion algorithm", text.replace("or a new locomotion algorithm", "not a new locomotion algorithm"))
        self.assertIn("closed-loop Nav2 navigation", text)
        self.assertNotIn("Researcher, RISE Lab", text)
        self.assertNotIn("autonomously navigat", text)

    def test_resume_file_is_unchanged(self) -> None:
        import hashlib
        digest = hashlib.sha256((PROJECT_ROOT / "static" / "resume.pdf").read_bytes()).hexdigest()
        self.assertEqual(digest, "0cb5a951adeb4ee3e7454c302b774aba3868c489623e01e6e5e0f6527a993702")


if __name__ == "__main__":
    unittest.main()
