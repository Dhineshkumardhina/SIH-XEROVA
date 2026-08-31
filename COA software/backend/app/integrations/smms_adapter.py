from typing import List, Dict, Any
from .base import BaseAdapter

class MockSMMSAdapter(BaseAdapter):
    """
    Signalling Maintenance Management System (SMMS) Adapter.
    Ingests color light signals, point operating machines, electronic interlocking data loggers.
    """
    def fetch_assets(self) -> List[Dict[str, Any]]:
        return [
            {"signal_id": "SMMS-SIG-201", "name": "Home Signal 4A Alpha", "interlocking_code": "EI-VKB", "health": 91.0, "criticality": 90.0, "corridor": "COR-A01"},
            {"point_id": "SMMS-PNT-202", "name": "Point Machine 102B Bravo Yard", "type": "POINT_MACHINE", "health": 84.0, "criticality": 85.0, "corridor": "COR-A01"},
            {"signal_id": "SMMS-SIG-203", "name": "Starter Signal 2B Charlie", "interlocking_code": "EI-MAS", "health": 74.0, "criticality": 82.0, "corridor": "COR-B02"},
        ]

    def fetch_maintenance(self) -> List[Dict[str, Any]]:
        return [
            {"maintenance_id": "SMMS-M-401", "signal_id": "SMMS-SIG-201", "activity": "Relay Logic & Aspect Testing", "duration_minutes": 90, "priority": "MEDIUM"},
            {"maintenance_id": "SMMS-M-402", "point_id": "SMMS-PNT-202", "activity": "Point Machine Motor & Detection Overhaul", "duration_minutes": 120, "priority": "CRITICAL"},
        ]

    def fetch_defects(self) -> List[Dict[str, Any]]:
        return [
            {"alarm_id": "SMMS-ALM-11", "point_id": "SMMS-PNT-202", "description": "Obstruction in Point Tongue Detection Gap", "severity": "HIGH", "risk_score": 82.0},
            {"alarm_id": "SMMS-ALM-12", "signal_id": "SMMS-SIG-203", "description": "Lamp Proving Relay Intermittent Flicker", "severity": "MEDIUM", "risk_score": 58.0},
        ]
