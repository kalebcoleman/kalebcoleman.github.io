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

# Home page: newest robotics work gets full-width spotlights (media beside text);
# the featured grid below keeps the lab tooling and ongoing research easy to find.
# Both lists are explicit slugs in display order. Media lives on each project, so
# reordering never pairs a project with the wrong image or video.
SPOTLIGHT_SLUGS: list[str] = [
    "g1-humanoid-walking",
    "two-arm-manipulation",
    "turtlebot3-ros2-lidar",
]
FEATURED_SLUGS: list[str] = [
    "isaac-mcp",
    "ur5e-digital-twin",
    "quadrotor-control",
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
        "slug": "g1-humanoid-walking",
        "name": "Unitree G1 Walking Policy Training in Isaac Lab",
        "repo_name": "isaac-mcp · Isaac Lab workflow",
        "repo_url": "https://github.com/kalebcoleman/isaac-mcp#train-a-humanoid-to-walk",
        "summary": "I used and extended my Isaac MCP workflow to run Isaac Lab's existing G1 flat-ground walking task: train, score, and watch a policy from an agent session, entirely in simulation.",
        "stack": ["Isaac Lab", "Isaac Sim", "rsl_rl", "Isaac MCP"],
        "highlights": [
            "Task: Isaac Lab's built-in Isaac-Velocity-Flat-G1-v0 with NVIDIA's G1 model, 1,024 parallel environments, trained with rsl_rl. The locomotion task and learning algorithm are existing Isaac Lab components, not my own.",
            "Two training runs through isaaclab__train: 300 iterations (152 s) and 1,500 iterations (727 s). Speed-tracking reward rose from 0.37 to 0.91 and training episodes ended by a fall dropped from 39% to 1.4%.",
            "Scored with isaaclab__eval: 16 episodes each, all lasting the full 1,000 steps (mean return 13.3 versus 34.4).",
            "The tools were called directly by Claude Sonnet 5.5 and the exact calls are recorded in the repository. These are single runs with different seeds, not averages.",
        ],
        "status": {
            "simulated": "Both runs trained, evaluated, and played back in Isaac Sim on flat ground.",
            "planned": "Training a user's own robot through the tools is on the Isaac MCP checklist and is not supported yet.",
        },
        "limits": "Not shown: hardware deployment, rough terrain, or a new locomotion algorithm.",
        "credits": "Isaac Lab task and G1 model from NVIDIA; walking run recorded in the Isaac MCP README.",
        "image": {"file": "images/g1-walk-poster.jpg", "alt": "Unitree G1 humanoids walking on a grid floor during Isaac Lab training", "url": "https://github.com/kalebcoleman/isaac-mcp#train-a-humanoid-to-walk"},
        "spotlight": {
            "label": "Humanoid locomotion · Isaac Lab",
            "title": "Training a Unitree G1 to walk in simulation",
            "media": {"kind": "video", "src": "media/g1-walk-1500it.mp4", "poster": "images/g1-walk-poster.jpg", "width": 420, "height": 364,
                      "alt": "Six Unitree G1 humanoids walking on a grid floor after 1,500 Isaac Lab training iterations",
                      "caption": "Six-second clip from the 1,500-iteration run in Isaac Sim (from the Isaac MCP README). The arrows are the speed commands each robot follows."},
        },
        "placeholder": "G1<br>WALKING",
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
            "developing": "A higher-fidelity Jenga digital twin, and a repeatable baseline for changing one controller or task variable at a time.",
            "planned": "Real-hardware operation. Contact and actuator parameters are still uncalibrated.",
        },
        "credits": "Builds on BrickSim (Intelligent Control Lab), Aldrin Inbaraj's isaac-sim-mcp, and lab-supplied robot and Vention assets. My additions are listed in the repository's provenance notes.",
        "image": {"file": "images/two-arm-simulation.png", "alt": "Two UR5e arms holding a shared bar over a workstation in Isaac Sim", "url": "https://github.com/kalebcoleman/rise-two-arm-research"},
        "limits": "Brick assembly here is BrickSim's own demo, used as the installation baseline. The UR5e work above manipulates a shared bar, not bricks. A higher-fidelity Jenga twin is ongoing and not shown.",
        "spotlight": {
            "label": "BrickSim · UR5e workcell",
            "title": "A simulated UR5e workcell on BrickSim",
            "media": {"kind": "image", "src": "images/bricksim-ur5e-workcell.jpg", "width": 960, "height": 720,
                      "alt": "Two UR5e arms with RG2 grippers lifting a shared wooden bar on a Vention workstation in a simulated room",
                      "caption": "Two UR5e arms and RG2 grippers lifting a shared bar in the simulated workcell (rise-two-arm-research).",
                      "second": {"src": "images/two-arm-load-speed-map.png", "width": 1100, "height": 794,
                                 "alt": "Grid of 20 simulated trials showing pass, drift, track, or drop outcomes for bar masses from 0.1 to 2 kilograms at speed scales from 1 to 8 times",
                                 "caption": "Observed load and speed outcomes across 20 simulated trials. Tested brackets in this model, not RG2 ratings."}},
        },
    },
    {
        "slug": "turtlebot3-ros2-lidar",
        "name": "TurtleBot3 ROS 2 Sensing in Isaac Sim",
        "repo_name": "ASU RAS 545 · Lab 3",
        "repo_url": None,
        "summary": "A simulated TurtleBot3 Burger in Isaac Sim publishing sensor data over ROS 2, built with Isaac MCP and checked in RViz. Course lab work on a course-supplied robot scene.",
        "stack": ["ROS 2 Humble", "Isaac Sim", "2D LiDAR", "RViz", "TF"],
        "highlights": [
            "Built Action Graphs for ROS 2 clock, differential-drive commands, 2D LiDAR, camera, and odometry/TF on the TurtleBot3 Burger.",
            "RViz receives the simulated /scan LiDAR, /camera/image_raw, /odom, and TF displays alongside the Isaac Sim stage.",
            "A 0.05 m/pixel occupancy-map file and a localization checkpoint scene were also saved.",
        ],
        "status": {
            "simulated": "LiDAR, camera, odometry, and TF visualization in RViz from the simulated robot.",
        },
        "limits": "Not shown: a physical TurtleBot, closed-loop Nav2 navigation, or a verified mapping or localization result.",
        "credits": "The TurtleBot3 scene was supplied by the course handout; the graphs and checks are my lab work.",
        "image": {"file": "images/turtlebot3-isaac-ros2-rviz.jpg", "alt": "Isaac Sim viewport with a TurtleBot3 Burger beside RViz showing its LiDAR scan, camera image, and TF display", "endpoint": "projects", "anchor": "turtlebot3-ros2-lidar"},
        "spotlight": {
            "label": "ROS 2 · LiDAR · TurtleBot3",
            "title": "TurtleBot3 LiDAR and camera streaming into ROS 2",
            "media": {"kind": "image", "src": "images/turtlebot3-isaac-ros2-rviz.jpg", "width": 1600, "height": 644,
                      "alt": "Isaac Sim viewport with a TurtleBot3 Burger and its stage tree on the left, and RViz on the right showing its red LiDAR scan lines, camera image, and TF frames",
                      "caption": "Frame from my Lab 3 screen recording: the simulated TurtleBot3 Burger (left) and RViz displaying its /scan, /camera/image_raw, /odom, and TF topics (right)."},
        },
        "placeholder": "TURTLEBOT3<br>LIDAR + ROS 2",
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


def projects_by_slugs(slugs: list[str]) -> list[dict[str, Any]]:
    by_slug = {project["slug"]: project for project in PROJECTS}
    return [by_slug[slug] for slug in slugs]


def featured_projects(slugs: list[str] | None = None) -> list[dict[str, Any]]:
    """Return the deliberately featured projects, in FEATURED_SLUGS order."""
    return projects_by_slugs(FEATURED_SLUGS if slugs is None else slugs)


def spotlight_projects(slugs: list[str] | None = None) -> list[dict[str, Any]]:
    """Return the home-page spotlight projects, in SPOTLIGHT_SLUGS order."""
    return projects_by_slugs(SPOTLIGHT_SLUGS if slugs is None else slugs)


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
            spotlight_projects=spotlight_projects(),
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
