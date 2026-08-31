from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator

class MaintenanceTaskBase(BaseModel):
    task_code: Optional[str] = None
    asset_id: str
    department_id: str
    task_type: str = "PREVENTIVE"
    description: str
    scheduled_start_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    duration_minutes: int = 120
    priority: str = "HIGH"
    urgency: float = 50.0
    safety_impact: float = 50.0
    train_impact: float = 10.0
    block_required: bool = True
    isolation_required: bool = False
    status: str = "PENDING"

class MaintenanceTaskCreate(MaintenanceTaskBase):
    pass

class MaintenanceTaskUpdate(BaseModel):
    description: Optional[str] = None
    scheduled_start_at: Optional[datetime] = None
    due_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    priority: Optional[str] = None
    urgency: Optional[float] = None
    safety_impact: Optional[float] = None
    train_impact: Optional[float] = None
    block_required: Optional[bool] = None
    isolation_required: Optional[bool] = None
    status: Optional[str] = None

class MaintenanceTaskComplete(BaseModel):
    completion_notes: Optional[str] = None
    actual_duration_minutes: Optional[int] = None

class MaintenanceTaskCancel(BaseModel):
    cancellation_reason: str

class MaintenanceTaskResponse(MaintenanceTaskBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department: Optional[str] = ""
    scheduled_date: Optional[datetime] = None
    due_date: Optional[datetime] = None
    is_overdue: bool = False
    overdue_days: int = 0
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
