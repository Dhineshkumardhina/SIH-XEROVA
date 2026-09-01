# DATA FLOW ARCHITECTURE — RAILOPT AI

## 1. End-to-End Operational Pipeline

The data pipeline in **RAILOPT AI** transforms raw, uncoordinated multi-department data feeds into optimized, human-verified, and digitally simulated joint maintenance block schedules.

```
+-----------------------------------------------------------------------+
|                       LEGACY SYSTEM DATA FEEDS                        |
|   TMS (Track)  •  SMMS (Signal)  •  TDMS (OHE)  •  COA (Timetables)   |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                          INTEGRATION LAYER                            |
|       Legacy Ingestion Adapters & Data Translation Protocols          |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                    UNIFIED DATA MODEL (CRDM HUB)                      |
|      Standardized Spatial-Temporal Track Infrastructure Schema        |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                          AI ENGINE PIPELINE                           |
|       Asset Risk Scoring  •  Task Priority Indexing  •  Conflicts     |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                      OPTIMIZATION SOLVER ENGINE                       |
|        Google OR-Tools CP-SAT Constraint Programming Solver           |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                        RECOMMENDED BLOCK PLAN                         |
|        Bundled Multi-Department Possession Windows Generated          |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                       HUMAN APPROVAL (RBAC)                           |
|         Chief Control Officer Authorization & Digital Audit Log       |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                    DIGITAL TWIN SIMULATION ENGINE                     |
|          Kinematic Train Movements & What-If Impact Analysis          |
+-----------------------------------------------------------------------+
                                   │
                                   ▼
+-----------------------------------------------------------------------+
|                   ANALYTICS & AUDIT REGISTER                          |
|         KPI Dashboards  •  Before vs After Metrics  •  Reports         |
+-----------------------------------------------------------------------+
```

---

## 2. Pipeline Phase Details

### Phase 1: Ingestion & Normalization
- **TMS Feed**: Track Geometry Index (TGI), rail wear measurements, sleeper ballast health, defect logs.
- **SMMS Feed**: Point machine operation counts, track circuit voltage telemetry, signal bulb hours.
- **TDMS Feed**: Overhead Equipment (OHE) contact wire wear, isolator switch status, substation load.
- **COA & Freight Feed**: Scheduled passenger timetables, active train positions, goods train dispatch forecasts.
- **Normalizer**: Standardizes raw payloads into uniform JSON structures and persists to PostgreSQL CRDM tables.

### Phase 2: AI Analytics & Priority Indexing
- **Asset Risk Engine**: Computes asset health score ($0 - 100$) and failure probability based on age, usage, and recent defect logs.
- **Task Urgency Weighting**: Calculates composite priority scores ($P_i$) using equation:
  $$P_i = (w_{\text{safety}} \cdot S_i) + (w_{\text{overdue}} \cdot D_i) + (w_{\text{traffic}} \cdot T_i)$$
- **Conflict Identification**: Detects spatial-temporal overlap between pending maintenance tasks and scheduled high-priority passenger trains.

### Phase 3: Mathematical Optimization (CP-SAT)
- **Input Payload**: Corridor section ID, time window $[T_{\text{start}}, T_{\text{end}}]$, list of maintenance demands, train headway bounds.
- **Solver Execution**: CP-SAT solver optimizes joint block windows by grouping overlapping spatial demands onto common track sections.
- **Output Result**: Returns bundled block recommendations, start/end times, allocated maintenance teams, and optimization score ($0 - 100$).

### Phase 4: Human Governance & Approval
- **RBAC Check**: Recommended plans are submitted to the **Control Officer** approval queue.
- **Action Logging**: Upon authorization (`APPROVE` action), an immutable audit token (`AUD-XXXXXX`) is minted, recording timestamp, user ID, role, and approval status.

### Phase 5: Digital Twin Simulation & Verification
- **Kinematic Replay**: Evaluates approved block plans against live train schedules.
- **KPI Generation**: Computes total track downtime saved (minutes), train delays avoided, and asset availability gain.
