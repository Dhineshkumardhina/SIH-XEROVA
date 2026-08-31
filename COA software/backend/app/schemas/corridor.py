from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class CorridorBase(BaseModel):
    code: str
    name: str
    start_station_id: str
    end_station_id: str
    distance_km: float = 0.0
    track_count: int = 2
    electrified: bool = True
    status: str = "OPERATIONAL"
    geometry: Optional[Dict[str, Any]] = None

class CorridorCreate(CorridorBase):
    pass

class CorridorUpdate(BaseModel):
    name: Optional[str] = None
    start_station_id: Optional[str] = None
    end_station_id: Optional[str] = None
    distance_km: Optional[float] = None
    track_count: Optional[int] = None
    electrified: Optional[bool] = None
    status: Optional[str] = None
    geometry: Optional[Dict[str, Any]] = None

class CorridorResponse(CorridorBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime

class CorridorAvailabilityResponse(BaseModel):
    corridor_id: str
    corridor_code: str
    corridor_name: str
    status: str
    availability_pct: float
    active_blocks_count: int
    open_defects_count: int
    pending_tasks_count: int
    scheduled_trains_count: int
