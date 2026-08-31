from typing import Dict, Any, Optional
from app.ai.features.asset_features import AssetRiskFeatures
from app.ai.models.base_risk_model import BaseRiskModel, RiskPredictionResult


class BaselineRiskModel(BaseRiskModel):
    """
    Transparent rule-based baseline risk model for synthetic demonstration data.
    Combines weighted asset health, defect history, overdue maintenance, inspection condition,
    age, criticality, and usage metrics.
    """

    @property
    def model_name(self) -> str:
        return "baseline-risk-v1"

    @property
    def model_version(self) -> str:
        return "1.0.0"

    DEFAULT_WEIGHTS = {
        "asset_age": 0.15,
        "health": 0.20,
        "failure_history": 0.15,
        "defects": 0.15,
        "overdue": 0.10,
        "inspection": 0.10,
        "criticality": 0.10,
        "usage": 0.05
    }

    HORIZON_FACTORS = {
        7: 0.88,
        30: 1.00,
        60: 1.10,
        90: 1.18
    }

    def predict(
        self,
        features: AssetRiskFeatures,
        horizon_days: int = 30,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> RiskPredictionResult:
        weights = custom_weights or self.DEFAULT_WEIGHTS

        # 1. Feature normalization mapping (0-100)
        norm_map = {
            "asset_age": (features.asset_age, features.asset_age_score),
            "health": (features.health_score, features.health_risk),
            "failure_history": (features.failure_count, features.failure_history_score),
            "defects": (features.defect_count, features.defect_risk),
            "overdue": (features.overdue_days, features.overdue_risk),
            "inspection": (features.inspection_score, features.inspection_risk),
            "criticality": (features.criticality, features.criticality),
            "usage": (features.usage_risk, features.usage_risk),
        }

        # 2. Calculate raw weighted contribution
        raw_score = 0.0
        breakdown: Dict[str, Dict[str, Any]] = {}

        for key, (raw_val, norm_val) in norm_map.items():
            w = weights.get(key, 0.0)
            contrib = round(norm_val * w, 2)
            raw_score += contrib
            
            # Determine severity per factor
            if norm_val >= 75:
                sev = "CRITICAL"
            elif norm_val >= 50:
                sev = "HIGH"
            elif norm_val >= 25:
                sev = "MEDIUM"
            else:
                sev = "LOW"

            breakdown[key] = {
                "factor_name": key,
                "raw_value": raw_val,
                "normalized_value": norm_val,
                "weight": w,
                "contribution": contrib,
                "severity": sev
            }

        # 3. Apply Prediction Horizon Factor
        h_factor = self.HORIZON_FACTORS.get(horizon_days, 1.0)
        final_score = round(min(100.0, max(0.0, raw_score * h_factor)), 1)

        # 4. Map Risk Level
        if final_score < 25.0:
            level = "LOW"
        elif final_score < 50.0:
            level = "MEDIUM"
        elif final_score < 75.0:
            level = "HIGH"
        else:
            level = "CRITICAL"

        # 5. Failure Probability (0.0 to 1.0 estimate for synthetic demo)
        # Scaled non-linearly to provide realistic demonstration probabilities
        if final_score >= 85.0:
            fail_prob = min(0.95, 0.70 + (final_score - 85.0) * 0.015)
        elif final_score >= 70.0:
            fail_prob = 0.50 + (final_score - 70.0) * 0.013
        elif final_score >= 50.0:
            fail_prob = 0.30 + (final_score - 50.0) * 0.01
        elif final_score >= 25.0:
            fail_prob = 0.12 + (final_score - 25.0) * 0.007
        else:
            fail_prob = max(0.02, final_score * 0.004)

        fail_prob = round(fail_prob, 2)

        # 6. Recommendation
        if level == "CRITICAL":
            rec = "Immediate engineering review recommended. Consider prioritizing maintenance and block planning."
        elif level == "HIGH":
            rec = "Prioritize inspection and schedule maintenance within the planning horizon."
        elif level == "MEDIUM":
            rec = "Increase monitoring frequency and review upcoming maintenance."
        else:
            rec = "Continue routine monitoring."

        # 7. Generate Explainability
        explanation = self.explain(features, final_score, level, breakdown, horizon_days)

        return RiskPredictionResult(
            risk_score=final_score,
            risk_level=level,
            failure_probability=fail_prob,
            model_name=self.model_name,
            model_version=self.model_version,
            horizon_days=horizon_days,
            factor_breakdown=breakdown,
            recommendation=rec,
            explanation=explanation
        )

    def explain(
        self,
        features: AssetRiskFeatures,
        risk_score: float,
        risk_level: str,
        breakdown: Dict[str, Dict[str, Any]],
        horizon_days: int
    ) -> str:
        # Sort factors by contribution descending
        top_factors = sorted(breakdown.values(), key=lambda x: x["contribution"], reverse=True)
        high_drivers = [f for f in top_factors if f["normalized_value"] >= 60.0]

        driver_names = []
        for d in high_drivers:
            name = d["factor_name"].replace("_", " ")
            driver_names.append(f"{name} ({d['normalized_value']}/100)")

        if driver_names:
            drivers_summary = ", ".join(driver_names[:3])
            text = (
                f"Asset {features.asset_code} is classified as {risk_level} risk ({risk_score:.1f}/100) "
                f"over a {horizon_days}-day horizon primarily due to elevated {drivers_summary}."
            )
        else:
            text = (
                f"Asset {features.asset_code} shows a {risk_level} risk score ({risk_score:.1f}/100) "
                f"with stable operational telemetry and no critical defect drivers over a {horizon_days}-day horizon."
            )

        if not features.inspection_available:
            text += " (Note: Inspection records were unavailable; conservative baseline defaults were utilized.)"

        return text
