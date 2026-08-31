# RAILOPT AI — Requirements Traceability Matrix
**Smart India Hackathon (SIH) — Automated Railway Block Planning & Operational Intelligence**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Traceability Overview

This document provides a comprehensive mapping between the functional and non-functional requirements of the railway block optimization problem statement and their concrete implementations within the **RAILOPT AI** codebase.

---

## 2. Core Functional Requirements Matrix

| Ref ID | Problem Statement Requirement | Implementation in RAILOPT AI | Status | Verification & Code Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **REQ-01** | **Legacy System Ingestion (TMS, SMMS, TDMS, BDMS, COA)** | Implemented unified mock adapters ingesting timetable, track condition, OHE defect, bridge data, and control logs into the Common Railway Data Model (CRDM). | **IMPLEMENTED** | `backend/app/integrations/adapters.py`<br>`backend/app/services/crdm_service.py` |
| **REQ-02** | **Unified Railway Data Model (CRDM)** | 45+ normalized relational tables covering Departments, Assets (Track, OHE, Signal, Telecom), Maintenance Tasks, Defects, Train Schedules, Movements, and Block Possessions. | **IMPLEMENTED** | `backend/app/models/`<br>`backend/alembic/versions/` |
| **REQ-03** | **Multi-Tier AI Priority Scoring** | 7-factor deterministic priority engine scoring maintenance demands from 0 to 100 with explainable factor breakdown and safety overrides. | **IMPLEMENTED** | `backend/app/ai/priority_engine.py`<br>`backend/app/services/ai_priority_service.py` |
| **REQ-04** | **Asset Failure Risk Prediction** | Track and asset degradation risk estimator computing failure probability, remaining safe life, and urgency tier. | **IMPLEMENTED** | `backend/app/ai/risk_engine.py`<br>`backend/app/api/ai.py` |
| **REQ-05** | **Spatial & Temporal Conflict Detection** | 2D/3D collision detection identifying track overlap, shared corridor contention, headway safety violations, and power isolation boundaries. | **IMPLEMENTED** | `backend/app/ai/conflict_engine.py`<br>`backend/tests/unit/test_conflict_engine.py` |
| **REQ-06** | **MIP Block Optimization (OR-Tools)** | Real Google OR-Tools CP-SAT integer programming solver automating multi-department block bundling into traffic lull slots. | **IMPLEMENTED** | `backend/app/optimization/block_optimizer.py`<br>`backend/tests/unit/test_optimizer.py` |
| **REQ-07** | **Multi-Horizon Planning Boards** | Interactive Daily (24h), Weekly (7-day), and Monthly (30-day) block allocation boards with workload balancing. | **IMPLEMENTED** | `backend/app/ai/multi_horizon_planner.py`<br>`frontend/src/pages/planner/` |
| **REQ-08** | **Train Impact & Delay Propagation** | Timetable delay calculation simulating passenger and freight headway adjustments, speed restrictions, and punctuality delta. | **IMPLEMENTED** | `backend/app/ai/train_impact.py`<br>`frontend/src/components/planner/TrainImpactPanel.tsx` |
| **REQ-09** | **Digital Twin Network Simulation** | Real-time virtual clock simulation engine stepping through block possessions, train movements, and unexpected incidents. | **IMPLEMENTED** | `backend/app/simulation/`<br>`frontend/src/pages/simulation/DigitalTwinPage.tsx` |
| **REQ-10** | **What-If Scenario Evaluation** | Comparative scenario builder allowing planners to adjust block durations, traffic buffers, and rank multi-objective outcomes. | **IMPLEMENTED** | `backend/app/simulation/scenario_engine.py`<br>`frontend/src/pages/simulation/WhatIfAnalysisPage.tsx` |
| **REQ-11** | **Role-Based Access Control (RBAC)** | 8 standard railway roles with server-enforced permissions, account lockout protection, and department data boundaries. | **IMPLEMENTED** | `backend/app/core/security.py`<br>`backend/tests/security/test_rbac_security.py` |
| **REQ-12** | **Human-in-the-Loop Approval Workflow** | Block review, draft generation, formal submission, and Control Officer multi-action approval/rejection cycle. | **IMPLEMENTED** | `backend/app/services/block_service.py`<br>`frontend/src/pages/blocks/BlockApprovalPage.tsx` |
| **REQ-13** | **Automated Multi-Format Reporting** | PDF (ReportLab) and Excel (openpyxl) generation for Daily Block Plans, Asset Availability, Train Impacts, and Executive Summaries. | **IMPLEMENTED** | `backend/app/services/report_service.py`<br>`frontend/src/pages/Reports.tsx` |
| **REQ-14** | **Real-Time WebSockets & Notifications** | Authenticated bi-directional event stream distributing train delays, emergency defects, block completions, and system alerts. | **IMPLEMENTED** | `backend/app/services/websocket_manager.py`<br>`frontend/src/services/websocket.ts` |
| **REQ-15** | **Containerization & Deployment** | Multi-stage Dockerfiles, Nginx reverse proxy with SPA fallback, PostgreSQL, Redis, health checks, and Docker Compose stack. | **IMPLEMENTED** | `docker-compose.yml`<br>`backend/Dockerfile`<br>`frontend/Dockerfile` |

---

## 3. Verification Summary

Every implemented module has been verified via automated test suites (`pytest` for backend, `vitest` for frontend) and complete end-to-end integration tests.
