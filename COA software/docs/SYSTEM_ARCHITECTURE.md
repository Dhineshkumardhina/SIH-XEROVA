# SYSTEM ARCHITECTURE — RAILOPT AI

## 1. Executive System Overview

**RAILOPT AI** is an enterprise-grade, multi-department AI decision support and joint block optimization platform designed for Indian Railways operations. 

The system unifies data from fragmented legacy railway operational software—including Track Management System (TMS), Signal & Telecom Maintenance Management System (SMMS), Traction Energy & Asset Management (TDMS), Block Decision Support (BDMS), and Control Office Application (COA)—into a unified **Corridor Resource Data Model (CRDM)**.

```mermaid
graph TD
    subgraph Legacy Systems Ingestion Layer
        TMS[TMS - Track]
        SMMS[SMMS - S&T]
        TDMS[TDMS - OHE]
        BDMS[BDMS - Blocks]
        COA[COA - Timetables]
    end

    subgraph RAILOPT Core Backend (FastAPI / Python)
        INT[Integration & CRDM Engine]
        AI[AI Risk & Priority Engine]
        OPT[Google OR-Tools CP-SAT Solver]
        SIM[Digital Twin Simulator]
        WS[WebSocket Event Hub]
        AUTH[JWT & RBAC Security Engine]
    end

    subgraph Data & Storage Layer
        DB[(PostgreSQL / SQLAlchemy ORM)]
        CACHE[(Redis Caching & PubSub)]
    end

    subgraph Modern Web Frontend (React 19 / Vite)
        DASH[Executive Situation Room]
        PLAN[Joint Block Planner]
        TWIN[Corridor Digital Twin]
        DEMO[SIH Guided Demo Controller]
    end

    TMS --> INT
    SMMS --> INT
    TDMS --> INT
    BDMS --> INT
    COA --> INT

    INT --> DB
    DB <--> AI
    DB <--> OPT
    DB <--> SIM
    
    OPT --> WS
    SIM --> WS
    WS <--> CACHE

    AUTH --> DB

    DASH <--> REST[REST API /api/v1]
    PLAN <--> REST
    TWIN <--> REST
    REST <--> Core
    TWIN <--> WS
```

---

## 2. Component Subsystems

### 2.1 Frontend Shell
- **Framework & Build**: React 19, Vite 8, TypeScript 5.6.
- **Styling & UI**: TailwindCSS 4, Lucide React icons, Vanilla CSS custom tokens, glassmorphism dark theme.
- **State Management**:
  - `useUIStore`: Theme mode (light/dark), navigation collapses, global search, modal states.
  - `useAuthStore`: User profile, JWT tokens (`railopt_access_token`, `railopt_refresh_token`), RBAC permissions.
  - `useDemoStore`: 10-step SIH Presentation Mode state machine, route synchronization, backend retry state.
  - `TanStack Query (React Query v5)`: Async server state fetching, caching, and auto-invalidation.

### 2.2 Backend Application Server
- **Framework**: FastAPI (Python 3.11+), ASGI Uvicorn/Gunicorn application server.
- **API Router (`/api/v1`)**: 22 dedicated modular routers including `/auth`, `/users`, `/departments`, `/stations`, `/corridors`, `/assets`, `/maintenance`, `/defects`, `/trains`, `/blocks`, `/ai`, `/optimization`, `/planner`, `/simulation`, `/analytics`, `/reports`.
- **Async Execution**: Non-blocking IO endpoints with standard Pydantic v2 data validation schemas.

### 2.3 Persistence Layer (PostgreSQL & SQLAlchemy)
- **Database Engine**: PostgreSQL (with SQLite support for isolated local developer testing).
- **ORM Framework**: SQLAlchemy 2.0 declarative models with `pool_pre_ping=True` connection health pooling.
- **Schema Management**: Alembic migration scripts for database schema evolution.

### 2.4 Real-Time WebSocket Communication Layer
- **Endpoint**: `/ws/operations?token=<JWT_TOKEN>`
- **Connection Management**: `ConnectionManager` class handling client connection lifecycle, room subscriptions (department-based routing), and heartbeats (`ping`/`pong`).
- **Pub/Sub Messaging**: Real-time broadcast of live train position updates, block possession status transitions, and AI conflict alerts.

### 2.5 Integration Layer & Legacy Adapters
- **Adapters**: TMS (Engineering), SMMS (S&T), TDMS (Traction), BDMS (Block Demands), COA (Control Office Timetables).
- **Data Normalization**: Translates disparate legacy payloads into standardized SQLAlchemy CRDM schema entities.

### 2.6 AI & Optimization Subsystem
- **AI Risk & Priority Engines**: Machine learning baseline and rule-based heuristic engines computing asset failure risk scores ($0 - 100$) and multi-department task urgency weights.
- **Optimization Solver**: Google OR-Tools CP-SAT solver modeling joint block bundling as a discrete Constraint Satisfaction Problem (CSP).

### 2.7 Digital Twin Simulation Subsystem
- **Kinematic Simulator**: Physics-based 1D spatial simulation engine modeling train accelerations, decelerations, signal block aspects, and possession slot closures.

---

## 3. Technology Stack Reference Table

| Layer | Primary Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.2 | Single-page reactive user interface |
| **Build Tooling** | Vite | 8.2 | Fast HMR and optimized production bundling |
| **State Management** | Zustand | 5.0 | Lightweight global state stores |
| **Server State** | TanStack Query | 5.102 | Asynchronous request caching & deduplication |
| **Backend Framework** | FastAPI | 0.115+ | High-performance Python ASGI web framework |
| **Database ORM** | SQLAlchemy | 2.0+ | Object-relational database mapper |
| **Optimization Engine**| Google OR-Tools CP-SAT | 9.10+ | Constraint programming optimization solver |
| **Authentication** | PyJWT / Passlib / Argon2 | 2.9+ | Secure JWT token signing & password hashing |
| **WebSockets** | WebSockets / ASGI | 12.0+ | Bi-directional real-time operational event streaming |
