import sys
import unittest
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from app import PROJECTS, SKILLS, app  # noqa: E402


class PortfolioRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        app.config.update(TESTING=True)
        self.client = app.test_client()

    def test_primary_routes_render(self) -> None:
        route_markers = {
            "/home": b"Selected technical projects",
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


if __name__ == "__main__":
    unittest.main()
