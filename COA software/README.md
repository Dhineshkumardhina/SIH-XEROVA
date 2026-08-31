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

## 1. Quick Start with Docker (Recommended)

Run the complete multi-tier RAILOPT AI platform with a single command:

```bash
# 1. Clone & enter workspace
cd "SIH-XEROVA/COA software"

# 2. Copy environment template
cp .env.example .env

# 3. Build & launch full containerized stack
docker compose up --build
```

Once started, access the platform services:

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web Application** | [http://localhost:3000](http://localhost:3000) (or `:5173`) | React 18 + Vite + Tailwind + Lucide UI |
| **Backend REST API** | [http://localhost:8000](http://localhost:8000) | FastAPI async microservice |
| **Interactive API Documentation** | [http://localhost:8000/docs](http://localhost:8000/docs) | Swagger UI |
| **System Health Endpoint** | [http://localhost:8000/health](http://localhost:8000/health) | Live service & database health probe |
| **PostgreSQL Database** | `localhost:5432` (`railopt_db`) | PostGIS relational storage |
| **Redis Cache / Event Broker** | `localhost:6379` | WebSocket event distribution & cache |

---

## 2. Docker Architecture

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
2. **`backend` (FastAPI + OR-Tools)**: Python 3.11/3.12 container with Google OR-Tools MIP solver, AI engines, ReportLab PDF exporter, and WebSocket manager. Includes automated database readiness retry logic and migration runner.
3. **`postgres` (PostgreSQL + PostGIS)**: Relational CRDM storage with persistent volume `postgres_data`.
4. **`redis` (Redis 7)**: Low-latency cache and live operations Pub/Sub message broker with persistent volume `redis_data`.

---

## 3. Database Migrations & Seeding in Docker

### Run Migrations Inside Backend Container
```bash
docker compose exec backend alembic upgrade head
```

### Seed Synthetic Demonstration Data
```bash
docker compose exec backend python scripts/seed_database.py --seed --demo
```

### Reset & Reload Fresh Demo State
```bash
docker compose exec backend python scripts/seed_database.py --reset --seed --demo
```

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

| Role | Synthetic Identity | Username | Demo Password | Authority / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **SUPER_ADMIN** | System Administrator | `admin` | `RailoptDemo@2026` | Full platform admin & user management |
| **CONTROL_OFFICER** | Chief Controller Arun Kumar | `control` | `RailoptDemo@2026` | Block approval, timetable publishing |
| **BLOCK_PLANNER** | Block Planner Vikramaditya | `planner` | `RailoptDemo@2026` | Multi-horizon planning, OR-Tools optimizer |
| **ENGINEERING_OFFICER** | Civil Officer Priya Sharma | `engineering` | `RailoptDemo@2026` | Track assets, ballast tamping demands |
| **SIGNAL_TELECOM_OFFICER**| S&T Officer Rajesh Varma | `signal` | `RailoptDemo@2026` | Interlocking, point machines, signal flas |
| **TRACTION_OFFICER** | OHE Officer Amitabh Mukherjee | `traction` | `RailoptDemo@2026` | OHE lines, feeder substations, isolations |
| **ANALYST** | Analyst Deepa Balakrishnan | `analyst` | `RailoptDemo@2026` | Analytics, historical trends, reports |
| **VIEWER** | Suresh Menon | `viewer` | `RailoptDemo@2026` | Read-only operational dashboards |

---

## 6. Automated Testing & Verification

### Run Backend Pytest Suite (123 Tests)
```bash
cd backend
python -m pytest tests/ -v
```

### Run Frontend Vitest Suite
```bash
cd frontend
npm test
```

### Validate Production Build
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
