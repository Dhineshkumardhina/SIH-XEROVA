from app.ai.models.base_risk_model import BaseRiskModel
from app.ai.models.baseline_risk_model import BaselineRiskModel
from app.ai.models.xgboost_risk_model import XGBoostRiskModel


class RiskModelFactory:
    """
    Factory for instantiating and selecting Asset Risk Prediction models.
    Default: 'baseline' (RuleBased BaselineRiskModel)
    """

    @staticmethod
    def get_model(name: str = "baseline") -> BaseRiskModel:
        name_lower = name.lower()
        if name_lower in ["baseline", "rule_based", "baseline-risk-v1"]:
            return BaselineRiskModel()
        elif name_lower in ["xgboost", "ml"]:
            return XGBoostRiskModel()
        raise ValueError(f"Unknown risk model '{name}'. Supported models: 'baseline', 'xgboost'")
