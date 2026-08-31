from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

class DefectBase(BaseModel):
    defect_code: Optional[str] = None
    asset_id: str
    department_id: str
    description: str
    severity: str = "HIGH"
    detected_at: Optional[datetime] = None
    detected_by: Optional[str] = "INSPECTION_SYSTEM"
    risk_score: float = 70.0
    safety_impact: float = 50.0
    operational_impact: float = 50.0
    status: str = "OPEN"
    target_resolution_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

class DefectCreate(DefectBase):
    pass

class DefectUpdate(BaseModel):
    description: Optional[str] = None
    severity: Optional[str] = None
    risk_score: Optional[float] = None
    safety_impact: Optional[float] = None
    operational_impact: Optional[float] = None
    status: Optional[str] = None
    target_resolution_date: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    resolved_by: Optional[str] = None
    resolution_notes: Optional[str] = None

class DefectResponse(DefectBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department: Optional[str] = ""
    detected_date: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
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
