# SYSTEM LIMITATIONS & BOUNDARIES — RAILOPT AI

## 1. Explicit Operational Boundaries

To maintain technical transparency, strict compliance, and scientific rigor, this document explicitly outlines the operational boundaries and limitations of **RAILOPT AI**.

---

## 2. Documented System Limitations

### 2.1 Synthetic Demonstration Data Set
- **Boundary**: All operational data (including asset records, track geometry readings, maintenance tasks, train timetables, and defect logs) are **synthetic data sets** generated to reflect realistic Indian Railways corridor parameters (e.g. Corridor COR-A01).
- **Rationale**: Live operational data from Indian Railways production servers (FOIS/COA/TMS) is restricted under national infrastructure security regulations.

### 2.2 Subsystem Integration Adapters
- **Boundary**: Integration adapters for TMS, SMMS, TDMS, BDMS, and COA operate against **simulated REST API endpoints** rather than live Indian Railways enterprise database links.
- **Rationale**: Physical database links (DBLinks) to legacy FOIS/COA servers are isolated behind private railway network firewalls (FOIS-NET).

### 2.3 Prototype AI & Decision Support Models
- **Boundary**: Predictive failure models utilize **rule-based physical heuristics and statistical regression baselines** rather than deep neural networks trained on multi-year sensor telemetry.
- **Rationale**: Deep learning models require multi-terabyte historical sensor logs (vibration, thermal, acoustic) unavailable in sandbox hackathon settings.

### 2.4 Simulation-Only Railway Environment
- **Boundary**: The **Corridor Digital Twin** is a software kinematic simulation sandbox modeling 1D train physics and signal aspects.
- **No Physical Hardware Connection**: The platform is **not connected to physical signalling relays, solid-state interlockings (SSI), or track circuit hardware**.

### 2.5 Mandatory Human Governance (No Autonomous Authority)
- **Boundary**: RAILOPT AI is strictly an **AI Decision Support System (DSS)**. It **possesses no autonomous operational authority**.
- **Human-in-the-Loop**: No maintenance block plan can be issued, published, or executed without explicit authorization by a human **Control Officer** under RBAC credentials.
