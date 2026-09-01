# RAILOPT AI — Intelligent Railway Maintenance Block Planning & Asset Availability Platform
**Smart India Hackathon (SIH) — National Rail Operations Optimization System**

> [!NOTE]
> **DEMONSTRATION ENVIRONMENT • SYNTHETIC DATA**
> This repository uses synthetically generated railway data for demonstration, optimization benchmark, and evaluation purposes. It does NOT connect to live railway signaling or classified operational infrastructure.
>
> **Demo credentials are for local development & demonstration only.** Never use these credentials in production environments.

---

## Final Project Statement
**RAILOPT AI is an AI-assisted railway maintenance block planning and optimization platform that integrates maintenance, asset, timetable and corridor information to identify coordinated maintenance opportunities, detect conflicts and generate optimized block plans.** 

It is a decision-support prototype. Human approval remains mandatory.

## Final Security & Safety Statement
> **This prototype does not control railway signalling, interlocking, traction, points, signals or other safety-critical railway infrastructure.**

---

## Technical Documentation Sitemap

- 🏗️ **[System Architecture](docs/SYSTEM_ARCHITECTURE.md)** — Core components, microservices, databases, WebSockets, and tech stack.
- 🔄 **[Data Flow Architecture](docs/DATA_FLOW.md)** — End-to-end data pipeline from legacy feeds to optimized block plans and simulation.
- 🧠 **[AI Architecture](docs/AI_ARCHITECTURE.md)** — Asset health risk scoring, MCDA task priority indexing, and explainability advisory engine.
- ⚙️ **[Optimization Engine](docs/OPTIMIZATION_ENGINE.md)** — Mathematical formulation of Google OR-Tools CP-SAT constraint programming solver.
- 🔌 **[Integration Architecture](docs/INTEGRATION_ARCHITECTURE.md)** — Subsystem adapters for legacy TMS, SMMS, TDMS, BDMS, and COA applications.
- 🕹️ **[Corridor Digital Twin](docs/DIGITAL_TWIN.md)** — Kinematic train movement simulation, signal aspect protection, and What-If scenarios.
- 🔒 **[Security Architecture](docs/SECURITY.md)** — JWT token rotation, password hashing, security headers, and audit trails.
- 🛂 **[Role-Based Access Control (RBAC)](docs/RBAC.md)** — Role definitions, permissions matrix, and middleware enforcement.
- 📡 **[API Architecture](docs/API_ARCHITECTURE.md)** — RESTful endpoint catalog (`/api/v1`) and WebSocket event stream (`/ws/operations`).
- 🎯 **[SIH Demo & Pitch Guide](docs/DEMO_GUIDE.md)** — Guided 10-step SIH judge demonstration workflow and presentation safety rules.
- ⚠️ **[System Limitations](docs/LIMITATIONS.md)** — Explicit boundaries regarding synthetic datasets, simulation environment, and human governance.
- 🗺️ **[Future Roadmap](docs/FUTURE_ROADMAP.md)** — Extension pathway for enterprise FOIS-NET rollout, deep learning models, and 3D GIS twin.

---

## 1. Quick Start with Docker (Recommended)

Run the complete multi-tier RAILOPT AI platform with a single command:

```bash
# 1. Enter workspace
cd "COA software"

# 2. Copy environment template (optional - defaults preconfigured)
cp .env.example .env

# 3. Build & launch full containerized stack
docker compose up --build -d
```

### Verified Service URLs

