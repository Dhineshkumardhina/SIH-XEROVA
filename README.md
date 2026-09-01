# RAILOPT AI — SIH-XEROVA

**Smart India Hackathon (SIH) — AI-Powered Joint Railway Maintenance Block Planning & Asset Availability Platform**

> [!NOTE]
> **DEMONSTRATION ENVIRONMENT • SYNTHETIC DATA**
> This repository uses synthetically generated railway data for demonstration, optimization benchmark, and evaluation purposes. It does NOT connect to live railway signaling or classified operational infrastructure.

---

## Technical Documentation Sitemap

All comprehensive system documentation is located in [`COA software/docs/`](COA%20software/docs/):

- 🏗️ **[System Architecture](COA%20software/docs/SYSTEM_ARCHITECTURE.md)** — Core components, microservices, databases, WebSockets, and tech stack.
- 🔄 **[Data Flow Architecture](COA%20software/docs/DATA_FLOW.md)** — End-to-end data pipeline from legacy feeds to optimized block plans and simulation.
- 🧠 **[AI Architecture](COA%20software/docs/AI_ARCHITECTURE.md)** — Asset health risk scoring, MCDA task priority indexing, and explainability advisory engine.
- ⚙️ **[Optimization Engine](COA%20software/docs/OPTIMIZATION_ENGINE.md)** — Mathematical formulation of Google OR-Tools CP-SAT constraint programming solver.
- 🔌 **[Integration Architecture](COA%20software/docs/INTEGRATION_ARCHITECTURE.md)** — Subsystem adapters for legacy TMS, SMMS, TDMS, BDMS, and COA applications.
- 🕹️ **[Corridor Digital Twin](COA%20software/docs/DIGITAL_TWIN.md)** — Kinematic train movement simulation, signal aspect protection, and What-If scenarios.
- 🔒 **[Security Architecture](COA%20software/docs/SECURITY.md)** — JWT token rotation, password hashing, security headers, and audit trails.
- 🛂 **[Role-Based Access Control (RBAC)](COA%20software/docs/RBAC.md)** — Role definitions, permissions matrix, and middleware enforcement.
- 📡 **[API Architecture](COA%20software/docs/API_ARCHITECTURE.md)** — RESTful endpoint catalog (`/api/v1`) and WebSocket event stream (`/ws/operations`).
- 🎯 **[SIH Demo & Pitch Guide](COA%20software/docs/DEMO_GUIDE.md)** — Guided 10-step SIH judge demonstration workflow and presentation safety rules.
- ⚠️ **[System Limitations](COA%20software/docs/LIMITATIONS.md)** — Explicit boundaries regarding synthetic datasets, simulation environment, and human governance.
- 🗺️ **[Future Roadmap](COA%20software/docs/FUTURE_ROADMAP.md)** — Extension pathway for enterprise FOIS-NET rollout, deep learning models, and 3D GIS twin.

---

## Source Code & Installation

The complete application codebase, setup scripts, and Docker configuration are located in the [`COA software/`](COA%20software/) directory.

Refer to [`COA software/README.md`](COA%20software/README.md) for quick-start Docker commands and local development instructions.