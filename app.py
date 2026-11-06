from __future__ import annotations

from typing import Any

from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)

PROFILE: dict[str, str] = {
    "name": "Kaleb Coleman",
    "email": "kaleb.a.coleman@gmail.com",
    "phone": "480-359-8122",
    "headline": "Robotics, Digital Twins, and Simulation · M.S. AI Engineering (Robotics) at ASU",
    "intro": (
        "I am an M.S. AI Engineering (Robotics) student at ASU and a researcher in the RISE Lab. "
        "I build reproducible simulations for UR5e manipulation, digital twins, and quadrotor control, "
        "backed by a data science and machine learning background and security experience from an internship at Gila River Indian Community."
    ),
    "summary": (
        "Robotics, simulation, and control research, grounded in data science, machine learning, "
        "and enterprise security experience."
    ),
    "degree": "M.S. AI Engineering (Robotics), ASU",
    "minor": "Cybersecurity minor",
    "graduation": "Expected May 2028",
    "linkedin_url": "https://www.linkedin.com/in/kalebacoleman/",
    "github_url": "https://github.com/kalebcoleman",
    "site_description": (
        "Kaleb Coleman: ASU robotics student building a UR5e digital twin, Isaac Sim tooling, "
        "and quadrotor control simulations, with a data science background."
    ),
}

RESUME_FILE = "resume.pdf"

# Status vocabulary used on project cards and the home page. Keep these three
# kinds of claim separate: what runs in simulation today, what is being built,
# and what is only planned.
STATUS_LABELS: dict[str, str] = {
    "simulated": "Runs in simulation",
    "developing": "In development",
    "planned": "Planned",
}

HERO_FOCUS: list[dict[str, str]] = [
    {"status": "simulated", "text": "UR5e workstation, two-arm manipulation, and quadrotor control in simulation"},
    {"status": "developing", "text": "Self-calibrating UR5e digital twin and Isaac MCP tooling"},
    {"status": "planned", "text": "Physical calibration, controller transfer, and hardware validation"},
]

# Home-page featured projects: deliberate slugs, in display order. Images live on
# each project (see PROJECTS), so reordering this list never mismatches an image.
FEATURED_SLUGS: list[str] = [
    "ur5e-digital-twin",
    "isaac-mcp",
    "two-arm-manipulation",
    "quadrotor-control",
    "nba-shot-package",
    "image-reconstruction",
]

NAV_ITEMS: list[dict[str, Any]] = [
    {"label": "Home", "endpoint": "home"},
    {"label": "Projects", "endpoint": "projects"},
    {"label": "Skills", "endpoint": "skills"},
    {"label": "Experience", "endpoint": "experience"},
    {"label": "Contact", "endpoint": "contact"},
]

SKILLS: list[dict[str, Any]] = [
    {"name": "Robotics / Simulation", "summary": "Tools used in current simulation research, digital twin work, and control experiments.", "items": ["NVIDIA Isaac Sim", "Isaac Lab", "MuJoCo", "UR5e / RG2", "USD and URDF assets", "Inverse kinematics", "Bimanual manipulation", "Model predictive control", "System identification", "Simulation validation", "ROS 2 TF", "MCP tool servers"], "evidence_label": "Explore robotics projects", "evidence_url": "/projects#research"},
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
    {"name": "Cybersecurity", "summary": "Enterprise security experience supporting a tribal government environment.", "items": ["Endpoint security", "Network threat monitoring", "SaaS security", "Phishing defense", "Secure remote support"], "evidence_label": "View professional experience", "evidence_url": "/experience"},
]

