from typing import List, Dict, Any
from .base import BaseAdapter

class MockTDMSAdapter(BaseAdapter):
    """
    Traction Distribution Management System (TDMS) Adapter.
    Ingests 25kV OHE catenary, feeders, tension balances, and substation status.
    """
    def fetch_assets(self) -> List[Dict[str, Any]]:
        return [
            {"ohe_id": "TDMS-OHE-301", "name": "OHE Tension Section 3B STN-A", "tension_score": 92.0, "health": 88.0, "criticality": 95.0, "corridor": "COR-A01"},
            {"sub_id": "TDMS-TR-302", "name": "Traction Transformer 220/25kV TSS MAS", "health": 85.0, "criticality": 90.0, "corridor": "COR-A01"},
            {"ohe_id": "TDMS-OHE-303", "name": "Catenary Auto-Tensioning Dropper Bravo-Charlie", "tension_score": 75.0, "health": 68.0, "criticality": 88.0, "corridor": "COR-B02"},
        ]

    def fetch_maintenance(self) -> List[Dict[str, Any]]:
        return [
            {"tdms_task_id": "TDMS-TSK-77", "ohe_id": "TDMS-OHE-301", "description": "Cantilever Inspection & Greasing", "duration": 120, "priority": "HIGH"},
            {"tdms_task_id": "TDMS-TSK-78", "ohe_id": "TDMS-OHE-303", "description": "Section Insulator Alignment & Contact Calibration", "duration": 90, "priority": "HIGH"},
        ]

    def fetch_defects(self) -> List[Dict[str, Any]]:
        return [
            {"defect_id": "TDMS-DEF-09", "ohe_id": "TDMS-OHE-301", "description": "Dropper Sagging Km 18/4 Pantograph Arc Risk", "severity": "HIGH", "risk_score": 79.0},
            {"defect_id": "TDMS-DEF-10", "ohe_id": "TDMS-OHE-303", "description": "Insulator Flashover Deposit Build-up", "severity": "MEDIUM", "risk_score": 60.0},
        ]
