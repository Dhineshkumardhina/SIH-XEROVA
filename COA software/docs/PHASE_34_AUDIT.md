# PHASE 34 — PRODUCTION HARDENING, RELIABILITY & SECURITY AUDIT

## 1. Current Architecture Overview

**RAILOPT AI** is an AI-powered Automatic Railway Block Planning & Asset Availability Optimization Platform built on:

- **Frontend**: React 19 SPA + Vite + Tailwind CSS + Lucide Icons + Zustand State Management.
- **Backend**: FastAPI (Python 3.11/3.12) ASGI microservice + Google OR-Tools CP-SAT Solver + 1D Kinematic Simulation Engine + CRDM Integration Adapters.
- **Database**: PostgreSQL 15 + PostGIS + SQLAlchemy 2.0 ORM + Alembic schema migrations.
- **Cache & Real-Time Event Bus**: Redis 7 + WebSockets (`/ws/operations`) with in-memory fallback.
- **Containerization**: Docker Compose bridge network orchestrating 4 services (`frontend`, `backend`, `postgres`, `redis`).

---

## 2. Risk Assessment & Vulnerability Analysis

### 2.1 Backend Reliability & Exception Safety
- **Risk**: Unhandled exceptions (`Exception`, `SQLAlchemyError`, `ValueError`) fallback to FastAPI's default 500 handler without a structured JSON error contract or `request_id` correlation.
- **Impact**: Potential leakage of Python stack traces, database query parameters, or internal filesystem paths to clients.

### 2.2 Optimization Engine Solver Infeasibility
- **Risk**: When OR-Tools CP-SAT receives zero tasks, invalid window bounds, or impossible constraint combinations, `run_optimization` completes without throwing an explicit domain error, returning an empty block array instead of raising `NO_FEASIBLE_PLAN`.
- **Impact**: Frontend receives an empty plan payload without actionable explanations for controllers.

### 2.3 Authentication, Rate Limiting & RBAC Authorization
- **Risk**: High-frequency sensitive endpoints (`/auth/login`, `/planner/daily/generate`, `/simulation/run`, `/ai/*`) lack rate limiting protection against brute-force or denial-of-service attacks.
- **Impact**: Vulnerability to brute-force authentication attempts and CPU-exhaustion from repeated solver requests.

### 2.4 Frontend Resilience & Memory Management
- **Risk**: Component runtime errors within unhandled rendering branches can crash the entire React component tree.
- **Impact**: White screen of death for users without graceful error recovery buttons (`RETRY` / `RETURN TO DASHBOARD`).

### 2.5 WebSocket Connection State & Auto-Reconnect Loop
- **Risk**: Uncontrolled WebSocket reconnection loops on network disruption can cause client browser memory inflation or socket starvation.
- **Impact**: High CPU/memory consumption during temporary backend restarts or network drops.

---

## 3. Findings Matrix

| ID | Category | Severity | Description | Target Fix Location |
| :--- | :--- | :--- | :--- | :--- |
| **AUD-01** | Backend | **CRITICAL** | Missing global `Exception` handler and `request_id` tracking middleware. | `backend/app/main.py`, `backend/app/core/exceptions.py` |
| **AUD-02** | Optimization | **CRITICAL** | Infeasible or zero-task optimization scenarios do not raise `NO_FEASIBLE_PLAN`. | `backend/app/optimization/block_optimizer.py`, `backend/app/api/optimization.py` |
| **AUD-03** | Security | **CRITICAL** | Missing rate limiting middleware for sensitive endpoints (`/auth/login`, `/optimization/run`). | `backend/app/core/rate_limiter.py`, `backend/app/main.py` |
| **AUD-04** | Frontend | **HIGH** | Absence of top-level React `ErrorBoundary` wrapping the SPA shell. | `frontend/src/components/ui/ErrorBoundary.tsx`, `frontend/src/App.tsx` |
| **AUD-05** | WebSocket | **HIGH** | WebSocket client lacks exponential backoff and explicit status indicator (`LIVE` / `RECONNECTING` / `OFFLINE`). | `frontend/src/services/websocket.ts`, `frontend/src/components/layout/TopNavigation.tsx` |
| **AUD-06** | Validation | **MEDIUM** | Pydantic schemas lack explicit min/max value bounds for durations and risk scores. | `backend/app/schemas/` |
| **AUD-07** | Security | **MEDIUM** | Security headers missing `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`. | `backend/app/main.py` |
| **AUD-08** | AI Engine | **MEDIUM** | Potential for `NaN` or unnormalized scores under edge-case zero-denominator inputs. | `backend/app/ai/priority/rule_based.py`, `backend/app/ai/risk/rule_based.py` |
| **AUD-09** | Reporting | **MEDIUM** | Report generation endpoints (PDF/CSV/Excel) require safety fallbacks for empty datasets. | `backend/app/api/reports.py`, `backend/app/services/report_generator.py` |

---

## 4. Recommended Hardening Plan

1. **Implement Global `request_id` Middleware & Catch-All Exception Handler**:
   - Generate unique `req_xxxxxxxx` per request, attach to `request.state.request_id` and `X-Request-ID` response header.
   - Catch unhandled `Exception` instances and return standardized `ApiResponse(success=False, error={"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred. Reference ID: req_xxx"})`.

2. **Harden OR-Tools Optimization Engine**:
   - Enforce configurable solver timeout `OPTIMIZER_TIMEOUT_SECONDS` (default: 5 seconds in demo mode).
   - If tasks are empty or CP-SAT returns `INFEASIBLE`, raise `AppException(code="NO_FEASIBLE_PLAN", message="No feasible block window exists for the selected maintenance tasks and corridor constraints.")`.

3. **Implement Rate Limiting Middleware**:
   - Create memory sliding-window rate limiter for `/auth/login` (10 req/min), `/planner/daily/generate` (12 req/min), `/ai/*` (30 req/min), and `/simulation/run` (15 req/min).

4. **Implement React `ErrorBoundary` Component**:
   - Wrap `<AppRoutes />` inside an `ErrorBoundary` rendering a clean fallback UI with `RETRY` and `RETURN TO DASHBOARD` buttons.

5. **Harden WebSocket Client & Status Indicator**:
   - Add ping/pong heartbeat, max retry limit (5 retries), exponential backoff, and export connection state (`LIVE`, `RECONNECTING`, `OFFLINE`).

6. **Validate Pydantic Schemas & Normalize AI Outputs**:
   - Add `@field_validator` or `Field(ge=0, le=100)` on all score and duration fields. Ensure AI engines sanitize `NaN`/`Infinity` values to 0.0–100.0.

7. **Security & CORS Verification**:
   - Ensure CORS settings use configured origins array from `.env` (no wildcard `*` with credentials).

8. **Execute Full Test Verification**:
   - Run backend `pytest` suite, frontend `vitest` suite, and production `npm run build`.