PROJECTS: list[dict[str, Any]] = [
    {
        "slug": "ur5e-digital-twin",
        "name": "Self-Calibrating UR5e Digital Twin",
        "repo_name": "RISE Lab · research in progress",
        "repo_url": None,
        "links": [{"label": "UR5e twin tools in Isaac MCP", "url": "https://github.com/kalebcoleman/isaac-mcp/blob/main/docs/TOOLS-UR5E.md"}],
        "summary": "A single-arm UR5e and RG2 digital twin in Isaac Sim, with a long-term goal of using real robot data to improve the simulation and transfer manipulation controllers to hardware.",
        "stack": ["Isaac Sim", "UR5e", "System identification", "Sim-to-real"],
        "highlights": ["Verified the single-arm workstation scene in Isaac Sim 5.1, including the UR5e, RG2 gripper, and Vention workstation.", "Research direction: compare simulation predictions with real observations, recalibrate the twin, and investigate planning, model predictive control, and learned controllers."],
        "status": {
            "simulated": "Workstation scene and arm control run in Isaac Sim.",
            "developing": "Repeatable scripted manipulation and characterization of the simulated arm.",
            "planned": "Physical calibration, controller transfer, and real-robot validation. None of this has been done yet.",
        },
        "credits": "RISE Lab research. The robot, gripper, and workstation assets are lab-supplied, not authored by me.",
        "image": {"file": "images/ur5e-workstation.png", "alt": "Single UR5e robot and workstation in Isaac Sim", "endpoint": "projects", "anchor": "research"},
    },
    {
        "slug": "isaac-mcp",
        "name": "Isaac MCP",
        "repo_name": "isaac-mcp",
        "repo_url": "https://github.com/kalebcoleman/isaac-mcp",
        "summary": "An MCP server that lets AI agents drive NVIDIA Isaac Sim and Isaac Lab: build scenes, load robots, read cameras and LiDAR, and run Isaac Lab training jobs. It includes a tool group for the RISE UR5e digital twin.",
        "stack": ["Python", "MCP", "Isaac Sim", "Isaac Lab", "ROS 2"],
        "highlights": ["Lists 126 tools by default, or 135 with optional groups, covering scene and asset authoring, joints and physics, cameras and LiDAR, ROS 2 TF, and Isaac Lab train, evaluate, and play.", "README demos are real Isaac Sim captures, including a UR5e driven to a target and back and a G1 humanoid walking policy trained in Isaac Lab. Each is a single run, and the README records how it was produced.", "Pre-release for Linux x86_64. Results are recorded per Isaac Sim build rather than certified across all versions."],
        "status": {
            "simulated": "Tools run against Isaac Sim 6.x builds; every demo is simulation only.",
            "developing": "Pre-release hardening and wider compatibility testing.",
            "planned": "Training a user's own robot through the tools is on the project checklist and is not supported yet.",
        },
        "credits": "Built on Aldrin Inbaraj's omni-kit-mcp and isaac-sim-mcp (MIT).",
        "image": {"file": "images/isaac-mcp-ur5e-target.jpg", "alt": "Isaac Sim window showing a UR5e arm and RG2 gripper at a target pose commanded through Isaac MCP", "url": "https://github.com/kalebcoleman/isaac-mcp"},
    },
    {
        "slug": "two-arm-manipulation",
        "name": "Two-Arm UR5e Manipulation in Isaac Sim",
        "repo_name": "rise-two-arm-research",
        "repo_url": "https://github.com/kalebcoleman/rise-two-arm-research",
        "links": [{"label": "Project page", "url": "https://kalebcoleman.github.io/rise-two-arm-research/"}, {"label": "BrickSim (upstream)", "url": "https://github.com/intelligent-control-lab/BrickSim"}],
        "summary": "RISE Lab simulation work coordinating two opposing UR5e arms and RG2 grippers around a shared bar, built on the open-source BrickSim simulator and lab-supplied assets. It provided the foundation for the single-arm digital twin research.",
        "stack": ["Python", "Isaac Sim", "BrickSim", "Inverse kinematics", "USD"],
        "highlights": ["Added collision validation, joint-frame corrections, object-space goals, and per-arm inverse kinematics.", "A 26-second simulated sequence recorded four-finger contact at every measured sample, no unexpected collisions, and 0.135 mm maximum slip.", "Tested limits in this model only: at baseline speed a 1.25 kg bar passed and 1.5 kg exceeded the drift bound. These are not payload ratings."],
        "status": {
            "simulated": "Coordinated bar motion runs and passes its checks in Isaac Sim 5.1.",
            "developing": "A repeatable baseline for changing one controller or task variable at a time.",
            "planned": "Real-hardware operation. Contact and actuator parameters are still uncalibrated.",
        },
        "credits": "Builds on BrickSim (Intelligent Control Lab), Aldrin Inbaraj's isaac-sim-mcp, and lab-supplied robot and Vention assets. My additions are listed in the repository's provenance notes.",
        "image": {"file": "images/two-arm-simulation.png", "alt": "Two UR5e arms holding a shared bar over a workstation in Isaac Sim", "url": "https://github.com/kalebcoleman/rise-two-arm-research"},
    },
    {
        "slug": "quadrotor-control",
        "name": "Energy-Aware Quadrotor Control",
        "repo_name": "Collaborative research · private repository",
        "repo_url": None,
        "summary": "Collaborative research with John Lok on prescribed-time quadrotor control using an S500-based MuJoCo test bench.",
        "stack": ["MuJoCo", "Control", "System identification", "Simulation"],
        "highlights": ["Built reproducible simulation comparisons and saved-output baselines for tracking, motor lag, and drag studies.", "Added solver timing diagnostics and contributed to a paper draft."],
        "status": {
            "simulated": "Controller comparisons run in the MuJoCo test bench; all results are simulation-based.",
            "developing": "Paper draft.",
            "planned": "Physical calibration and flight testing.",
        },
        "credits": "Joint work with John Lok.",
        "image": None,
        "placeholder": "CONTROL<br>IN MOTION",
    },
    {
        "slug": "nba-shot-package",
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
        "image": {"file": "images/nba_plots/nba-sdi-vs-actual-2014-2024.jpg", "alt": "NBA shot difficulty and scoring analysis", "endpoint": "projects"},
    },
    {
        "slug": "nba-win-modeling",
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
        "image": None,
        "placeholder": "NO LEAKAGE<br>BEFORE TIP-OFF",
    },
    {
        "slug": "nau-course-scraper",
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
        "image": None,
    },
    {
        "slug": "image-reconstruction",
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
        "image": None,
        "placeholder": "RECONSTRUCT<br>AND GENERATE",
    },
    {
        "slug": "halma-ai",
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
        "image": None,
    },
    {
        "slug": "ai-multitool-assistant",
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
        "image": None,
    },
]

