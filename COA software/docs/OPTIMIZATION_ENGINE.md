# OPTIMIZATION ENGINE ARCHITECTURE — RAILOPT AI

## 1. Engine Overview

The optimization core of **RAILOPT AI** is powered by **Google OR-Tools CP-SAT Solver** (Constraint Programming - Satisfiability Modulo Theories). 

The engine models the multi-department joint railway block scheduling problem as a discrete Constraint Satisfaction and Optimization Problem (CSOP). It solves for optimal start/end times, spatial section allocations, and department task consolidations while strictly adhering to safety rules and traffic throughput requirements.

---

## 2. Mathematical Formulation

### 2.1 Decision Variables
For each maintenance task demand $i \in \{1, \dots, N\}$ on corridor section $s$:
- $S_i \in [T_{\text{start}}, T_{\text{end}}]$: Integer decision variable for the start time (in minutes from horizon start).
- $E_i = S_i + D_i$: Integer variable representing task end time ($D_i$ is task duration).
- $I_i = [S_i, E_i, D_i]$: Interval variable representing the maintenance possession window.
- $X_{ij} \in \{0, 1\}$: Binary decision variable indicating if task $i$ and task $j$ share a single consolidated block window.

### 2.2 Hard Constraints
1. **Time Horizon Bounds**:
   $$T_{\text{start}} \le S_i < E_i \le T_{\text{end}} \quad \forall i$$

2. **Spatial Section Isolation**:
   Tasks demanding the same track section $s$ during non-overlapping times must maintain minimum safety clearance $\Delta_{\text{clear}}$.

3. **Multi-Department Bundling Window**:
   Tasks assigned to a shared block $B_k$ must satisfy max block duration $D_{\text{max}}$:
   $$\max_{i \in B_k} (E_i) - \min_{i \in B_k} (S_i) \le D_{\text{max}}$$

4. **Train Protection Window**:
   No maintenance block interval $I_i$ may overlap with the scheduled passage window of high-priority passenger trains (Rajdhani / Shatabdi / Vande Bharat).

### 2.3 Soft Constraints & Penalties
1. **Delay Penalty**: Soft penalty applied if a task is scheduled past its preferred start time $P_i$.
2. **Setup Overhead Penalty**: Soft penalty for creating separate individual block possessions instead of consolidated joint blocks.

### 2.4 Objective Function
The CP-SAT solver maximizes the overall **Optimization Score**:

$$\text{Maximize } \mathcal{Z} = \sum_{k \in \text{Blocks}} \left( \lambda_1 \cdot \text{TasksBundled}(B_k) + \lambda_2 \cdot \text{TimeSaved}(B_k) \right) - \sum_{i=1}^N \mu_1 \cdot (S_i - P_i)^+ - \sum_{k} \mu_2 \cdot \text{SetupCost}(B_k)$$

Where:
- $\lambda_1 = 50.0$: Reward for cross-department co-location (ENG + SIG + TRC).
- $\lambda_2 = 2.0$: Reward for net track downtime saved (minutes).
- $\mu_1 = 0.5$: Penalty per minute of task start delay.
- $\mu_2 = 30.0$: Fixed penalty per individual block setup.

---

## 3. Feasibility & Unfeasible Plan Handling

### 3.1 Feasibility Resolution
When constraints permit, the CP-SAT solver outputs a deterministic schedule containing:
- Consolidated block windows $[S_k, E_k]$
- Bundled tasks list per department
- Calculated optimization score ($0 - 100$)

### 3.2 Unfeasible Plan Handling (No-Feasible-Plan Strategy)
If operational constraints (e.g. extreme traffic density combined with urgent safety demands) make a 100% compliant schedule mathematically impossible:
1. **Automated Constraint Relaxation**: The solver automatically relaxes soft priority bounds and expands allowed block duration limits in 15-minute increments.
2. **Conflict Alert Generation**: If no solution exists even after relaxation, the engine returns a structured **Unfeasible Plan Alert**:
   - Identifies conflicting train schedule IDs.
   - Recommends specific train rescheduling or speed restriction alternatives.
   - Highlights the unresolvable maintenance demand for human controller intervention.