| Service | Verified URL | Description |
| :--- | :--- | :--- |
| **Frontend Web Application** | [http://localhost:3000](http://localhost:3000) (or [http://localhost:5173](http://localhost:5173)) | React 18 + Vite + SPA + Nginx Reverse Proxy |
| **Backend REST API** | [http://localhost:8000](http://localhost:8000) | FastAPI async microservice |
| **Interactive API Documentation (Swagger)** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI API Explorer |
| **Alternative API Docs (ReDoc)** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | ReDoc Specification Viewer |
| **System Health Endpoint** | [http://localhost:8000/health](http://localhost:8000/health) | Live service & database health probe |
| **Database Deep Health Endpoint** | [http://localhost:8000/health/db](http://localhost:8000/health/db) | Latency & migration state probe |
| **PostgreSQL Database** | `localhost:5432` (`railopt_db`) | PostGIS relational storage |
| **Redis Cache / Event Broker** | `localhost:6379` | WebSocket event distribution & cache |

---

## 2. Docker Operations & Lifecycle Commands

### View Container Health & Status
```bash
docker compose ps
```

### Database Migrations
```bash
docker compose exec backend alembic upgrade head
```

### Idempotent Database Seeding
```bash
docker compose exec backend python scripts/seed_database.py --seed --demo
```

### Reset & Reload Fresh Synthetic Demonstration State
```bash
docker compose exec backend python scripts/seed_database.py --reset --seed --demo
```

### Run Tests Inside Containerized Stack
```bash
# Backend pytest suite (123 tests)
docker compose exec backend python -m pytest tests/ -v
```

### Graceful Shutdown
```bash
# Stop containers keeping data volumes intact
docker compose down

# Complete reset (stop containers and remove volumes)
docker compose down -v
```

---

## 3. Container Architecture

```
                    RAILOPT AI ARCHITECTURE
                               |
               +---------------+---------------+
               |                               |
       FRONTEND (Port 3000)             BACKEND (Port 8000)
     React/Vite Multi-stage Nginx          FastAPI + OR-Tools
               |                               |
               |                   +-----------+-----------+
               |                   |                       |
               |          PostgreSQL (Port 5432)   Redis (Port 6379)
               |              railopt_db             Pub/Sub Bus
               +-------------------+
```

### Services Breakdown
1. **`frontend` (React + Nginx)**: Multi-stage build (`node:20-alpine` $\to$ `nginx:alpine`). Serves compiled production SPA with client-side routing fallback and reverse proxy for `/api/` and `/ws/`.
2. **`backend` (FastAPI + OR-Tools)**: Python 3.11 container with Google OR-Tools MIP solver, AI engines, ReportLab PDF exporter, and WebSocket manager. Includes automated database readiness retry logic and migration runner.
3. **`postgres` (PostgreSQL + PostGIS)**: Relational CRDM storage with persistent volume `postgres_data`.
4. **`redis` (Redis 7)**: Low-latency cache and live operations Pub/Sub message broker with persistent volume `redis_data` (graceful in-memory fallback if Redis is offline).

---

## 4. Local Development Workflow (Without Docker)

### Backend Setup
```bash
cd backend

# Create & activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations & seed data (uses SQLite by default or local PostgreSQL)
alembic upgrade head
python scripts/seed_database.py --seed --demo

# Start development server
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
# Running on http://localhost:5173
```

---

## 5. Demonstration Accounts & Role-Based Access Control (RBAC)

> [!IMPORTANT]
> **DEMONSTRATION ENVIRONMENT — SYNTHETIC DATA**

| Role | Synthetic Identity | Username | Demo Password | Authority / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | System Administrator | `admin` | `RailoptDemo@2026` | Full platform admin & user management |
| **CONTROL_OFFICER** | Chief Controller Arun Kumar | `control` | `RailoptDemo@2026` | Block approval, timetable publishing |
| **BLOCK_PLANNER** | Block Planner Vikramaditya | `planner` | `RailoptDemo@2026` | Multi-horizon planning, OR-Tools optimizer |
| **ENGINEERING_OFFICER** | Civil Officer Priya Sharma | `engineering` | `RailoptDemo@2026` | Track assets, ballast tamping demands |
| **SIGNAL_TELECOM_OFFICER**| S&T Officer Rajesh Varma | `signal` | `RailoptDemo@2026` | Interlocking, point machines, signal flaws |
| **TRACTION_OFFICER** | OHE Officer Amitabh Mukherjee | `traction` | `RailoptDemo@2026` | OHE lines, feeder substations, isolations |
| **ANALYST** | Analyst Deepa Balakrishnan | `analyst` | `RailoptDemo@2026` | Analytics, historical trends, reports |
| **VIEWER** | Suresh Menon | `viewer` | `RailoptDemo@2026` | Read-only operational dashboards |

---

## 6. Automated Testing & Verification

### Run Backend Pytest Suite
```bash
# Inside Docker container
docker compose exec backend python -m pytest tests/ -v

# Or locally in virtualenv
cd backend
python -m pytest tests/ -v
```

### Validate Frontend Production Build
```bash
cd frontend
npm run build
```

---

## 7. Operational Modules & API Endpoints

- **`/api/v1/auth`**: JWT access/refresh token rotation, lockout protection, RBAC profile.
- **`/api/v1/assets`**: Common Railway Data Model (CRDM) assets, condition indexing, risk levels.
- **`/api/v1/maintenance`**: Department maintenance demands, overdue detection.
- **`/api/v1/defects`**: Ultrasonic rail flaws, point machine anomalies.
- **`/api/v1/trains`**: Passenger schedules, freight traffic forecasting.
- **`/api/v1/blocks`**: Multi-department possession requests, conflict evaluation.
- **`/api/v1/planner`**: Daily (24h), Weekly (7-day), and Monthly (30-day) block planning boards.
- **`/api/v1/optimization`**: Google OR-Tools CP-SAT multi-objective integer programming.
- **`/api/v1/simulation`**: Digital Twin network execution, clock stepping, and what-if ranking.
- **`/api/v1/analytics`**: Real-time KPI aggregation, delay reduction charts, corridor availability.
- **`/api/v1/reports`**: PDF & Excel automated document generation.
- **`/ws/operations`**: Real-time WebSocket event bus.
