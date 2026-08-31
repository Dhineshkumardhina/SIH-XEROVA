# RAILOPT AI — Mathematical Optimization & OR-Tools Solver
**Smart India Hackathon (SIH) — Mixed-Integer Programming Formulation**
*Demonstration Environment • Synthetic Railway Operations Data*

---

## 1. Problem Formulation

Railway maintenance block allocation is a multi-objective combinatorial optimization problem. RAILOPT AI employs **Google OR-Tools CP-SAT (Constraint Programming — Satisfiability)** to find mathematically optimal block windows.

---

## 2. Mathematical Model

### 2.1 Sets & Indices
- $T = \{1, \dots, N\}$: Set of pending maintenance tasks across Engineering, S&T, and Traction departments.
- $W = \{1, \dots, M\}$: Set of candidate track possession windows (traffic lulls identified in the timetable).
- $C = \{1, \dots, K\}$: Set of railway corridors.
- $D = \{\text{ENG}, \text{SNT}, \text{TRC}\}$: Set of railway departments.

### 2.2 Decision Variables
- $x_{t, w} \in \{0, 1\}$: Binary variable $= 1$ if task $t$ is scheduled in window $w$, else $0$.
- $y_{w} \in \{0, 1\}$: Binary variable $= 1$ if window $w$ is activated as a coordinated maintenance block.
- $z_{w, d} \in \{0, 1\}$: Binary variable $= 1$ if department $d$ participates in block window $w$.

### 2.3 Objective Function
$$\text{Maximize } Z = \alpha \sum_{t \in T} \sum_{w \in W} P_t \cdot x_{t, w} + \beta \sum_{w \in W} \left( \sum_{d \in D} z_{w, d} - 1 \right) \cdot y_w - \gamma \sum_{w \in W} \text{DelayImpact}(w) \cdot y_w - \delta \sum_{w \in W} \text{Duration}(w) \cdot y_w$$

Where:
- $\alpha$: Weight on high-priority maintenance coverage ($P_t$ is task priority score $0–100$).
- $\beta$: Reward bonus for multi-department shadow bundling in the same window.
- $\gamma$: Penalty on total simulated passenger train delay minutes.
- $\delta$: Penalty on total corridor downtime.

---

## 3. Operational Constraints

1. **Window Duration Capacity**:
   $$\sum_{t \in T, \text{Corridor}(t)=c} \text{Duration}_t \cdot x_{t, w} \le \text{MaxCapacity}_w \quad \forall w \in W$$

2. **Single Assignment**:
   $$\sum_{w \in W} x_{t, w} \le 1 \quad \forall t \in T$$

3. **Multi-Department Activation Linkage**:
   $$z_{w, d} \ge x_{t, w} \quad \forall t \in T \text{ with Department}(t)=d, \forall w \in W$$

4. **Corridor Spatial Non-Overlap**:
   Two concurrent blocks cannot occupy the same track segment on corridor $c$:
   $$y_{w_1} + y_{w_2} \le 1 \quad \forall (w_1, w_2) \text{ overlapping in time and track segment}$$

5. **Traction Power Isolation Boundary**:
   If a task requires OHE power isolation on corridor $c$, all diesel or electric movements on that feeding section must either be rerouted or halted during window $w$.

---

## 4. Infeasibility & Conflict Handling

If no feasible window exists that satisfies all safety constraints:
1. The solver flags `STATUS: INFEASIBLE`.
2. Identifies the conflicting bottleneck constraint (e.g. *"Window duration 90m insufficient for ballast tamping demand of 150m without violating Express 12001 headway"*).
3. Suggests relaxation strategies to the human planner (e.g. *"Shift block start by +45 minutes to utilize subsequent freight lull"*).
