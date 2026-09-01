# PHASE 35 — COMPLETE SYSTEM INVENTORY & MODULE DIRECTORY

## 1. Executive Overview

This inventory records all functional modules, frontend pages, backend routers, database schemas, AI engines, optimization models, simulation components, integration adapters, and testing frameworks comprising **RAILOPT AI**.

---

## 2. Component Inventory Matrix

### 2.1 Frontend Modules & SPA Routes (`frontend/src/`)
- **Public & Authentication**: `LoginPage.tsx` (`/login`)
- **Executive & Presentation**:
  - `DemoPresentationPage.tsx` (`/demo`) — Executive 10-step SIH Presentation Hub & Storyboard
  - `DashboardPage.tsx` (`/dashboard`) — Executive Command Center & Multi-Department Situation Room
- **Core Operations**:
  - `AssetsPage.tsx` & `AssetDetail.tsx` (`/assets`, `/assets/:id`) — CRDM Asset Inventory & Health Index
  - `MaintenancePage.tsx` (`/maintenance`) — Task Scheduling, Overdue Detection & Department Priority
  - `DefectsPage.tsx` (`/defects`) — Infrastructure Defect Severity & Resolution Workflows
  - `TrainsPage.tsx` (`/trains`) — Passenger & Goods Timetables, Movement Density
  - `CorridorsPage.tsx` (`/corridors`) — Track Section Topology & Availability Timelines
  - `BlocksPage.tsx` (`/blocks`, `/blocks/requests`, `/blocks/approved`) — Possession Demands & Approval Queue
- **AI & Optimization**:
  - `AIOverviewPage.tsx` (`/ai`) — AI Risk Scoring, Priority Indexing & Bundling Advisory
  - `OptimizationResultPage.tsx` (`/planner/optimization-result`) — Google OR-Tools CP-SAT Solver Results
  - `MultiHorizonPlannerPage.tsx` (`/planner/daily`, `/planner/weekly`, `/planner/monthly`) — Daily/Weekly/Monthly Gantt Planners
- **Simulation & Analytics**:
  - `DigitalTwinPage.tsx` (`/simulation/digital-twin`) — 1D Kinematic Physics Simulator
  - `SimulationResultsPage.tsx` (`/simulation/results`) — Before vs After 4.5h vs 2.0h Downtime Impact
  - `WhatIfPage.tsx` (`/simulation/what-if`) — Scenario A/B/C Multi-Ranking Engine
  - `AnalyticsPage.tsx` (`/analytics`) — Strategic Availability & Downtime Metrics
  - `ReportsPage.tsx` (`/reports`) — PDF/CSV/Excel Operations Report Generator
- **System Administration & Architecture**:
  - `AdminPage.tsx` (`/admin`) — User Account Management & RBAC Role Assignment
  - `AuditPage.tsx` (`/audit`) — Security Audit Logs & Immutable Action Tokens
  - `ArchitecturePage.tsx` (`/architecture`) — System Topology & Integration Diagrams

### 2.2 Backend API Routers (`backend/app/api/`)
- `auth.py`: JWT login, refresh token rotation, logout, password change, account lockout.
- `users.py` & `roles.py`: User accounts, RBAC assignments, permissions.
- `corridors.py`, `stations.py`, `departments.py`: Network topology entities.
- `assets.py`, `maintenance.py`, `defects.py`: CRDM inventory, health scores, maintenance tasks.
- `trains.py` & `forecasts.py`: Passenger timetables, train schedules, freight goods forecasts.
- `blocks.py`: Block request lifecycle (`DRAFT` $\to$ `SUBMITTED` $\to$ `APPROVED`), conflict detection.
- `ai.py`: Priority calculation, risk prediction, failure probability, explainability.
- `planner.py` & `optimization.py`: CP-SAT daily/weekly/monthly solver invocation.
- `simulation.py`: Digital twin 1D kinematic simulation, scenario comparison.
- `reports.py`: PDF, CSV, Excel export endpoints.
- `integrations.py`: Legacy feeds (`TMSAdapter`, `SMMSAdapter`, `TDMSAdapter`, `BDMSAdapter`, `COAAdapter`).
- `audit.py`: Security action audit trail logs.
- `analytics.py` & `dashboard.py`: KPI summaries and track availability metrics.

### 2.3 Database Schemas & Models (`backend/app/models/`)
- 40 CRDM tables covering Users, Roles, Permissions, RefreshTokens, Stations, Corridors, Assets, AssetHealth, MaintenanceTasks, Defects, Inspections, Trains, TrainSchedules, GoodsForecasts, BlockRequests, BlockPlans, BlockConflicts, OptimizationRuns, SimulationRuns, SimulationEvents, Notifications, AuditLogs.

### 2.4 AI & Optimization Engines (`backend/app/optimization/` & `backend/app/ai/`)
- **Google OR-Tools CP-SAT Solver**: `block_optimizer.py` (Discrete constraint solver, candidate generator, constraint builder, objective builder, explainability generator).
- **AI Priority Model**: Multi-criteria priority scoring (`rule_based.py`).
- **AI Risk Model**: Failure probability and asset criticality index (`rule_based.py`).
- **Conflict Engine**: Spatial-temporal collision detector (`conflict_engine.py`).

### 2.5 Real-Time WebSockets (`backend/app/services/websocket_manager.py`)
- Authenticated `/ws/operations` event bus with Redis Pub/Sub integration and in-memory fallback.

### 2.6 Docker Container Stack (`docker-compose.yml`)
- `frontend` (React SPA + Nginx on port 3000)
- `backend` (FastAPI Uvicorn on port 8000)
- `postgres` (PostGIS 15 on port 5432, persistent volume `postgres_data`)
- `redis` (Redis 7 on port 6379, persistent volume `redis_data`)
