from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DailyPlanGenerateRequest(BaseModel):
    planning_date: datetime = Field(..., description="Target 24-hour planning date")
    corridor_ids: Optional[List[str]] = Field(default=None, description="Corridor IDs (or all if omitted)")
    departments: Optional[List[str]] = Field(default=None, description="Department filters (ENGINEERING, SIGNAL_TELECOM, TRACTION)")
    max_block_duration_minutes: Optional[int] = Field(default=180, description="Max possession duration")
    min_priority: Optional[float] = Field(default=0.0, description="Minimum priority threshold")
    include_overdue: Optional[bool] = Field(default=True, description="Include overdue tasks")
    include_critical: Optional[bool] = Field(default=True, description="Include critical tasks")
    optimization_objective: Optional[Dict[str, float]] = Field(default=None, description="Objective weights")


class WeeklyPlanGenerateRequest(BaseModel):
    start_date: datetime = Field(..., description="Starting Monday date for the 7-day planning window")
    corridor_ids: Optional[List[str]] = Field(default=None, description="Corridor IDs")
    departments: Optional[List[str]] = Field(default=None, description="Department filters")
    optimization_objective: Optional[Dict[str, float]] = Field(default=None, description="Objective weights")


class MonthlyPlanGenerateRequest(BaseModel):
    year: int = Field(default=2026, description="Target planning year")
    month: int = Field(default=8, ge=1, le=12, description="Target planning month (1-12)")
    corridor_ids: Optional[List[str]] = Field(default=None, description="Corridor IDs")
    departments: Optional[List[str]] = Field(default=None, description="Department filters")


class BlockMovePayload(BaseModel):
    new_start_time: datetime = Field(..., description="New planned start time")
    new_end_time: datetime = Field(..., description="New planned end time")
    change_reason: Optional[str] = Field(default="Window rescheduled by planner", description="Reason for moving window")


class PlanPublishResponse(BaseModel):
    success: bool
    plan_id: str
    plan_code: str
    status: str
    published_at: str
    published_by: str
    message: str
