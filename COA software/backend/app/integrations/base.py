from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseAdapter(ABC):
    """
    Base integration adapter interface for legacy railway systems.
    Subclasses provide structured data ingestion corresponding to CRDM.
    """
    @abstractmethod
    def fetch_assets(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def fetch_maintenance(self) -> List[Dict[str, Any]]:
        raise NotImplementedError

    @abstractmethod
    def fetch_defects(self) -> List[Dict[str, Any]]:
        raise NotImplementedError
