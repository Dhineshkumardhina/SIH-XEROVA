from typing import List, Dict, Any

class MockCOAAdapter:
    """
    Control Office Application (COA) Adapter.
    Ingests live train movements, section occupations, punctuality status, and delay events.
    """
    def fetch_trains(self) -> List[Dict[str, Any]]:
        return [
            {"train_no": "12723", "name": "Telangana Express", "type": "SUPERFAST", "dir": "UP", "origin": "HYB", "destination": "NDLS", "priority": 1},
            {"train_no": "12724", "name": "Telangana Express Return", "type": "SUPERFAST", "dir": "DOWN", "origin": "NDLS", "destination": "HYB", "priority": 1},
            {"train_no": "12301", "name": "Rajdhani Express", "type": "SUPERFAST", "dir": "DOWN", "origin": "STN-A", "destination": "STN-C", "priority": 1},
            {"train_no": "G-5501", "name": "Container Freight Rake Alpha", "type": "GOODS", "dir": "DOWN", "origin": "STN-A", "destination": "STN-B", "priority": 4},
        ]

    def fetch_movements(self) -> List[Dict[str, Any]]:
        return [
            {"train_no": "12723", "event": "PASS", "station": "STN-A", "corridor": "COR-A01", "status": "ON_TIME", "delay_min": 0},
            {"train_no": "12724", "event": "ARRIVAL", "station": "STN-B", "corridor": "COR-A01", "status": "DELAYED", "delay_min": 14},
            {"train_no": "G-5501", "event": "DEPARTURE", "station": "STN-A", "corridor": "COR-A01", "status": "ON_TIME", "delay_min": 0},
        ]
