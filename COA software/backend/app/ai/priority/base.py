from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple

class BasePriorityModel(ABC):
    """
    Interface for Maintenance Priority Models.
    Allows swappable implementations (Rule-based, ML-based, etc.)
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
    def calculate(self, task_context: Dict[str, Any], weights: Dict[str, float] = None) -> Tuple[float, str, Dict[str, Any], str, str]:
        """
        Calculate priority.
        
        Args:
            task_context: Dictionary containing asset, defect, task, and train impact data.
            weights: Optional custom weights configuration.
            
        Returns:
            Tuple containing:
            - priority_score (float, 0-100)
            - priority_level (str)
            - factor_breakdown (Dict)
            - recommendation (str)
            - explanation (str)
        """
        pass
