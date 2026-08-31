from typing import List, Dict, Any

class MockBDMSAdapter:
    """
    Block Demand Management System (BDMS) Adapter.
    Ingests inter-departmental possession requests, durations, and urgency constraints.
    """
    def fetch_requests(self) -> List[Dict[str, Any]]:
        return [
            {"demand_no": "BDMS-REQ-501", "department": "ENGINEERING", "reason": "Track Relay Replacement", "duration": 150, "priority": "HIGH", "requested_by": "BDMS_DISPATCHER", "corridor": "COR-A01"},
            {"demand_no": "BDMS-REQ-502", "department": "TRACTION", "reason": "Catenary Wire Adjustment", "duration": 180, "priority": "CRITICAL", "requested_by": "TDMS_DISPATCHER", "corridor": "COR-A01"},
            {"demand_no": "BDMS-REQ-503", "department": "SIGNAL_TELECOM", "reason": "Point Machine S&T Overhaul", "duration": 90, "priority": "HIGH", "requested_by": "SMMS_DISPATCHER", "corridor": "COR-B02"},
        ]

    def fetch_blocks(self) -> List[Dict[str, Any]]:
        return self.fetch_requests()
