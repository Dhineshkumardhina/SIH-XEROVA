from typing import List, Dict, Any
from .base import BaseAdapter

class MockTMSAdapter(BaseAdapter):
    """
    Track Management System (TMS) Adapter.
    Ingests track geometry, rail wear, ultra-sonic flaw detection, and p-way maintenance.
    """
    def fetch_assets(self) -> List[Dict[str, Any]]:
        return [
            {"track_id": "TMS-TK-101", "name": "Main Up Line Km 12-14", "wear_pct": 12.5, "km_marker": "12.4", "health": 87.5, "criticality": 85.0, "corridor": "COR-A01"},
            {"track_id": "TMS-TK-102", "name": "Main Down Line Km 14-16", "wear_pct": 18.0, "km_marker": "15.1", "health": 82.0, "criticality": 80.0, "corridor": "COR-A01"},
            {"track_id": "TMS-TK-103", "name": "Turnout Section STN-B Junction", "wear_pct": 28.0, "km_marker": "20.5", "health": 62.0, "criticality": 92.0, "corridor": "COR-B02"},
        ]

    def fetch_maintenance(self) -> List[Dict[str, Any]]:
        return [
            {"tms_job_id": "TMS-JOB-901", "track_id": "TMS-TK-101", "job_type": "Tamping", "hours": 3.5, "status": "SCHEDULED", "priority": "HIGH"},
            {"tms_job_id": "TMS-JOB-902", "track_id": "TMS-TK-102", "job_type": "Deep Screening", "hours": 4.0, "status": "PENDING", "priority": "CRITICAL"},
            {"tms_job_id": "TMS-JOB-903", "track_id": "TMS-TK-103", "job_type": "Rail Grinding", "hours": 2.0, "status": "SCHEDULED", "priority": "HIGH"},
        ]

    def fetch_defects(self) -> List[Dict[str, Any]]:
        return [
            {"usfd_id": "USFD-882", "track_id": "TMS-TK-101", "defect_type": "Weld Fatigue Flaw", "severity": "CRITICAL", "detected_km": "13.2", "risk_score": 88.0},
            {"usfd_id": "USFD-883", "track_id": "TMS-TK-103", "defect_type": "Gauge Face Wear Exceedance", "severity": "HIGH", "detected_km": "20.6", "risk_score": 76.0},
        ]
