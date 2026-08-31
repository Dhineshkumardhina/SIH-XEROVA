from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
from app.ai.features.asset_features import AssetRiskFeatures


@dataclass
class RiskPredictionResult:
    risk_score: float                # 0.0 - 100.0
    risk_level: str                  # LOW, MEDIUM, HIGH, CRITICAL
    failure_probability: float       # 0.0 - 1.0
    model_name: str
    model_version: str
    horizon_days: int
    factor_breakdown: Dict[str, Dict[str, Any]]
    recommendation: str
    explanation: str


class BaseRiskModel(ABC):
    """
    Abstract Base Class for Asset Risk Prediction Models.
    Allows transparent baseline heuristics and future ML models (XGBoost/RandomForest).
    """

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        pass

    @abstractmethod
    def predict(
        self,
        features: AssetRiskFeatures,
        horizon_days: int = 30,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> RiskPredictionResult:
        """Calculates risk score, risk level, and failure probability for asset features."""
        pass

    @abstractmethod
    def explain(
        self,
        features: AssetRiskFeatures,
        result: RiskPredictionResult
    ) -> str:
        """Generates natural language explainability for why the asset received its risk score."""
        pass
