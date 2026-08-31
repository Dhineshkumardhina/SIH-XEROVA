from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

class IntegrationSyncResult(BaseModel):
    source_system: str
    synced_records: int
    new_records: int
    updated_records: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None

class MockLegacyRecord(BaseModel):
    system: str
    record_type: str
    external_id: str
    data: Dict[str, Any]

class IntegrationSystemHealth(BaseModel):
    system_name: str
    status: str # "CONNECTED" | "ERROR"
    adapter_class: str
    last_sync: Optional[datetime] = None
    records_received: int = 0
    records_accepted: int = 0
    records_rejected: int = 0
    sync_duration_ms: float = 0.0
    errors: List[str] = []
    protocol: str = "REST / Synthetic Mock Adapter"
    description: str = ""

class IntegrationHealthSummary(BaseModel):
    total_systems: int
    connected_systems: int
    error_systems: int
    overall_health: str # "HEALTHY" | "DEGRADED" | "CRITICAL"
    systems: List[IntegrationSystemHealth]
