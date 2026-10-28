from __future__ import annotations

from typing import Any

from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)

PROFILE: dict[str, str] = {
    "name": "Kaleb Coleman",
    "email": "kaleb.a.coleman@gmail.com",
    "phone": "480-359-8122",
    "headline": "AI Engineering (Robotics) at ASU · Simulation, Control, and Machine Learning",
    "intro": (
        "I am an M.S. AI Engineering (Robotics) student at ASU, doing research with the RISE Lab. My work connects machine learning, deep learning, data "
        "engineering, robotics simulation, and control. I build "
        "reproducible technical projects that move from raw data collection through "
        "analysis, experimentation, and communication."
    ),
    "summary": (
        "My work is centered on applied ML, statistical modeling, autonomous decision systems, "
        "and technical research projects that are useful in both lab and industry settings."
    ),
    "degree": "M.S. AI Engineering (Robotics), ASU",
    "minor": "Cybersecurity minor",
    "graduation": "Expected May 2028",
    "linkedin_url": "https://www.linkedin.com/in/kalebacoleman/",
    "github_url": "https://github.com/kalebcoleman",
    "site_description": (
        "Kaleb Coleman portfolio featuring machine learning, AI, data science, and research-focused "
        "technical projects."
    ),
}

RESUME_FILE = "resume.pdf"

NAV_ITEMS: list[dict[str, Any]] = [
    {"label": "Home", "endpoint": "home"},
    {"label": "Projects", "endpoint": "projects"},
    {"label": "Skills", "endpoint": "skills"},
    {"label": "Experience", "endpoint": "experience"},
    {"label": "Contact", "endpoint": "contact"},
]

SKILLS: list[dict[str, Any]] = [
    {"name": "Cybersecurity", "summary": "Enterprise security experience supporting a tribal government environment.", "items": ["Endpoint security", "Network threat monitoring", "SaaS security", "Phishing defense", "Secure remote support"], "evidence_label": "View professional experience", "evidence_url": "/experience"},
    {"name": "Robotics / Control", "summary": "Tools used in current simulation research and control experiments.", "items": ["NVIDIA Isaac Sim", "MuJoCo", "USD scene authoring", "Inverse kinematics", "Bimanual manipulation", "Model predictive control", "System identification", "Simulation validation"], "evidence_label": "Explore robotics projects", "evidence_url": "/projects#research"},
    {
        "name": "Languages",
        "summary": "Core programming languages used across modeling, data pipelines, and application work.",
        "items": ["Python", "R", "SQL", "TypeScript", "JavaScript", "C", "HTML/CSS"],
    },
    {
        "name": "ML / AI",
        "evidence_label": "See image reconstruction", "evidence_url": "https://github.com/kalebcoleman/ImageReconstruction",
        "summary": "Modeling and experimentation tools for predictive analytics, deep learning, and generative work.",
        "items": [
            "PyTorch",
            "scikit-learn",
            "PyGAM",
            "CNNs",
            "RNNs",
            "Autoencoders",
            "Diffusion models",
            "Clustering",
            "Dimensionality reduction",
            "Feature engineering",
        ],
    },
    {
        "name": "Data / Databases",
        "evidence_label": "See sports data engineering", "evidence_url": "https://github.com/kalebcoleman/spatialSportsR",
        "summary": "Data collection, validation, storage, and reproducible analysis workflows.",
        "items": [
            "pandas",
            "NumPy",
            "SQLite",
            "PostgreSQL",
            "SQLAlchemy",
            "API ingestion",
            "Schema validation",
            "ETL pipelines",
            "CSV/report workflows",
            "R Markdown",
        ],
    },
    {
        "name": "Tools / Systems",
        "summary": "Workflow, deployment, and engineering tools used to ship and maintain projects.",
        "items": [
            "Flask",
            "Streamlit",
            "Git/GitHub",
            "Docker",
            "GitHub Actions",
            "Linux/CLI",
            "Selenium",
            "Tkinter",
            "Slurm/HPC workflows",
            "Testing and automation",
        ],
    },
]

