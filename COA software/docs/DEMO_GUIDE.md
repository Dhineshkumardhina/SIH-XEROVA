# SIH DEMONSTRATION & PITCH GUIDE — RAILOPT AI

## 1. Demonstration Strategy & Pitch Story

**RAILOPT AI** is presented to Smart India Hackathon (SIH) judges as an operational solution to Indian Railways' core challenge: **fragmented multi-department maintenance scheduling causing excessive train delays and uncoordinated track possessions.**

### Key Storyline:
1. **The Problem**: Currently, Engineering (TMS), Signal (SMMS), and Electrical (TDMS) departments apply for maintenance blocks in isolated silos. This causes up to **270 minutes of total daily corridor downtime** and severe passenger train delays.
2. **The Solution**: RAILOPT AI ingests all demands into a unified **CRDM Hub**, applies AI risk scoring, runs the **Google OR-Tools CP-SAT Solver** to bundle overlapping maintenance demands onto a single track section, and proves zero-delay safety in the **Corridor Digital Twin**.
3. **The Result**: Cuts corridor downtime from **270 minutes down to 120 minutes** (saving 150 minutes of track availability per day) while maintaining 100% human control via Control Officer RBAC approval.

---

## 2. 10-Step Guided Presentation Workflow

Use the interactive **SIH Demo Navigation Bar** (enabled via `DEMO MODE ON` in top navigation) to guide judges step-by-step:

```
[1. COMMAND CENTER] ➔ [2. MAINTENANCE] ➔ [3. TRAIN OPERATIONS] ➔ [4. CORRIDOR] ➔ [5. BLOCK REQUESTS]
         │
         ▼
[6. AI ANALYSIS] ➔ [7. OPTIMIZATION] ➔ [8. SIMULATION] ➔ [9. BEFORE/AFTER] ➔ [10. APPROVAL]
```

### Detailed Step Script:

1. **Step 1: COMMAND CENTER (`/dashboard`)**:
   - *Script*: "Welcome to RAILOPT AI Executive Situation Room. Here, controllers get a live overview of corridor health, overdue tasks, active block plans, and real-time operational feeds."
2. **Step 2: MAINTENANCE (`/maintenance`)**:
   - *Script*: "Here we view raw maintenance demands across Track (TMS), Signals (SMMS), and OHE Traction (TDMS), highlighting overdue tasks."
3. **Step 3: TRAIN OPERATIONS (`/trains`)**:
   - *Script*: "This tab monitors passenger and freight train movements along trunk corridors, tracking active delays."
4. **Step 4: CORRIDOR (`/corridors`)**:
   - *Script*: "Corridors view illustrates track section topologies (STN-A to STN-E) and section availability percentages."
5. **Step 5: BLOCK REQUESTS (`/blocks/requests`)**:
   - *Script*: "Departments submit individual possession block demands here. Uncoordinated, these would cause 3 separate line blocks today."
6. **Step 6: AI ANALYSIS (`/ai`)**:
   - *Script*: "Our AI engine scores failure risks, calculates task urgency weights, and flags spatial-temporal conflicts."
7. **Step 7: OPTIMIZATION (`/planner/optimization-result`)**:
   - *Script*: "We invoke Google OR-Tools CP-SAT solver. In under 1 second, it consolidates 3 separate department demands into 1 shared block window."
8. **Step 8: SIMULATION (`/simulation/digital-twin`)**:
   - *Script*: "We load the Digital Twin simulator to model train kinematics and verify signal block aspect protection in real-time."
9. **Step 9: BEFORE / AFTER (`/simulation/results`)**:
   - *Script*: "Here is our quantitative impact: Track downtime reduced from 270 minutes to 120 minutes (+150m saved), with 0 train delays incurred."
10. **Step 10: APPROVAL (`/blocks/approved`)**:
    - *Script*: "Finally, the Chief Control Officer authorizes the plan under RBAC authority, minting a tamper-evident audit token."

---

## 3. Presentation Safety Rules

1. **Live Backend Data Integrity**: Every step fetches actual data from the FastAPI backend. No fake mock overrides are used.
2. **Retry Capability**: If a network glitch occurs during a live presentation, click **`RETRY BACKEND FETCH`** on the red warning banner to resume instantly.
3. **Uninhibited Navigation**: Judges can request to inspect any page out of order by clicking step pills directly or using the sidebar.
