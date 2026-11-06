from __future__ import annotations

from typing import Any

from flask import Flask, redirect, render_template, url_for

app = Flask(__name__)

PROFILE: dict[str, str] = {
    "name": "Kaleb Coleman",
    "email": "kaleb.a.coleman@gmail.com",
    "phone": "480-359-8122",
    "headline": "Robot manipulation, control, and learning in simulation",
    "intro": (
        "I am an M.S. AI Engineering (Robotics) student at ASU and a researcher in the RISE Lab. "
        "I build and test manipulation and control systems in NVIDIA Isaac Sim, and I came to robotics through data science and machine learning."
    ),
    "direction": (
        "With Dr. Wenlong Zhang, I am exploring a Jenga-playing robot that could use approaches such as model predictive control or reinforcement learning. "
        "That is a research direction, not a finished robot or a proven controller. "
        "I am also interested in drones, LiDAR, robotic perception, simulation, and robot learning."
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
        "Kaleb Coleman: ASU robotics student building UR5e brick manipulation, Isaac Sim tooling, "
        "and robot learning demos in simulation, with a data science background."
    ),
}

RESUME_FILE = "resume.pdf"

# Status vocabulary for the per-project "scope" lists on the projects page. Keep
# the three kinds of claim separate: what runs in simulation today, what is being
# built, and what is only a direction or plan.
STATUS_LABELS: dict[str, str] = {
    "simulated": "Runs in simulation",
    "developing": "In development",
    "planned": "Direction / planned",
}

# Home page layout: explicit slugs in display order. Media lives on each project,
# so reordering never pairs a project with the wrong image or video.
HOME_LAYOUT: dict[str, Any] = {
    "lead": "ur5e-brick-stacking",
    "secondary": ["isaac-mcp", "two-arm-manipulation"],
    "more_robotics": ["quadrotor-control", "turtlebot3-ros2-lidar"],
    "data_science": ["datafest-2026", "nba-win-modeling"],
}

NAV_ITEMS: list[dict[str, Any]] = [
    {"label": "Home", "endpoint": "home"},
    {"label": "Projects", "endpoint": "projects"},
    {"label": "Skills", "endpoint": "skills"},
    {"label": "Experience", "endpoint": "experience"},
    {"label": "Contact", "endpoint": "contact"},
]

