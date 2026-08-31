from typing import Dict, Any, Tuple
from app.ai.priority.base import BasePriorityModel

class RuleBasedPriorityModel(BasePriorityModel):
    @property
    def model_name(self) -> str:
        return "rule_based_priority"

    @property
    def model_version(self) -> str:
        return "1.0"

    def calculate(self, task_context: Dict[str, Any], weights: Dict[str, float] = None) -> Tuple[float, str, Dict[str, Any], str, str]:
        default_weights = {
            "asset_criticality": 0.25,
            "defect_severity": 0.20,
            "urgency": 0.15,
            "overdue_days": 0.15,
            "safety_impact": 0.10,
            "train_impact": 0.05,
            "failure_probability": 0.10,
            "maintenance_duration": 0.0,
            "operational_importance": 0.0
        }
        
        cfg = weights if weights is not None else default_weights
        
        # 1. Normalize Factors (0-100)
        
        factors = {}
        
        # Asset Criticality
        asset_crit_raw = task_context.get("asset_criticality")
        if asset_crit_raw is not None:
            factors["asset_criticality"] = {"raw": asset_crit_raw, "norm": float(asset_crit_raw)}
            
        # Defect Severity
        defect_sev_raw = task_context.get("defect_severity")
        if defect_sev_raw is not None:
            norm = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}.get(defect_sev_raw.upper(), 50)
            factors["defect_severity"] = {"raw": defect_sev_raw, "norm": float(norm)}
            
        # Urgency
        urgency_raw = task_context.get("urgency_raw")  # Usually "Due within X days" etc.
        urgency_score = task_context.get("urgency_score")
        if urgency_score is not None:
            factors["urgency"] = {"raw": urgency_raw, "norm": float(urgency_score)}
            
        # Overdue Days
        overdue_days = task_context.get("overdue_days")
        if overdue_days is not None:
            overdue_score = 0
            if overdue_days > 0:
                if overdue_days <= 3: overdue_score = 25
                elif overdue_days <= 7: overdue_score = 50
                elif overdue_days <= 14: overdue_score = 75
                else: overdue_score = 100
            factors["overdue_days"] = {"raw": overdue_days, "norm": float(overdue_score)}
            
        # Safety Impact
        safety_impact = task_context.get("safety_impact")
        if safety_impact is not None:
            norm = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}.get(safety_impact.upper(), 50)
            factors["safety_impact"] = {"raw": safety_impact, "norm": float(norm)}
            
        # Train Impact
        train_impact = task_context.get("train_impact")
        if train_impact is not None:
            norm = {"NONE": 0, "LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}.get(train_impact.upper(), 50)
            factors["train_impact"] = {"raw": train_impact, "norm": float(norm)}
            
        # Failure Probability
        fail_prob = task_context.get("failure_probability")
        if fail_prob is not None:
            # Assume 0.0 - 1.0 or 0-100. Let's assume 0.0-1.0 from risk engine.
            if fail_prob <= 1.0:
                norm = fail_prob * 100
            else:
                norm = fail_prob
            factors["failure_probability"] = {"raw": fail_prob, "norm": float(norm)}
            
        # Operational Importance
        op_imp = task_context.get("operational_importance")
        if op_imp is not None:
            norm = {"LOW": 25, "MEDIUM": 50, "HIGH": 75, "CRITICAL": 100}.get(op_imp.upper(), 50)
            factors["operational_importance"] = {"raw": op_imp, "norm": float(norm)}
            
        # Maintenance Duration
        duration = task_context.get("maintenance_duration")
        if duration is not None:
            norm = min((duration / 240.0) * 100, 100.0) # Assume 4 hours is max weight.
            factors["maintenance_duration"] = {"raw": duration, "norm": float(norm)}
            
        # 2. Redistribute Weights for Missing Factors
        active_weights = {}
        missing_weight_sum = 0.0
        
        for k, v in cfg.items():
            if k in factors:
                active_weights[k] = v
            else:
                missing_weight_sum += v
                
        # Proportional redistribution
        total_active_original = sum(active_weights.values())
        if total_active_original > 0 and missing_weight_sum > 0:
            for k in active_weights:
                active_weights[k] += (active_weights[k] / total_active_original) * missing_weight_sum
                
        # 3. Calculate Score
        final_score = 0.0
        breakdown = {}
        
        for k, data in factors.items():
            weight = active_weights.get(k, 0.0)
            contrib = data["norm"] * weight
            final_score += contrib
            breakdown[k] = {
                "raw_value": data["raw"],
                "normalized_value": data["norm"],
                "weight": weight,
                "contribution": contrib
            }
            
        final_score = min(max(final_score, 0.0), 100.0)
        
        # 4. Determine Priority Level
        if final_score < 25:
            level = "LOW"
        elif final_score < 50:
            level = "MEDIUM"
        elif final_score < 75:
            level = "HIGH"
        else:
            level = "CRITICAL"
            
        # Override safety
        if safety_impact == "CRITICAL" and level != "CRITICAL":
            level = "CRITICAL"
            final_score = max(final_score, 75.0)
            
        # 5. Recommendation
        is_completed = task_context.get("status") in ["COMPLETED", "CANCELLED"]
        
        if is_completed:
            recommendation = "Task completed or cancelled. No further scheduling recommendation."
        elif safety_impact == "CRITICAL":
            recommendation = "Immediate review required due to critical safety impact."
        elif final_score >= 85:
            recommendation = "Schedule this task at the earliest feasible maintenance window."
        elif final_score >= 70:
            recommendation = "Prioritize within the next available suitable maintenance window."
        elif final_score >= 50:
            recommendation = "Plan maintenance within the current planning horizon."
        elif final_score >= 25:
            recommendation = "Monitor and schedule according to available capacity."
        else:
            recommendation = "Routine scheduling is appropriate."
            
        # 6. Explanation
        sorted_factors = sorted(breakdown.items(), key=lambda x: x[1]["contribution"], reverse=True)
        
        exp = f"PRIORITY: {final_score:.2f} / 100 ({level})\n\nWHY?\n"
        for i, (k, d) in enumerate(sorted_factors[:5]):
            friendly_name = k.replace("_", " ").title()
            exp += f"{i+1}. {friendly_name} contribution: {d['contribution']:.2f} (Norm: {d['normalized_value']:.1f})\n"
            
        exp += f"\nRECOMMENDATION:\n{recommendation}"
        
        return final_score, level, breakdown, recommendation, exp
