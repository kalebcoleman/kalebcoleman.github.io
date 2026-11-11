from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml
from flask import Flask, redirect, render_template, send_from_directory, url_for

app = Flask(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"


def load_data(name: str) -> dict[str, Any]:
    """Read one YAML content file from data/."""
    with (DATA_DIR / name).open(encoding="utf-8") as handle:
        return yaml.safe_load(handle)


# Content lives in data/: projects.yaml holds every project and the home-page
# layout; site.yaml holds the profile, skills, experience, and education.
_SITE = load_data("site.yaml")
_PROJECT_DATA = load_data("projects.yaml")

PROFILE: dict[str, str] = _SITE["profile"]
SKILLS: list[dict[str, Any]] = _SITE["skills"]
EXPERIENCE: list[dict[str, str]] = _SITE["experience"]
RESEARCH_ITEMS: list[dict[str, str]] = _SITE["research_items"]
AWARDS: list[dict[str, str]] = _SITE["awards"]
EDUCATION: dict[str, str] = _SITE["education"]
PAGE_DESCRIPTIONS: dict[str, str] = _SITE["page_descriptions"]

PROJECTS: list[dict[str, Any]] = _PROJECT_DATA["projects"]

# Home page layout: explicit slugs in display order. Media lives on each project,
# so reordering never pairs a project with the wrong image or video.
HOME_LAYOUT: dict[str, Any] = _PROJECT_DATA["home_layout"]

RESUME_FILE = "resume.pdf"

# Status vocabulary for the per-project "scope" lists on the projects page. Keep
# the three kinds of claim separate: what runs in simulation today, what is being
# built, and what is only a direction or plan.
STATUS_LABELS: dict[str, str] = {
    "simulated": "Runs in simulation",
    "developing": "In development",
    "planned": "Direction / planned",
}

NAV_ITEMS: list[dict[str, Any]] = [
    {"label": "Home", "endpoint": "home"},
    {"label": "Projects", "endpoint": "projects"},
    {"label": "Skills", "endpoint": "skills"},
    {"label": "Experience", "endpoint": "experience"},
    {"label": "Contact", "endpoint": "contact"},
]

CONTACT_METHODS: list[dict[str, str]] = [
    {"label": "Email", "value": PROFILE["email"], "href": "mailto:" + PROFILE["email"], "note": "Research, engineering, and project conversations."},
    {"label": "LinkedIn", "value": "kalebacoleman", "href": PROFILE["linkedin_url"], "note": "Professional background and current updates."},
    {"label": "GitHub", "value": "kalebcoleman", "href": PROFILE["github_url"], "note": "Code, project repositories, and technical work."},
    {"label": "X", "value": PROFILE["x_handle"], "href": PROFILE["x_url"], "note": "Robotics and simulation updates."},
]


def projects_by_slugs(slugs: list[str]) -> list[dict[str, Any]]:
    by_slug = {project["slug"]: project for project in PROJECTS}
    return [by_slug[slug] for slug in slugs]


def home_sections(layout: dict[str, Any] | None = None) -> dict[str, Any]:
    """Resolve HOME_LAYOUT slugs into project dicts, preserving the listed order."""
    layout = HOME_LAYOUT if layout is None else layout
    return {
        "lead": projects_by_slugs([layout["lead"]])[0],
        "secondary": projects_by_slugs(layout["secondary"]),
        "more_robotics": projects_by_slugs(layout["more_robotics"]),
        "data_science": projects_by_slugs(layout["data_science"]),
    }


def build_context(*, page_title: str, active_page: str, **extra: Any) -> dict[str, Any]:
    context: dict[str, Any] = {
        "profile": PROFILE,
        "status_labels": STATUS_LABELS,
        "nav_items": NAV_ITEMS,
        "page_title": page_title,
        "page_description": PAGE_DESCRIPTIONS.get(active_page, PROFILE["site_description"]),
        "page_url": PROFILE["site_url"] + ("" if active_page == "home" else active_page + "/"),
        "og_image_url": PROFILE["site_url"] + "static/" + PROFILE["og_image"],
        "active_page": active_page,
    }
    context.update(extra)
    return context


@app.get("/")
def index() -> Any:
    return redirect(url_for("home"))


@app.get("/home")
def home() -> str:
    return render_template(
        "home.html",
        **build_context(
            page_title="Home",
            active_page="home",
            sections=home_sections(),
            skills=SKILLS,
        ),
    )


@app.get("/projects")
def projects() -> str:
    return render_template(
        "projects.html",
        **build_context(
            page_title="Projects",
            active_page="projects",
            projects=[project for project in PROJECTS if project.get("layout") != "feature"],
            feature_projects=[project for project in PROJECTS if project.get("layout") == "feature"],
        ),
    )


@app.get("/skills")
def skills() -> str:
    return render_template(
        "skills.html",
        **build_context(
            page_title="Skills",
            active_page="skills",
            skills=SKILLS,
        ),
    )


@app.get("/experience")
def experience() -> str:
    return render_template(
        "experience.html",
        **build_context(
            page_title="Experience",
            active_page="experience",
            experience_items=EXPERIENCE,
            research_items=RESEARCH_ITEMS,
            awards=AWARDS,
            education=EDUCATION,
        ),
    )


@app.get("/contact")
def contact() -> str:
    return render_template(
        "contact.html",
        **build_context(
            page_title="Contact",
            active_page="contact",
            contact_methods=CONTACT_METHODS,
        ),
    )


@app.get("/favicon.ico")
def favicon() -> Any:
    return send_from_directory(app.static_folder, "favicon.ico", mimetype="image/x-icon")


@app.get("/resume")
def resume() -> Any:
    return redirect(url_for("static", filename=RESUME_FILE))


@app.get("/1")
def legacy_page_one() -> Any:
    return redirect(url_for("home"))


@app.get("/2")
def legacy_page_two() -> Any:
    return redirect(url_for("projects"))


@app.get("/3")
def legacy_page_three() -> Any:
    return redirect(url_for("projects"))


@app.get("/4")
def legacy_page_four() -> Any:
    return redirect(url_for("experience"))


@app.get("/5")
def legacy_page_five() -> Any:
    return redirect(url_for("projects"))


if __name__ == "__main__":
    app.run(debug=True)