SKILLS: list[dict[str, Any]] = [
    {"name": "Robotics / Simulation", "summary": "Tools used in current simulation research and control experiments.", "items": ["NVIDIA Isaac Sim", "Isaac Lab", "MuJoCo", "UR5e / RG2", "USD and URDF assets", "Inverse kinematics", "Bimanual manipulation", "Model predictive control", "System identification", "Simulation validation", "ROS 2 TF", "MCP tool servers"], "evidence_label": "Explore robotics projects", "evidence_url": "/projects#research"},
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
        "slug": "ur5e-brick-stacking",
        "name": "UR5e Brick Stacking in Simulation",
        "repo_name": "BrickSim fork · experiments/ur5e_lego",
        "repo_url": "https://github.com/kalebcoleman/BrickSim/tree/main/experiments/ur5e_lego",
        "badge": "Runs in simulation",
        "tagline": "A UR5e with an RG2 gripper picks up four loose bricks and stacks them on a baseplate in Isaac Sim. In the recorded run, all four connections held, with lateral errors of 0.145 to 0.193 mm just before connecting.",
        "summary": "My experiments on top of the open-source BrickSim simulator: a UR5e with an RG2 gripper picks up four loose 2×4 bricks and stacks them on an anchored baseplate in Isaac Sim, building on my earlier single-brick, three-brick, and baseplate experiments.",
        "stack": ["Isaac Sim 5.1", "BrickSim", "UR5e / RG2", "Python"],
        "highlights": [
            "The red brick connects to the baseplate and the blue, green, and yellow bricks each connect to the one below. The controller measures the held brick and its support, corrects the XY target before pressing, and checks each connection after release and settling.",
            "On 2026-10-31, one recorded run in a fixed scene finished with all four direct connections intact. Lateral errors just before connection were 0.145, 0.187, 0.193, and 0.191 mm; vertical error was 1.53 to 1.92 mm.",
            "The three-brick stack was replayed after the controller change and its three connections also held.",
        ],
        "links": [
            {"label": "Four-brick write-up", "url": "https://github.com/kalebcoleman/BrickSim/blob/main/experiments/ur5e_lego/docs/ur5e-stack-four.md"},
            {"label": "Full recording", "url": "https://github.com/kalebcoleman/BrickSim/blob/main/experiments/ur5e_lego/docs/evidence/ur5e-stack-four-room.mp4"},
        ],
        "status": {
            "simulated": "A fixed-scene run using simulation ground-truth poses and BrickSim's simulated connection behavior.",
            "developing": "Broader test cases for the same setup.",
            "planned": "A Jenga-playing robot using MPC or reinforcement learning is a direction with Dr. Wenlong Zhang, not something this demonstration shows.",
        },
        "limits": "This is one fixed-scene simulation trial, not a measured success rate. It does not show physical assembly. Hardware would need measured poses and calibrated frames. The controller is a scripted pipeline, not MPC or reinforcement learning.",
        "credits": "BrickSim is the Intelligent Control Lab's simulator (upstream: intelligent-control-lab/BrickSim); the experiments in experiments/ur5e_lego are mine. The UR5e, RG2, and Vention workstation assets are lab-supplied, loaded through Aldrin Inbaraj's isaac-mcp asset resolver.",
        "image": {"file": "images/ur5e-brick-stack-result.jpg", "alt": "Isaac Sim viewport showing four stacked bricks (red, blue, green, yellow) on a baseplate on the lab workstation", "url": "https://github.com/kalebcoleman/BrickSim/blob/main/experiments/ur5e_lego/docs/ur5e-stack-four.md"},
        "media": {"kind": "video", "src": "media/ur5e-four-brick-stack.mp4", "poster": "images/ur5e-brick-stack-poster.jpg", "width": 856, "height": 454,
                  "alt": "Isaac Sim viewport: a UR5e arm with an RG2 gripper picks up four loose bricks one at a time and stacks them on a baseplate on a workstation",
                  "caption": "Recorded four-brick run in Isaac Sim (2 min 23 s, viewport cropped from the repository's recording)."},
    },
    {
        "slug": "isaac-mcp",
        "name": "Isaac MCP",
        "repo_name": "isaac-mcp · open source",
        "repo_url": "https://github.com/kalebcoleman/isaac-mcp",
        "badge": "Runs in simulation",
        "tagline": "An MCP server that lets AI agents build Isaac Sim scenes, drive robots, read sensors, and run Isaac Lab training. Demo: a Unitree G1 walking policy trained and evaluated through it.",
        "summary": "An MCP server that lets AI agents drive NVIDIA Isaac Sim and Isaac Lab: build scenes, load robots, read cameras and LiDAR, and run Isaac Lab train, evaluate, and play jobs. The walking demo uses Isaac Lab's existing G1 flat-ground task through these tools.",
        "stack": ["Python", "MCP", "Isaac Sim", "Isaac Lab", "ROS 2"],
        "highlights": [
            "Lists 126 tools by default, or 135 with optional groups, covering scene and asset authoring, joints and physics, cameras and LiDAR, ROS 2 TF, and Isaac Lab jobs.",
            "G1 walking demo: Isaac Lab's built-in Isaac-Velocity-Flat-G1-v0 task and NVIDIA's G1 model, run through the Isaac Lab tools with 1,024 environments and rsl_rl. The task and the training algorithm already existed; the work here is the tooling workflow around them.",
            "Two training runs: 300 iterations (152 s, reward 0.37, 39% of episodes ended by a fall) and 1,500 iterations (727 s, reward 0.91, 1.4%). Evaluation used 16 episodes each, all lasting the full 1,000 steps. These are single runs with different seeds, not a controlled benchmark.",
            "The tools were called directly by Claude Sonnet 5.5, and the exact calls are recorded in the repository.",
        ],
        "links": [{"label": "Walking demo write-up", "url": "https://github.com/kalebcoleman/isaac-mcp#train-a-humanoid-to-walk"}],
        "status": {
            "simulated": "Tools run against Isaac Sim 6.x builds; every demo is simulation only, on flat ground.",
            "developing": "Pre-release hardening and wider compatibility testing (Linux x86_64).",
            "planned": "Training a user's own robot through the tools is on the project checklist and is not supported yet.",
        },
        "limits": "Simulation only; no hardware deployment or rough-terrain test.",
        "credits": "Built on Aldrin Inbaraj's omni-kit-mcp and isaac-sim-mcp (MIT). The walking task and G1 model are NVIDIA's Isaac Lab.",
        "image": {"file": "images/g1-walk-poster.jpg", "alt": "Unitree G1 humanoids walking on a grid floor during Isaac Lab training", "url": "https://github.com/kalebcoleman/isaac-mcp#train-a-humanoid-to-walk"},
        "media": {"kind": "video", "src": "media/g1-walk-1500it.mp4", "poster": "images/g1-walk-poster.jpg", "width": 420, "height": 364,
                  "alt": "Six Unitree G1 humanoids walking on a grid floor after 1,500 Isaac Lab training iterations",
                  "caption": "G1 after 1,500 training iterations in Isaac Sim, from the Isaac MCP README."},
        "gallery": [{"file": "images/isaac-mcp-ur5e-target.jpg", "alt": "Isaac Sim window showing a UR5e arm and RG2 gripper at a target pose commanded through Isaac MCP", "caption": "A UR5e driven to a target and back through Isaac MCP (Isaac Sim 6.2, from the README)."}],
    },
    {
        "slug": "two-arm-manipulation",
        "name": "Two-Arm UR5e Shared-Bar Manipulation",
        "repo_name": "rise-two-arm-research",
        "repo_url": "https://github.com/kalebcoleman/rise-two-arm-research",
        "badge": "Runs in simulation",
        "tagline": "Two UR5e arms with RG2 grippers lift and move a shared bar in Isaac Sim, with no unexpected collisions and 0.135 mm maximum slip over a 26-second sequence.",
        "summary": "Simulation work in the RISE Lab coordinating two opposing UR5e arms and RG2 grippers around a shared 0.1 kg bar, with collision validation, joint-frame corrections, object-space goals, and per-arm inverse kinematics. It uses lab-supplied robot assets and BrickSim's Isaac Sim tooling.",
        "stack": ["Python", "Isaac Sim 5.1", "Inverse kinematics", "USD"],
        "highlights": [
            "The 26.07-second accepted sequence translates, yaws, pitches, returns, and moves the bar to a final pose. Four-finger contact held at every measured sample; the bar's maximum translation and rotation slip were 0.135 mm and 0.036 degrees; maximum tracking error was 2.02 mm.",
            "Load and speed tests found limits in this model only: at baseline speed a 1.25 kg bar passed and 1.5 kg exceeded the drift bound, and a 0.1 kg bar passed at 5x speed but exceeded the tracking bound at 6x. These are not payload ratings.",
        ],
        "links": [
            {"label": "Project page", "url": "https://kalebcoleman.github.io/rise-two-arm-research/"},
            {"label": "Validation results", "url": "https://github.com/kalebcoleman/rise-two-arm-research/blob/main/docs/VALIDATION.md"},
        ],
        "status": {
            "simulated": "Coordinated shared-bar motion passes its checks in Isaac Sim 5.1.",
            "developing": "A repeatable baseline for changing one controller or task variable at a time.",
            "planned": "Real-hardware operation. Contact and actuator parameters are uncalibrated.",
        },
        "limits": "This task moves a bar, not bricks. It is a simulation result with uncalibrated contact and actuator parameters; it is not a validated physical model.",
        "credits": "Builds on lab-supplied UR5e, RG2, and Vention assets, Aldrin Inbaraj's isaac-sim-mcp, and BrickSim (Intelligent Control Lab). My additions are listed in the repository's provenance notes.",
        "image": {"file": "images/two-arm-shared-bar.jpg", "alt": "Two UR5e arms with RG2 grippers lifting a shared wooden bar on a Vention workstation in a simulated room", "url": "https://github.com/kalebcoleman/rise-two-arm-research"},
        "media": {"kind": "image", "src": "images/two-arm-shared-bar.jpg", "width": 960, "height": 720,
                  "alt": "Two UR5e arms with RG2 grippers lifting a shared wooden bar on a Vention workstation in a simulated room",
                  "caption": "The shared-bar task in Isaac Sim."},
        "gallery": [{"file": "images/two-arm-load-speed-map.png", "alt": "Grid of 20 simulated trials showing pass, drift, track, or drop outcomes for bar masses from 0.1 to 2 kilograms at speed scales from 1 to 8 times", "caption": "Outcomes of 20 simulated load and speed trials."}],
    },
    {
        "slug": "jenga-direction",
        "name": "Jenga-Playing Robot (Research Direction)",
        "repo_name": "With Dr. Wenlong Zhang · RISE Lab",
        "repo_url": None,
        "badge": "Research direction",
        "tagline": "Where the brick work is heading: a robot that plays Jenga, possibly using model predictive control or reinforcement learning. Not built yet.",
        "summary": "A direction Dr. Wenlong Zhang and I are exploring: a Jenga-playing robot using approaches such as model predictive control or reinforcement learning, with the UR5e brick work as a starting point.",
        "stack": ["Manipulation", "MPC", "Reinforcement learning", "Simulation"],
        "highlights": ["Related interests: drones, LiDAR, robotic perception, simulation, and robot learning."],
        "status": {"planned": "Exploring approaches. There is no Jenga robot and no proven controller yet."},
        "credits": "Direction shared with Dr. Wenlong Zhang.",
        "image": None,
    },
    {
        "slug": "quadrotor-control",
        "name": "Prescribed-Time Quadrotor Control",
        "repo_name": "Team research · private repository",
        "repo_url": None,
        "badge": "Ongoing collaboration",
        "tagline": "Simulation research with John Lok on prescribed-time quadrotor control. John led the controller development; I reproduced an archived MuJoCo baseline and am working on timing and validation.",
        "summary": "Collaborative simulation research on prescribed-time quadrotor control using a MuJoCo test bench. John Lok did most of the controller development. My part: team organization and presentations, reproducing an archived MuJoCo baseline on a lab PC, and a timing and validation study that is still in progress.",
        "stack": ["MuJoCo", "Control", "System identification", "Simulation"],
        "highlights": ["Reproduced the archived MuJoCo baseline results on a lab PC, with matching telemetry and tracking tables.", "Timing and validation study: setup and an initial baseline are done; results are not yet available."],
        "status": {
            "simulated": "Controller comparisons run in MuJoCo; everything here is simulation.",
            "developing": "Timing and validation study; a paper draft.",
            "planned": "Physical calibration and any flight testing.",
        },
        "limits": "No hardware tests, no completed timing target, and no new controller are claimed.",
        "credits": "Joint work with John Lok, who led the controller development.",
        "image": None,
        "placeholder": "CONTROL<br>IN MOTION",
    },
    {
        "slug": "turtlebot3-ros2-lidar",
        "name": "TurtleBot3 ROS 2 Sensing in Isaac Sim",
        "repo_name": "ASU RAS 545 · Lab 3",
        "repo_url": None,
        "badge": "Lab coursework",
        "tagline": "A simulated TurtleBot3 publishing LiDAR, camera, odometry, and TF over ROS 2 to RViz, set up with Isaac MCP.",
        "summary": "Course lab work in Isaac Sim: Action Graphs for ROS 2 clock, drive commands, 2D LiDAR, camera, and odometry/TF on a TurtleBot3 Burger, checked in RViz.",
        "stack": ["ROS 2 Humble", "Isaac Sim", "2D LiDAR", "RViz", "TF"],
        "highlights": ["RViz shows the simulated /scan, /camera/image_raw, /odom, and TF alongside the Isaac Sim stage."],
        "status": {"simulated": "Sensor topics visualized in RViz from the simulated robot."},
        "limits": "Not shown: a physical TurtleBot, closed-loop Nav2 navigation, or a verified mapping or localization result. The public Nav2 goal examples in Isaac MCP use a Create 3, not this TurtleBot.",
        "credits": "The TurtleBot3 scene came from the course handout; the graphs and checks are my lab work.",
        "image": {"file": "images/turtlebot3-isaac-ros2-rviz.jpg", "alt": "Isaac Sim viewport with a TurtleBot3 Burger beside RViz showing its red LiDAR scan lines, camera image, and TF frames", "endpoint": "projects", "anchor": "turtlebot3-ros2-lidar"},
        "placeholder": "ROS 2<br>LIDAR",
    },
    {
        "slug": "datafest-2026",
        "name": "DataFest 2026: Early Signals of High Healthcare Utilization",
        "repo_name": "datafest-2026",
        "repo_url": "https://github.com/kalebcoleman/datafest-2026",
        "badge": "Team award",
        "tagline": "Team project that won Best Visualization at NAU's ASA DataFest 2026: patient-journey modeling and utilization concentration analysis.",
        "summary": "My team's DataFest 2026 work on patient-journey modeling, utilization concentration, and geography-based segmentation, awarded Best Visualization at NAU's ASA DataFest 2026 (including a one-year American Statistical Association membership).",
        "stack": ["Python", "scikit-learn", "Random forest", "Clustering"],
        "highlights": ["I built a reusable analysis package, data-prep and QA utilities, an enrichment pipeline, and a random-forest workflow predicting future high utilizers from early encounters.", "The challenge data and partner identity are not included in the repository."],
        "credits": "Team project; the award is the team's.",
        "image": {"file": "images/datafest-result.png", "alt": "DataFest presentation slide visualizing concentrated healthcare encounters and early-risk model results", "url": "https://github.com/kalebcoleman/datafest-2026"},
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
        "badge": "Data science",
        "tagline": "Predicts NBA home wins using only pre-tip-off information. The best model beat always picking the home team; its gain over Elo ratings alone is not statistically established.",
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
        "limits": "Work in progress: the repository's PCA results are placeholders, and the final PCA-versus-autoencoder comparison and conclusions are still pending.",
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
    {"title": "UR5e brick stacking", "summary": "Runs in simulation: my experiments on BrickSim in which a UR5e stacks four bricks in Isaac Sim, from a fixed scene using ground-truth poses. Not physical assembly."},
    {"title": "Two-arm UR5e manipulation", "summary": "Runs in simulation: coordinated shared-bar motion in Isaac Sim, with lab-supplied assets. Not validated on physical hardware."},
    {"title": "Isaac MCP", "summary": "Pre-release open-source MCP server for Isaac Sim and Isaac Lab, built on Aldrin Inbaraj's omni-kit-mcp and isaac-sim-mcp, with a G1 walking demo run through its Isaac Lab tools."},
    {"title": "Jenga-playing robot (direction)", "summary": "A research direction with Dr. Wenlong Zhang, possibly using model predictive control or reinforcement learning. It is not built, and no controller has been shown."},
    {"title": "Prescribed-time quadrotor control", "summary": "Collaborating with John Lok, who led the controller development, on simulation research in MuJoCo. I reproduced an archived baseline and am working on timing and validation."},
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