PROJECTS: list[dict[str, Any]] = [
    {
        "name": "Two-Arm Manipulation in Isaac Sim",
        "repo_name": "rise-two-arm-research",
        "repo_url": "https://github.com/kalebcoleman/rise-two-arm-research",
        "summary": "RISE Lab research on two opposing UR5e arms with RG2 grippers manipulating a shared bar in NVIDIA Isaac Sim 5.1. Includes a reproducible motion demonstration and documented experimental evidence.",
        "stack": ["Python", "NVIDIA Isaac Sim", "USD", "Inverse kinematics"],
        "highlights": ["Added collision validation, joint-frame corrections, object-space goals, and per-arm inverse kinematics.", "The accepted 26-second simulation recorded four-finger contact at every measured sample, zero unexpected collisions, and maximum position tracking error of 2.02 mm.", "Documented load and speed experiments, failure cases, and reconstruction instructions. Physical calibration remains future work."],
        "featured": True,
    },
    {
        "name": "Energy-Aware Quadrotor Control",
        "repo_name": "Collaborative research · private repository",
        "repo_url": None,
        "summary": "Collaborative research with John Lok on prescribed-time quadrotor control using an S500-based MuJoCo test bench. Results are simulation-based; hardware flight validation remains future work.",
        "stack": ["MuJoCo", "Control", "System identification", "Simulation"],
        "highlights": ["Built reproducible simulation comparisons and saved-output baselines for tracking, motor lag, and drag studies.", "Added solver timing diagnostics and contributed to a paper draft; physical calibration and flight testing remain future work."],
        "featured": True,
    },
    {
        "name": "NBA Shot Data Engineering Package",
        "repo_name": "spatialSportsR",
        "repo_url": "https://github.com/kalebcoleman/spatialSportsR",
        "summary": (
            "End-to-end NBA shot analytics package combining R data infrastructure with Python "
            "modeling workflows. The project supports multi-source ingestion, rerunnable SQLite "
            "updates, shot-quality modeling, and player-level archetype analysis."
        ),
        "stack": ["R", "Python", "SQLite", "scikit-learn", "PyGAM", "Streamlit"],
        "highlights": [
            "Built a five-season training pipeline with roughly 1.1M historical shots and ~136K out-of-sample evaluation shots.",
            "Documented ~63% unseen-data xFG accuracy and delivered residual, SDI, and player archetype analysis outputs.",
            "Structured the repo as both an R package and analytics application with dashboard support.",
        ],
        "featured": True,
    },
    {
        "name": "Leakage-Aware NBA Win Modeling",
        "repo_name": "nba-modeling",
        "repo_url": "https://github.com/kalebcoleman/nba-modeling",
        "links": [
            {"label": "Project site", "url": "https://kalebcoleman.github.io/nba-modeling/"},
            {"label": "Paper (PDF)", "url": "https://kalebcoleman.github.io/nba-modeling/paper/paper.pdf"},
            {"label": "Data package", "url": "https://github.com/kalebcoleman/nba-data"},
        ],
        "summary": (
            "Predicts NBA home wins using only information available before tip-off, with time-ordered "
            "validation and a companion R package, nba-data, that collects and validates ESPN game data. "
            "A scheduled job logs predictions for the current season before each game and scores them afterward."
        ),
        "stack": ["R", "targets", "renv", "xgboost", "SQLite", "GitHub Actions"],
        "highlights": [
            "Tests check the features directly: changing one game's result changes no feature for that game or any earlier game.",
            "On the held-out 2025-26 season the best model picked 68.6% of games correctly, against 55.4% for always picking the home team. Elo ratings alone reach 67.9%, and the interval for the gain from adding rolling features includes zero.",
            "Corrected evaluation problems in an earlier course version, including cross-validation that mixed seasons and a threshold tuned on the test season, and documented each change.",
            "Live 2026-27 predictions are scored on the project site; with only a few games played, early accuracy is not yet a conclusion.",
        ],
        "featured": True,
    },
    {
        "name": "NAU Course Catalog Scraper",
        "repo_name": "nau-course-scraping",
        "repo_url": "https://github.com/kalebcoleman/nau-course-scraping",
        "summary": (
            "Automated course-catalog pipeline built in collaboration with NAU's Institute of Advanced "
            "Applications of Artificial Intelligence. It extracts course prefixes from PDF source data, "
            "scrapes catalog records with Selenium, and supports downstream AI and ethics analysis."
        ),
        "stack": ["Python", "Selenium", "pdfplumber", "pandas", "R Markdown"],
        "highlights": [
            "Scrapes term-level course records and exports structured CSV outputs for later analysis.",
            "Supports focused AI-course detection, broader recall analysis, and ethics-oriented reporting flows.",
            "Designed as a reproducible data collection and reporting workflow rather than a one-off scraper.",
        ],
        "featured": False,
    },
    {
        "name": "Image Reconstruction and Generative Modeling",
        "repo_name": "ImageReconstruction",
        "repo_url": "https://github.com/kalebcoleman/ImageReconstruction",
        "summary": (
            "Research-style image reconstruction training project for MNIST-family datasets, covering "
            "autoencoders, denoising autoencoders, variational autoencoders, and diffusion models. "
            "The training pipeline is built for reproducibility, Slurm workflows, and GPU-backed HPC execution."
        ),
        "stack": ["Python", "PyTorch", "Diffusion", "GPU training", "Slurm", "HPC workflows"],
        "highlights": [
            "Supports multiple model families from a single CLI with isolated outputs and saved run configuration.",
            "Includes Slurm-safe dataset handling, run isolation, and GPU-oriented experiment workflows for shared compute environments.",
            "Covers diffusion experiments, autoencoder baselines, and reproducible parameter sweeps for model comparison.",
        ],
        "featured": True,
    },
    {
        "name": "Halma Game AI",
        "repo_name": "halma-ai",
        "repo_url": "https://github.com/kalebcoleman/halma-ai",
        "summary": (
            "Turn-based game AI project that combines search, heuristics, and a local interface for "
            "interactive play and benchmarking. It is a clean example of autonomous decision-making "
            "logic implemented in a fully runnable system."
        ),
        "stack": ["Python", "Minimax", "Alpha-beta pruning", "Tkinter", "Search heuristics"],
        "highlights": [
            "Implements minimax with optional alpha-beta pruning, move ordering, and iterative deepening.",
            "Provides both a GUI surface and a headless arena for AI-vs-AI benchmarking.",
            "Supports multiple board sizes and configurable per-move search budgets.",
        ],
        "featured": True,
    },
    {
        "name": "AI Multitool Assistant",
        "repo_name": "ai-multitool-assistant",
        "repo_url": "https://github.com/kalebcoleman/ai-multitool-assistant",
        "summary": (
            "Full-stack AI application that combines chat, PDF question answering, notes, and real-time "
            "tool integrations in one authenticated workflow. It extends the portfolio beyond modeling "
            "into practical AI product engineering."
        ),
        "stack": ["Django REST", "React", "JWT", "Gemini", "LlamaIndex", "RAG"],
        "highlights": [
            "Connects a React frontend and Django backend around authenticated AI workflows and user-scoped data.",
            "Supports PDF indexing and question answering alongside real-time tools such as weather, stocks, and news.",
            "Shows end-to-end application design in addition to modeling-oriented repository work.",
        ],
        "featured": False,
    },
]