EXPERIENCE: list[dict[str, str]] = [
    {"title": "Researcher, RISE Lab", "organization": "Arizona State University", "period": "2026 - Present", "summary": "Simulation research on UR5e manipulation and digital twins in Isaac Sim: two-arm coordination, a single-arm workstation twin, and Isaac MCP tooling that lets agents drive the simulator. Results so far are in simulation; hardware validation is planned."},
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
    {"title": "Self-calibrating UR5e digital twin", "summary": "In development: a single-arm UR5e twin in Isaac Sim toward a real-to-sim-to-real research loop. The workstation scene runs in simulation; physical calibration, controller transfer, and hardware validation are planned and not started."},
    {"title": "Two-arm UR5e manipulation", "summary": "Runs in simulation: coordinated two-arm bar motion in Isaac Sim, built on BrickSim and lab-supplied assets. Not validated on physical hardware."},
    {"title": "Isaac MCP", "summary": "Pre-release open-source MCP server for Isaac Sim and Isaac Lab, built on Aldrin Inbaraj's omni-kit-mcp and isaac-sim-mcp."},
    {"title": "Energy-aware prescribed-time quadrotor control", "summary": "Collaborating with John Lok on an S500-based MuJoCo test bench, studying tracking deadlines, motor lag, drag, wind estimation, and system identification. Results are simulation-based; a paper draft is in progress and hardware validation is planned."},
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


def featured_projects(slugs: list[str] | None = None) -> list[dict[str, Any]]:
    """Return the deliberately featured projects, in FEATURED_SLUGS order."""
    by_slug = {project["slug"]: project for project in PROJECTS}
    return [by_slug[slug] for slug in (FEATURED_SLUGS if slugs is None else slugs)]


def build_context(*, page_title: str, active_page: str, **extra: Any) -> dict[str, Any]:
    context: dict[str, Any] = {
        "profile": PROFILE,
        "status_labels": STATUS_LABELS,
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
            featured_projects=featured_projects(),
            skills=SKILLS,
            hero_focus=HERO_FOCUS,
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
