# RAILOPT AI — Smart India Hackathon (SIH) Live Demo Guide
**Official 7-Minute Judge Presentation & Evaluation Flow**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Demonstration Setup & Prerequisites

1. Ensure the platform is running:
   ```bash
   docker compose up -d
   # Or local dev: uvicorn (port 8000) & npm run dev (port 5173 / 3000)
   ```
2. Open browser at: [http://localhost:3000](http://localhost:3000) (or `http://localhost:5173`).
3. Have judge evaluation sheet ready.

---

## 2. Step-by-Step 7-Minute Demonstration Script

```text
================================================================================
TIME    | STEP & ACTION                 | NARRATION & KEY TALKING POINTS
================================================================================
0:00    | Step 1: Login                 | Log in as 'control' (Chief Controller).
        |                               | Point out 3-tier RBAC & account lockout safety.
--------------------------------------------------------------------------------
0:45    | Step 2: Executive Dashboard   | Show real-time KPI cards (Corridor Availability,
        |                               | Overdue Maintenance by Dept, Critical Rail Flaws).
        |                               | Highlight: "Notice 3 departments have uncoordinated
        |                               | demands on the New Delhi-Kanpur trunk corridor."
--------------------------------------------------------------------------------
1:30    | Step 3: CRDM Asset Health     | Navigate to 'Assets' -> Filter by 'CRITICAL'.
        |                               | Open Asset TRK-1002. Show 7-Factor AI Priority
        |                               | scoring breakdown (Score: 89.4 / 100) and defect history.
--------------------------------------------------------------------------------
2:30    | Step 4: Multi-Horizon Planner | Navigate to 'AI Planner' -> Select 'Daily Plan'.
        |                               | Show raw demands: 3 separate blocks totaling 300 mins
        |                               | of downtime.
--------------------------------------------------------------------------------
3:15    | Step 5: Run OR-Tools Optimizer| Click 'GENERATE OPTIMIZED BLOCK PLAN'.
        |                               | Show real Google OR-Tools CP-SAT solver executing
        |                               | in ~350ms.
        |                               | Highlight: "The AI bundled Engineering Tamping +
        |                               | S&T Point Machine + Traction OHE wire into ONE
        |                               | 120-minute shadow window from 01:15 to 03:15 AM."
--------------------------------------------------------------------------------
4:30    | Step 6: Train Impact & Delays | Open 'Train Impact Panel'.
        |                               | Show simulated passenger timetable deltas.
        |                               | Delay reduced by 68% compared to separate blocks.
--------------------------------------------------------------------------------
5:30    | Step 7: Digital Twin & What-If| Navigate to 'Simulation' -> Step virtual clock.
        |                               | Show trains regulating safely around the active block.
        |                               | Run What-If comparison against baseline.
--------------------------------------------------------------------------------
6:15    | Step 8: Control Officer Signoff| Navigate to 'Block Approvals'.
        |                               | Approve the coordinated block. Show audit trail log.
--------------------------------------------------------------------------------
6:45    | Step 9: PDF Operations Report | Navigate to 'Reports' -> Generate Daily Block Plan PDF.
        |                               | Download and open official Indian Railways format report.
================================================================================
```

---

## 3. High-Impact Pitch Summary to Judges
> *"Gentlemen, in Indian Railways today, 3 separate departments take 3 separate blocks on the same track, crippling line capacity. RAILOPT AI transforms this with one powerful principle: **ONE CORRIDOR $\to$ ONE INTELLIGENT BLOCK $\to$ MULTIPLE MAINTENANCE ACTIVITIES**."*
