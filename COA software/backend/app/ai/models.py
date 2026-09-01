"""
AI Model Registry Interface
==========================

This module defines abstract base classes that serve as a contract for the
different AI/ML components used by the RAILOPT platform.  Implementations
must inherit from the appropriate base class and provide concrete ``predict``
methods.

Why abstract bases?
-------------------
* Enforces a **consistent interface** across the code‑base.
* Allows the optimizer and other services to depend only on the abstract
  contract, making it easy to swap a rule‑based implementation with an ML
  model later on.
* Guarantees that every model is **explainable** – the ``explain`` method
  returns a structured description of the reasoning behind each prediction.

The three primary model categories are:

* **Priority** – decides the ordering/weight of maintenance tasks.
* **Risk** – evaluates the risk level of assets or blocks.
* **Forecast** – predicts future demand such as goods volume or train traffic.

All models must expose the following metadata attributes:

* ``model_name`` – human readable identifier.
* ``model_type`` – either ``"rule_based"`` or ``"baseline_ml"``.
* ``version`` – version string for traceability.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Tuple


class BaseModel(ABC):
    """Common functionality for all AI/ML models.

    Attributes
    ----------
    model_name: str
        Descriptive name of the model implementation.
    model_type: str
        Either ``"rule_based"`` or ``"baseline_ml"``.  This string is used
        in logging and UI to indicate the nature of the model without
        overstating its capabilities.
    version: str
        Semantic version identifier.
    """

    model_name: str = "BaseModel"
    model_type: str = "rule_based"
    version: str = "0.0.0"

    @abstractmethod
    def predict(self, *args, **kwargs) -> Any:
        """Run inference and return raw predictions.

        The concrete return type depends on the subclass (e.g. a priority
        score, a risk probability, or a forecast series).
        """
        raise NotImplementedError

    @abstractmethod
    def explain(self, *args, **kwargs) -> Dict[str, Any]:
        """Return a structured explanation for the most recent prediction.

        The explanation must contain the keys ``recommendation``, ``confidence``,
        ``factors``, ``constraints``, ``alternatives`` and ``expected_impact`` as
        defined in the Phase 56 specification.
        """
        raise NotImplementedError


class BasePriorityModel(BaseModel):
    """Interface for task‑priority models.

    Implementations decide how to weight a maintenance task during block
    planning.  The default implementation in the code‑base is a **rule‑based
    priority model** that maps the textual priority (CRITICAL, HIGH, MEDIUM,
    LOW) to a numeric weight.
    """

    model_name: str = "Rule‑based Priority Model"
    model_type: str = "rule_based"
    version: str = "1.0.0"

    @abstractmethod
    def predict(self, priority: str) -> float:
        """Return a numeric weight for the supplied priority label.

        Parameters
        ----------
        priority: str
            One of ``"CRITICAL"``, ``"HIGH"``, ``"MEDIUM"`` or ``"LOW"``.
        """
        raise NotImplementedError

    @abstractmethod
    def explain(self, priority: str) -> Dict[str, Any]:
        """Explain the weight decision for *priority*.

        The returned dictionary follows the Phase 56 recommendation schema.
        """
        raise NotImplementedError


class BaseRiskModel(BaseModel):
    """Interface for risk‑assessment models.

    A risk model evaluates the likelihood of a failure or safety incident.
    At present the platform does **not** ship a trained risk model; the
    placeholder here documents the intended contract so that future work can
    plug in a genuine implementation.
    """

    model_name: str = "Placeholder Risk Model"
    model_type: str = "rule_based"
    version: str = "0.0.0"

    @abstractmethod
    def predict(self, asset_id: str) -> float:
        """Return a risk score between 0.0 (no risk) and 1.0 (certain failure)."""
        raise NotImplementedError

    @abstractmethod
    def explain(self, asset_id: str) -> Dict[str, Any]:
        """Explain the risk computation for the given asset."""
        raise NotImplementedError


class BaseForecastModel(BaseModel):
    """Interface for demand‑forecasting models.

    Forecast models predict future metrics such as goods volume per corridor
    or expected train density.  The current system uses deterministic rules
    defined in the data‑ingestion layer; therefore the **baseline** implementation
    is a **rule‑based forecast model**.
    """

    model_name: str = "Rule‑based Forecast Model"
    model_type: str = "rule_based"
    version: str = "1.0.0"

    @abstractmethod
    def predict(self, corridor_id: str, horizon: str) -> List[Tuple[str, float]]:
        """Return a list of (timestamp, predicted_value) tuples for the horizon.
        """
        raise NotImplementedError

    @abstractmethod
    def explain(self, corridor_id: str, horizon: str) -> Dict[str, Any]:
        """Explain the forecast generation process for the requested corridor.
        """
        raise NotImplementedError

# ---------------------------------------------------------------------------
# Concrete example implementation for the existing priority logic.
# ---------------------------------------------------------------------------

class RuleBasedPriorityModel(BasePriorityModel):
    """Concrete rule‑based priority model used by the optimizer.

    It mirrors the logic in ``BlockOptimizer._map_priority_weight``.
    """

    def predict(self, priority: str) -> float:
        p = (priority or "MEDIUM").upper()
        if p == "CRITICAL":
            return 100.0
        elif p == "HIGH":
            return 70.0
        elif p == "MEDIUM":
            return 40.0
        else:
            return 20.0

    def explain(self, priority: str) -> Dict[str, Any]:
        weight = self.predict(priority)
        return {
            "recommendation": f"Weight {weight} for priority '{priority.upper()}'",
            "confidence": "high" if weight >= 70 else "moderate",
            "factors": ["Rule‑based mapping of priority label to weight"],
            "constraints": [],
            "alternatives": [],
            "expected_impact": "Higher weight improves scheduling likelihood",
        }

# End of file
