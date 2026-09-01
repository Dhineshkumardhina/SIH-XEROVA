# AI ARCHITECTURE & DECISION SUPPORT — RAILOPT AI

## 1. AI Architecture Overview

**RAILOPT AI** employs a hybrid artificial intelligence architecture combining multi-criteria heuristic scoring models, baseline statistical machine learning models, and rule-based risk engines.

To maintain strict scientific transparency and avoid unsupported claims, AI capabilities are categorized into three distinct tiers:
1. **Active Rule-Based Heuristic Engines** (Production Active)
2. **Active Baseline ML Models** (Production Active)
3. **Future Production ML Models** (Roadmap Planned)

```
+-------------------------------------------------------------------------+
|                         AI DECISION SUPPORT HUB                         |
+-------------------------------------------------------------------------+
       │                                     │
       ▼                                     ▼
+-----------------------------+   +---------------------------------------+
|  RISK & PRIORITY MODELS     |   |   EXPLAINABILITY & ADVISORY           |
| • Asset Health Scoring      |   | • Natural Language Explanations       |
| • Task Urgency Matrix       |   | • Conflict Root-Cause Analysis        |
| • Train Delay Impact        |   | • Multi-Department Synergy Score      |
+-----------------------------+   +---------------------------------------+
```

---

## 2. Model Implementation Breakdown

### 2.1 Asset Health & Failure Risk Model
- **Active Type**: Hybrid (Rule-Based Physics & Baseline Statistical Regression).
- **Function**: Computes an Asset Health Score ($H_a \in [0, 100]$) and Failure Probability ($P_{\text{fail}}$).
- **Formulation**:
  $$H_a = 100 - \left( \alpha \cdot \text{AgeRatio} + \beta \cdot \text{DefectSeverity} + \gamma \cdot \text{UsageIntensity} \right)$$
  Where:
  - $\text{AgeRatio} = \frac{\text{Current Age}}{\text{Design Codal Life}}$
  - $\text{DefectSeverity}$ = Weighted sum of unresolved TMS/SMMS/TDMS defects ($10 \times \text{Critical} + 3 \times \text{Major} + 1 \times \text{Minor}$)
  - $\text{UsageIntensity}$ = Daily GMT (Gross Million Tonnes) or point operation count.

### 2.2 Task Priority Indexing Model
- **Active Type**: Multi-Criteria Decision Analysis (MCDA Rule-Based).
- **Function**: Ranks pending maintenance tasks across Engineering, S&T, and Traction departments.
- **Formulation**:
  $$\text{PriorityScore} = w_1 \cdot \text{SafetyRisk} + w_2 \cdot \text{OverdueDays} + w_3 \cdot \text{AssetCriticality} + w_4 \cdot \text{TrafficDensity}$$
  - Safety Risk ($0 - 40$ pts): Derived from defect severity.
  - Overdue Penalty ($0 - 30$ pts): Exponential scaling for tasks past scheduled maintenance windows.
  - Asset Criticality ($0 - 20$ pts): Strategic corridor importance rating.
  - Traffic Density ($0 - 10$ pts): Number of daily passenger/freight services on section.

### 2.3 Train Delay Impact Predictor
- **Active Type**: Kinematic Simulation Heuristic.
- **Function**: Estimates passenger and freight train delays caused by proposed track possession windows.
- **Methodology**: Calculates headway compression on adjacent single/double line sections during block duration $T_b$. Computes total delay $D_{\text{total}} = \sum_{t \in \text{Trains}} \Delta t_{\text{delay}}$.

### 2.4 AI Explainability & Advisory Engine
- **Active Type**: Template-Guided Rule Synthesizer.
- **Function**: Converts raw solver outputs and risk scores into plain, human-understandable operational advice for railway control officers.
- **Outputs**:
  - *"Recommending joint possession block on Section B-C: Bundles 2 Engineering track tamping tasks and 1 S&T signal overhaul into a single 120-minute window, saving 90 minutes of total corridor downtime."*

---

## 3. Classification Tier Matrix

| AI Subsystem | Rule-Based Heuristic | Baseline ML | Future ML Roadmap |
| :--- | :---: | :---: | :---: |
| **Asset Risk Scoring** | ✅ Active | ✅ Active (LogReg) | 🔮 LSTM / XGBoost (Vibration Telemetry) |
| **Task Priority Indexing** | ✅ Active | ❌ | 🔮 Reinforcement Learning (RL Priority) |
| **Conflict Detection** | ✅ Active | ❌ | 🔮 Real-Time Spatial Graph Neural Net |
| **Train Delay Predictor** | ✅ Active | ✅ Active (Linear) | 🔮 Deep Recurrent Delay Predictor |
| **Explainability Engine** | ✅ Active | ❌ | 🔮 LLM Operational Assistant |
