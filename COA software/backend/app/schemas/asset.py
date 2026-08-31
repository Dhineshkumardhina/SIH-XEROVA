from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

class AssetBase(BaseModel):
    asset_code: str
    asset_type: str
    department_id: str
    name: str
    description: Optional[str] = None
    station_id: Optional[str] = None
    corridor_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    criticality_score: float = 50.0
    health_score: float = 85.0
    status: str = "HEALTHY"

class AssetCreate(AssetBase):
    pass

class AssetUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    department_id: Optional[str] = None
    station_id: Optional[str] = None
    corridor_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    criticality_score: Optional[float] = None
    health_score: Optional[float] = None
    status: Optional[str] = None

class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department: Optional[str] = ""
    location: Optional[str] = ""
    last_inspection_at: Optional[datetime] = None
    next_inspection_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    @field_validator("department", mode="before")
    @classmethod
    def extract_dept(cls, v):
        if v is None:
            return ""
        if isinstance(v, str):
            return v
        if hasattr(v, "code"):
            return v.code
        return str(v)

class AssetHealthResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    asset_id: str
    health_score: float
    inspection_score: Optional[float] = None
    condition_score: Optional[float] = None
    failure_count: int = 0
    defect_count: int = 0
    usage_score: Optional[float] = None
    recorded_at: datetime

class AssetRiskResponse(BaseModel):
    asset_id: str
    asset_code: str
    asset_name: str
    risk_score: float
    health_score: float
    criticality_score: float
    criticality_tier: str
    recommended_action: str
