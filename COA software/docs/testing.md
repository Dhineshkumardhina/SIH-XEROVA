# RAILOPT AI — Testing & Quality Assurance Suite
**Smart India Hackathon (SIH) — Test Strategy, Commands & Coverage**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Test Suite Summary

The RAILOPT AI platform maintains automated test suites covering unit algorithms, REST APIs, security boundaries, and full operational lifecycles.

```text
================================================================================
AUTOMATED TEST EXECUTION METRICS
================================================================================
Backend Pytest Suite:     123 PASSED / 0 FAILED (27.97s)
Frontend Vitest Suite:    10 PASSED / 0 FAILED (2.77s)
TypeScript Static Build:  0 Errors (tsc -b && vite build — 2,597 modules)
Overall Test Pass Rate:   100%
================================================================================
```

---

## 2. Test Execution Commands

### 2.1 Backend Tests (`pytest`)
```bash
cd backend

# Run the complete test suite (all 26 test files)
python -m pytest tests/ -v

# Run unit tests only (AI Priority, Risk, Conflict, OR-Tools)
python -m pytest tests/unit/ -v

# Run security & RBAC isolation tests
python -m pytest tests/security/ -v

# Run full SIH operational lifecycle system test
python -m pytest tests/integration_system/test_full_planning_flow.py -v
```

### 2.2 Frontend Tests (`vitest` + `tsc`)
```bash
cd frontend

# Run Vitest component and shell unit tests
npm test

# Run TypeScript compilation and production bundle build
npm run build
```

---

## 3. Test Suites Directory Structure

```text
backend/tests/
├── conftest.py                             <- Standard test client & RBAC token fixtures
├── unit/
│   ├── test_priority_engine.py             <- 7-Factor scoring, weights & override logic
│   ├── test_risk_engine.py                 <- Asset failure probability & health curves
│   ├── test_conflict_engine.py             <- Spatial, temporal & power section overlaps
│   └── test_optimizer.py                   <- Real Google OR-Tools CP-SAT MIP solver
├── integration/
│   └── test_all_crud_apis.py               <- REST API contract tests across all 12 domains
├── security/
│   └── test_rbac_security.py               <- 401/403 boundaries, role permissions, password security
├── integration_system/
│   └── test_full_planning_flow.py          <- Complete end-to-end SIH operations flow
└── test_*.py (18 phase modules)            <- Dedicated verification modules for Phases 1–24
```
