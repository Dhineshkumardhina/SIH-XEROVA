# PRESENTATION DEPLOYMENT & RUNBOOK — RAILOPT AI

## 1. Executive Summary

This guide provides step-by-step instructions to deploy and present **RAILOPT AI** on a fresh presentation laptop using Docker Compose. The environment runs completely offline without requiring internet access or manual installation of Python, Node.js, PostgreSQL, or Redis.

---

## 2. Pre-Demo Verification Checklist

Before presentation day, complete this pre-flight readiness checklist:

- [x] **Docker Engine**: Docker Desktop / Docker Engine 24.0+ installed and running.
- [x] **Repository Environment**: Repository cloned and `.env` template copied (`cp .env.example .env`).
- [x] **Container Build**: Docker stack builds cleanly using `docker compose up --build -d`.
- [x] **PostgreSQL Health**: PostgreSQL container (`railopt_postgres`) healthy on port 5432 (`pg_isready`).
- [x] **Redis Health**: Redis container (`railopt_redis`) healthy on port 6379 (`redis-cli ping`).
- [x] **Backend Health**: FastAPI backend (`railopt_backend`) healthy on port 8000 (`http://localhost:8000/health`).
- [x] **Frontend Availability**: React/Vite SPA (`railopt_frontend`) active on port 3000 (`http://localhost:3000`).
- [x] **Demo Authentication**: Demo credentials verified (`control` / `RailoptDemo@2026`).
- [x] **Synthetic Dataset Loaded**: Database populated with 6 stations, 5 corridors, 55 assets, 105 maintenance tasks, 65 defects, 16 trains, 144 timetables, and 55 block demands.
- [x] **SIH Presentation Mode**: 10-step guided demo navigation bar functional.
- [x] **End-to-End Planning Flow**: CP-SAT solver, Digital Twin simulation, and RBAC approval verified.

---

## 3. Demo Day Step-by-Step Instructions

### Step 1: Launch Containerized Stack
On the presentation machine, open a shell in the `COA software/` directory and execute:

```bash
docker compose up --build -d
```

### Step 2: Verify Container Health Status
Check that all 4 containers reach `healthy` status:

```bash
docker compose ps
```

*Expected Output:*
```
NAME               IMAGE                     STATUS                   PORTS
railopt_postgres   postgis/postgis:15-3.3   Up (healthy)             0.0.0.0:5432->5432/tcp
railopt_redis      redis:7-alpine            Up (healthy)             0.0.0.0:6379->6379/tcp
railopt_backend    coasoftware-backend       Up (healthy)             0.0.0.0:8000->8000/tcp
railopt_frontend   coasoftware-frontend      Up (healthy)             0.0.0.0:3000->80/tcp
```

### Step 3: Open Application in Web Browser
Open your browser (Chrome/Edge/Firefox) to:
- **Frontend SPA**: `http://localhost:3000`
- **Backend Swagger API Docs**: `http://localhost:8000/docs`
- **Health Probe**: `http://localhost:8000/health`

### Step 4: Authenticate as Chief Controller
Log in using standard SIH presentation credentials:
- **Username**: `control`
- **Password**: `RailoptDemo@2026`

### Step 5: Activate SIH Presentation Mode
Click **`ENABLE DEMO MODE`** in the top navigation header bar to enable the 10-step guided navigation dock.

### Step 6: Execute Presentation Workflow
Use **NEXT DEMO STEP** to guide judges through the 10-step demonstration:
1. **COMMAND CENTER** (`/dashboard`)
2. **MAINTENANCE** (`/maintenance`)
3. **TRAIN OPERATIONS** (`/trains`)
4. **CORRIDOR** (`/corridors`)
5. **BLOCK REQUESTS** (`/blocks/requests`)
6. **AI ANALYSIS** (`/ai`)
7. **OPTIMIZATION** (`/planner/optimization-result`) — Run CP-SAT solver
8. **SIMULATION** (`/simulation/digital-twin`) — Launch kinematic simulation
9. **BEFORE / AFTER** (`/simulation/results`) — Highlight 270m $\to$ 120m downtime reduction
10. **APPROVAL** (`/blocks/approved`) — Authorize plan under RBAC governance

---

## 4. Reset & Maintenance Commands

### Reset Demo State to Deterministic Baseline
To restore initial demonstration data during or between judge presentations:

```bash
docker compose exec backend python scripts/seed_database.py --reset --seed --demo
```

### View Live Operational Logs
```bash
docker compose logs -f backend
```

### Graceful Teardown
```bash
# Stop containers keeping database volume intact
docker compose down
```
