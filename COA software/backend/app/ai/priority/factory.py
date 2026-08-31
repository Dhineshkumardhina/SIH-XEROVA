from app.ai.priority.base import BasePriorityModel
from app.ai.priority.rule_based import RuleBasedPriorityModel

class PriorityModelFactory:
    @staticmethod
    def get_model(name: str = "rule_based") -> BasePriorityModel:
        if name == "rule_based":
            return RuleBasedPriorityModel()
        # Future: elif name == "xgboost": return XGBoostPriorityModel()
        raise ValueError(f"Priority model {name} is not supported.")
