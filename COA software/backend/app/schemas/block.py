from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class BlockRequestBase(BaseModel):
    request_code: Optional[str] = None
    department_id: str
    asset_id: Optional[str] = None
    corridor_id: str
    requested_date: Optional[datetime] = None
    preferred_start_at: datetime
    preferred_end_at: datetime
    duration_minutes: int = Field(..., gt=0)
    block_type: str = "MAINTENANCE"
    isolation_required: bool = False
    reason: str
    priority: str = "HIGH"
    status: str = "SUBMITTED"

class BlockRequestCreate(BlockRequestBase):
    task_ids: Optional[List[str]] = None

class BlockRequestUpdate(BaseModel):
    asset_id: Optional[str] = None
    corridor_id: Optional[str] = None
    preferred_start_at: Optional[datetime] = None
    preferred_end_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    block_type: Optional[str] = None
    isolation_required: Optional[bool] = None
    reason: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class BlockRequestRejectPayload(BaseModel):
    rejection_reason: str

class BlockRequestCancelPayload(BaseModel):
    cancellation_reason: str

class BlockRequestResponse(BlockRequestBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    department: Optional[str] = ""
    requested_by: Optional[str] = ""
    preferred_start: Optional[datetime] = None
    preferred_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None
    tasks_included: Optional[List[str]] = []

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

class BlockPlanBase(BaseModel):
    plan_code: Optional[str] = None
    corridor_id: str
    planning_date: Optional[datetime] = None
    planned_start_at: datetime
    planned_end_at: datetime
    duration_minutes: int
    status: str = "DRAFT"
    planning_horizon: str = "DAILY"
    optimization_score: Optional[float] = None
    expected_train_delay: Optional[int] = 0
    asset_availability_gain: Optional[float] = 0.0

class BlockPlanCreate(BlockPlanBase):
    pass

class BlockPlanUpdate(BaseModel):
    planned_start_at: Optional[datetime] = None
    planned_end_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    status: Optional[str] = None
    expected_train_delay: Optional[int] = None
    asset_availability_gain: Optional[float] = None

class BlockPlanResponse(BlockPlanBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    corridor: Optional[str] = ""
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    tasks_included: List[str] = []
    departments: List[str] = []
    train_impact: int = 0
    expected_delay_minutes: int = 0
    downtime_saved_minutes: int = 0
    confidence_score: Optional[float] = 95.0
    ai_reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class BlockConflictResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    block_plan_id: str
    conflict_type: str
    severity: str
    description: str
    created_at: datetime

class BlockImpactResponse(BaseModel):
    block_id: str
    corridor_id: str
    duration_minutes: int
    train_delay_minutes: int
    trains_affected_count: int
    passengers_impacted_estimate: int
    freight_delay_hours: float
    asset_availability_gain: float
    safety_score: float

class BlockConflictDetail(BaseModel):
    has_conflict: bool
    conflicts: List[Dict[str, Any]] = []
