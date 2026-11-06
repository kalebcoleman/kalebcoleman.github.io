import sys
from html import escape
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import app as portfolio  # noqa: E402
from app import HOME_LAYOUT, PROFILE, PROJECTS, SKILLS, STATUS_LABELS, app, home_sections  # noqa: E402


class PortfolioRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_primary_routes_render(self) -> None:
        route_markers = {
            "/home": b"What I have built and run",
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
            for ref in filter(None, [project.get("image"), project.get("media"), *(project.get("gallery") or [])]):
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
            self.assertIn(project["media"]["src"], card)

    def test_home_leads_with_demonstrated_robotics_and_keeps_older_work_below(self) -> None:
        home = self.client.get("/home").get_data(as_text=True)
        for marker in ("UR5e Brick Stacking in Simulation", "Isaac MCP", "Two-Arm UR5e Shared-Bar", "Jenga", "DataFest", "NBA Win Modeling"):
            self.assertIn(marker, home)
        self.assertLess(home.index("UR5e Brick Stacking"), home.index("Two-Arm UR5e Shared-Bar"))
        self.assertLess(home.index("Two-Arm UR5e Shared-Bar"), home.index("DataFest"))
        for older in ("Halma Game AI", "AI Multitool", "NAU Course Catalog Scraper", "NBA Shot Data Engineering Package"):
            self.assertNotIn(older, home)
            self.assertIn(older, self.client.get("/projects").get_data(as_text=True))

    def test_video_media_is_accessible_and_light(self) -> None:
        html = self.client.get("/home").get_data(as_text=True)
        self.assertNotIn("autoplay", html)
        self.assertEqual(html.count("<video controls"), 2)
        self.assertEqual(html.count('preload="none"'), 2)
        for project in home_sections()["secondary"] + [home_sections()["lead"]]:
            media = project["media"]
            if media["kind"] == "video":
                size = (PROJECT_ROOT / "static" / media["src"]).stat().st_size
                self.assertLess(size, 1_000_000)
                self.assertTrue((PROJECT_ROOT / "static" / media["poster"]).is_file())

    def test_brick_demo_is_scoped_and_credited(self) -> None:
        html = self.client.get("/projects").get_data(as_text=True)
        for marker in (
            "ur5e-stack-four.md", "ur5e-stack-four-room.mp4", "experiments/ur5e_lego",
            "not a measured success rate", "does not show physical assembly", "not MPC or reinforcement learning",
            "Intelligent Control Lab",
        ):
            self.assertIn(marker, html)

    def test_claims_stay_scoped(self) -> None:
        text = " ".join(self.client.get(r).get_data(as_text=True) for r in ("/home", "/projects", "/experience", "/skills"))
        self.assertNotIn("Researcher, RISE Lab", text)
        self.assertNotIn("digital twin", text.lower())
        self.assertNotIn("self-calibrating", text.lower())
        self.assertIn("not a controlled benchmark", text)
        self.assertIn("not a finished robot or a proven controller", text)
        self.assertIn("use a Create 3, not this TurtleBot", text)
        self.assertIn("PCA results are placeholders", text)
        self.assertNotIn("20 ms", text)

    def test_private_team_repository_is_not_exposed(self) -> None:
        text = self.client.get("/projects").get_data(as_text=True)
        self.assertNotIn("ClearCastLLC", text)
        self.assertNotIn("PrescribedTimeDroneController", text)

    def test_isaac_mcp_project_and_status_labels(self) -> None:
        html = self.client.get("/projects").get_data(as_text=True)
        self.assertIn("https://github.com/kalebcoleman/isaac-mcp", html)
        self.assertIn("https://github.com/kalebcoleman/isaac-mcp#train-a-humanoid-to-walk", html)
        for label in STATUS_LABELS.values():
            self.assertIn(label, html)
        for project in PROJECTS:
            if project["slug"] in ("ur5e-brick-stacking", "isaac-mcp", "two-arm-manipulation", "quadrotor-control"):
                self.assertEqual(set(project["status"]), {"simulated", "developing", "planned"})

    def test_seo_description_reflects_current_work(self) -> None:
        html = self.client.get("/home").get_data(as_text=True)
        self.assertIn(f'<meta name="description" content="{PROFILE["site_description"]}">', html)
        self.assertIn("UR5e", PROFILE["site_description"])
        self.assertLessEqual(len(PROFILE["site_description"]), 170)

    def test_private_repositories_are_not_linked(self) -> None:
        private = ("ur5e-digital-twin", "rise-ur5e-twin", "bricksim-learning", "jenga-rl", "urdf-reaching", "semiconductor-amr-demo")
        for route in ("/home", "/projects", "/skills", "/experience", "/contact"):
            html = self.client.get(route).get_data(as_text=True)
            for name in private:
                with self.subTest(route=route, repo=name):
                    self.assertNotIn(f"github.com/kalebcoleman/{name}", html)

    def test_resume_file_is_unchanged(self) -> None:
        import hashlib
        digest = hashlib.sha256((PROJECT_ROOT / "static" / "resume.pdf").read_bytes()).hexdigest()
        self.assertEqual(digest, "0cb5a951adeb4ee3e7454c302b774aba3868c489623e01e6e5e0f6527a993702")


if __name__ == "__main__":
    unittest.main()
