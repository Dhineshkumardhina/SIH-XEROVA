# RAILOPT AI — Prototype Limitations & Safety Boundaries
**Smart India Hackathon (SIH) — Technical & Operational Transparency Statement**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Safety & Operational Boundaries

1. **Advisory Decision Support Only**:
   - RAILOPT AI is an AI-assisted planning and decision-support prototype. It does **not** replace the human authority of the Chief Controller or Section Controllers.
   - All generated block schedules remain in `DRAFT` status until explicitly reviewed and approved by an authorized `CONTROL_OFFICER`.

2. **No Physical Infrastructure Actuation**:
   - The platform has no direct physical or electrical connection to real railway signaling (Electronic Interlocking / Solid State Interlocking), point machine motors, or traction circuit breakers.

---

## 2. Technical Limitations

| Dimension | Current Prototype Implementation | Production Railway Requirement |
| :--- | :--- | :--- |
| **Data Ingestion** | Synthetic adapters simulating TMS, SMMS, TDMS, and COA payloads. | Live REST / Kafka / MQ integrations with CRIS enterprise servers. |
| **Machine Learning Models** | Explainable rule-based priority and baseline degradation wear formulas. | Deep ML / XGBoost models trained on multi-year historical sensor logs. |
| **Track Topology** | Double-line trunk corridors with simplified crossover geometry. | Full micro-layout GIS topologies including loops, sidings, and gradients. |
| **Safety Certification** | Hackathon demonstration prototype. | Independent safety assessment conforming to **CENELEC EN 50128 / EN 50129 (SIL-2/SIL-4)** standards. |
