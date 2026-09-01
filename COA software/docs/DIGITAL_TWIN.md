# CORRIDOR DIGITAL TWIN SIMULATOR — RAILOPT AI

## 1. Digital Twin Overview

The **Corridor Digital Twin** is an interactive, physics-based kinematic simulation engine built directly into **RAILOPT AI**. 

It provides railway control officers and judges with a real-time 1D spatial simulation of corridor train movements, signal block aspects, and active maintenance possession blocks.

```
+------------------------------------------------------------------------+
|                      CORRIDOR DIGITAL TWIN ENGINE                      |
+------------------------------------------------------------------------+
     │                                                              │
     ▼                                                              ▼
[Kinematic Train Simulator]                       [Possession Block Overlay]
 • 1D Physics Motion (v, a, d)                    • Multi-Dept Tasks (ENG, SIG, TRC)
 • Signal Aspect Protection (Red/Green)           • Track Downtime & Release Timers
     │                                                              │
     └──────────────────────────────┬───────────────────────────────┘
                                    │
                                    ▼
                      [Live KPI & Conflict Monitor]
                       • Train Delay Accumulated
                       • Spatial Headway Conflicts
                       • Asset Availability %
```

---

## 2. Physics & Simulation Mechanics

### 2.1 Kinematic Train Physics
For each simulated train $k$ operating along track coordinate $x(t)$:
- **Acceleration & Deceleration**: Models realistic train acceleration $a_{\text{accel}} = 0.5 \text{ m/s}^2$ and service braking $a_{\text{brake}} = -0.8 \text{ m/s}^2$.
- **Speed Restrictions**: Enforces maximum section speed limits $V_{\text{max}}$ (e.g. $110 \text{ km/h}$ passenger, $60 \text{ km/h}$ freight) and temporary speed restrictions (TSR) in active work zones.

### 2.2 Signal Block Interlocking
- **Automatic Block Aspect Rule**:
  - **Green (Clear)**: Ahead block sections unoccupied.
  - **Yellow (Caution)**: Next block occupied; train decelerates to target speed $V_{\text{caution}}$.
  - **Red (Stop)**: Block section occupied by maintenance possession or preceding train; train halts completely before signal boundary.

### 2.3 Interactive Playback Controls
- **Clock Execution**: Supports real-time simulation clock ticking with step increments ($+5\text{ mins}$) and variable playback speeds ($1.0\times, 2.0\times, 5.0\times, 10.0\times$).
- **API Endpoints**:
  - `POST /api/v1/simulation/run`: Launch simulation scenario.
  - `POST /api/v1/simulation/step`: Advance simulation clock by $\Delta t$.
  - `POST /api/v1/simulation/reset`: Reset simulation state to baseline.

---

## 3. What-If Scenario Builder

The Digital Twin includes a **What-If Scenario Simulator** allowing users to create custom operational snapshots, modify parameters, and compare consequences prior to publishing:
- **Scenario Parameters**:
  - Adjust maintenance block duration ($\pm 30\text{m}$).
  - Inject unexpected train delay ($+15\text{m}$ to $+60\text{m}$).
  - Change train priority rankings.
- **Before vs After KPI Comparison**: Quantitative comparison of manual sequential maintenance versus AI optimized shared maintenance block plans.