EXPERIENCE: list[dict[str, str]] = [
    {"title": "Information Systems Security Analyst Intern", "organization": "Gila River Indian Community", "period": "June 2026 - Present", "summary": "Support endpoint and mobile security, network threat monitoring, SaaS security, phishing defense, and secure remote troubleshooting. Work involves highly confidential information in a tribal government environment supporting government agency operations."},
    {
        "title": "Website Audience Analysis Project",
        "organization": "The Career Accelerator — The GRAMMYs Project",
        "period": "Training project, 2023",
        "summary": (
            "Worked on web audience analysis, exploratory data analysis, segmentation, and testing-oriented "
            "insights to support digital content decisions."
        ),
    },
    {
        "title": "Project Collaboration",
        "organization": "NAU Institute of Advanced Applications of Artificial Intelligence",
        "period": "Academic collaboration",
        "summary": (
            "Built a course-catalog scraping and analysis workflow used to examine AI and ethics-related "
            "curriculum coverage through reproducible data collection and reporting."
        ),
    },
]

RESEARCH_ITEMS = [
    {"title": "Two-arm manipulation in NVIDIA Isaac Sim", "summary": "RISE Lab simulation research with opposing UR5e arms and RG2 grippers holding a shared bar. Work includes collision validation, joint-frame corrections, inverse kinematics, and coordinated-motion experiments. The current model is a simulation; physical digital-twin calibration is ongoing."},
    {"title": "Energy-aware prescribed-time quadrotor control", "summary": "Collaborating with John Lok on an S500-based MuJoCo test bench, studying tracking deadlines, motor lag, drag, wind estimation, and system identification. Results are simulation-based; hardware validation remains future work."},
]
AWARDS = [{"title": "Best Visualization — NAU ASA DataFest 2026", "summary": "Built models, engineered features, and visualized early signals of high healthcare utilization with a team during the 48-hour competition. The award included a one-year American Statistical Association membership."}]
EDUCATION = {"school": "Arizona State University", "program": "M.S. Artificial Intelligence Engineering (Robotics)", "details": "Previously: B.S. Data Science, Cybersecurity minor, Northern Arizona University (May 2026)", "timeline": "Expected master's completion: May 2028"}

CONTACT_METHODS: list[dict[str, str]] = [
    {"label": "Email", "value": PROFILE["email"], "href": "mailto:" + PROFILE["email"], "note": "Research, engineering, and project conversations."},
    {"label": "Phone", "value": PROFILE["phone"], "href": "tel:+14803598122", "note": "Professional inquiries."},
    {
        "label": "LinkedIn",
        "value": "kalebacoleman",
        "href": PROFILE["linkedin_url"],
        "note": "Professional background and current updates.",
    },
    {
        "label": "GitHub",
        "value": "kalebcoleman",
        "href": PROFILE["github_url"],
        "note": "Code, project repositories, and technical work.",
    },
]


def featured_projects(limit: int = 3) -> list[dict[str, Any]]:
    return [project for project in PROJECTS if project["featured"]][:limit]


def build_context(*, page_title: str, active_page: str, **extra: Any) -> dict[str, Any]:
    context: dict[str, Any] = {
        "profile": PROFILE,
        "nav_items": NAV_ITEMS,
        "page_title": page_title,
        "page_description": PROFILE["site_description"],
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
            featured_projects=featured_projects(3),
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
            projects=PROJECTS,
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
