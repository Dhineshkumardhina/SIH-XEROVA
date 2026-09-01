# RAILOPT AI — PHASE 31.5: SIH PRESENTATION MODE & DEMO NAVIGATION

## 1. Executive Summary

Phase 31.5 introduces **SIH Presentation Mode**, a specialized, presentation-friendly guided navigation framework designed for live Smart India Hackathon (SIH) judge demonstrations. 

The feature provides a sleek, subtle, and non-intrusive navigation dock that guides presenters step-by-step through the end-to-end multi-department railway block optimization flow while maintaining strict adherence to real application data fetching and error safety.

---

## 2. Key Architecture & Principles

1. **Guided Demo Control Dock (`DemoGuidedNav.tsx`)**:
   - Fixed docked navigation bar at the bottom of the screen when Demo Mode is active.
   - Professional dark glassmorphism styling (`bg-slate-950/95 border-t border-blue-500/40 backdrop-blur-md`).
   - Displays **Current Step**, **Completed Steps** count & progress percentage, and **Next Step** preview.

2. **Uninhibited Normal Navigation**:
   - The user/judge can still navigate freely using sidebar links, top navigation header, tabs, or step pills.
   - Automatically syncs demo step state with the current URL route (`useDemoStore.syncWithRoute`).

3. **No Fake Results Policy**:
   - Every step loads actual application data from the backend APIs (`/api/v1/...`).
   - No mock/fake overrides or hardcoded success fallbacks.

4. **Presentation Safety (Error Handling & Retry)**:
   - If a backend service temporarily fails or encounters network latency, an inline alert banner appears with exact error details.
   - Includes a one-click **RETRY BACKEND FETCH** button to attempt data retrieval without interrupting the presentation flow.

---

## 3. 10-Step Demonstration Workflow

| Step # | Step Name | Target Route | Description / Focus Area |
| :--- | :--- | :--- | :--- |
| **1** | **COMMAND CENTER** | `/dashboard` | Executive Command Center & Multi-Department Situation Room |
| **2** | **MAINTENANCE** | `/maintenance` | Track (ENG), Signal (S&T), and Overhead (OHE) Schedules |
| **3** | **TRAIN OPERATIONS** | `/trains` | Live Train Movements, Timetables & Delay Metrics |
| **4** | **CORRIDOR** | `/corridors` | Corridor Section Topologies & Capacity Availability |
| **5** | **BLOCK REQUESTS** | `/blocks/requests` | Cross-Department Maintenance Possession Requests |
| **6** | **AI ANALYSIS** | `/ai` | AI Conflict Risk Scoring & Smart Bundling Engine |
| **7** | **OPTIMIZATION** | `/planner/optimization-result` | Google OR-Tools CP-SAT Shared Block Solver & Schedule |
| **8** | **SIMULATION** | `/simulation/digital-twin` | Digital Twin Kinematic Train Movement Simulator |
| **9** | **BEFORE / AFTER** | `/simulation/results` | Quantitative Before vs After Delay Avoidance & KPI Comparison |
| **10** | **APPROVAL** | `/blocks/approved` | Control Officer RBAC Authorization & Audit Trail Log |

---

## 4. Quick Navigation Controls

The guided control dock features three dedicated quick-action controls:

- **NEXT DEMO STEP**: Advances to the next sequential step, marks the current step completed, and navigates to the target page. On step 10, displays **FINISH DEMO**.
- **PREVIOUS**: Reverts to the previous step in the sequence (disabled on Step 1).
- **EXIT DEMO**: Turns off Demo Mode and hides the bottom dock, returning to standard navigation mode.

In addition, a **`DEMO MODE ON` / `ENABLE DEMO MODE`** pill toggle is integrated directly into the `TopNavigation` header bar for instant access.

---

## 5. Technical Implementation Details

### State Management (`frontend/src/store/demoStore.ts`)
- **`isDemoActive`**: Boolean flag indicating if presentation mode is active (persisted in `localStorage`).
- **`currentStepIndex`**: Index `0..9` representing the active step.
- **`completedSteps`**: Set of completed step indices for visual tracking.
- **`stepError`**: Error message string populated if backend requests fail.
- **Actions**: `toggleDemoMode`, `nextStep`, `prevStep`, `goToStep`, `syncWithRoute`, `setStepError`, `retryCurrentStep`.

### Layout Integration (`frontend/src/components/layout/AppLayout.tsx`)
- Renders `<DemoGuidedNav />` at the application root shell.
- Adds dynamic padding (`pb-24`) to `<main>` content when Demo Mode is active so page elements are never obscured by the bottom dock bar.
- Listens to `useLocation()` to keep step selection in sync when users click sidebar links directly.

---

## 6. Presenter Workflow Checklist

1. Click **`ENABLE DEMO MODE`** in the top navigation header bar (or launch app with default demo state).
2. Use **NEXT DEMO STEP** to advance smoothly through the story:
   - *Command Center → Maintenance → Trains → Corridor → Requests → AI Analysis → Solver → Digital Twin → Before/After → Approval*.
3. Click any individual **Step Pill (1..10)** on the dock bar if jumping directly to answer a judge's question.
4. If a backend service drops offline during a presentation, click **RETRY BACKEND FETCH** on the red error banner once connection restores.
5. Click **EXIT DEMO** or **FINISH DEMO** at the conclusion of the presentation.
