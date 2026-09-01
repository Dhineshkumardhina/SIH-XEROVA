# SIH 3-TO-5 MINUTE DEMO PRESENTATION GUIDE — RAILOPT AI

## 1. Executive Storyboard Strategy

**Core Pitch Message**:
> **"ONE CORRIDOR → ONE INTELLIGENT BLOCK → MULTIPLE MAINTENANCE ACTIVITIES"**

**RAILOPT AI** solves Indian Railways' siloed maintenance problem by consolidating isolated Track (TMS), Signal (SMMS), and Traction (TDMS) block demands onto a single track section using AI risk scoring and the **Google OR-Tools CP-SAT Solver**, reducing daily corridor downtime from **4.5 hours down to 2.0 hours** with zero passenger train delays.

---

## 2. 3-Minute Presentation Timed Script

| Time Slot | Demo Stage | Screen / Route | Action & Presenter Script |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:20** | **01 DATA (Problem)** | `/demo` | **Script**: *"Honorable judges, maintenance planning in Indian Railways is currently distributed across isolated silos—TMS for track, SMMS for signals, and TDMS for traction overhead lines. Uncoordinated, these create 3 separate daily track closures totaling 4.5 hours."*<br>**Action**: Highlight Problem Visual on `/demo`. |
| **0:20 – 0:45** | **02 MAINTENANCE** | `/maintenance` | **Script**: *"RAILOPT AI ingests all demands into a Unified Data Model (CRDM). Our AI Priority Engine scores task criticality, safety risks, and overdue days, flagging high-risk assets."*<br>**Action**: Filter overdue/critical tasks. |
| **0:45 – 1:10** | **03 TRAINS & 04 CORRIDOR** | `/trains` & `/corridors` | **Script**: *"Here we monitor passenger/goods train density along Corridor COR-A01. The system automatically identifies available low-density track windows."*<br>**Action**: Show corridor timeline available windows. |
| **1:10 – 1:30** | **05 BLOCKS (Requests)** | `/blocks/requests` | **Script**: *"Without orchestration, individual department requests total 4.5 hours of fragmented occupation. We now trigger our AI Planner."*<br>**Action**: Click `GENERATE AI PLAN`. |
| **1:30 – 2:00** | **07 OPTIMIZATION** | `/planner/optimization-result` | **Script**: *"In under 1 second, Google OR-Tools CP-SAT solver computes an optimal joint block window, bundling Track, S&T, and OHE tasks into 1 shared block. We also present feasible Option A, B, and C alternatives."*<br>**Action**: Review solver metrics & options. |
| **2:00 – 2:25** | **08 DIGITAL TWIN** | `/simulation/digital-twin` | **Script**: *"We verify safety in our Corridor Digital Twin, modeling 1D train kinematics and automatic signal aspect protection (Red/Yellow/Green) in real time."*<br>**Action**: Click `PLAY` on digital twin simulator. |
| **2:25 – 2:50** | **09 BEFORE VS AFTER** | `/simulation/results` | **Script**: *"Here is our quantitative impact: Track downtime cut from 4.5 hours to 2.0 hours (+150m saved per day), achieving 98.5/100 optimization score with 0 train delays."*<br>**Action**: Inspect Before vs After KPI visual. |
| **2:50 – 3:00** | **10 HUMAN APPROVAL** | `/blocks/approved` | **Script**: *"Finally, human control is strictly preserved. The Chief Control Officer authorizes the plan under RBAC credentials, generating an immutable audit token."*<br>**Action**: Click `APPROVE` and show audit token. |

---

## 3. UI Navigation Shortcuts & Controls

- **Demo Entry Point**: `/demo` (or click `SIH DEMO HUB` in header).
- **Scenario Loader**: Click `LOAD SIH DEMO SCENARIO` to calculate live CP-SAT results.
- **Guided Dock**: Use `NEXT STEP` / `BACK` or click pills `01` through `10`.
- **Role Switcher**: Click `Chief Control Officer`, `Engineering`, `Signal`, `Traction`, or `Viewer` to demonstrate authentic RBAC backend guards.
