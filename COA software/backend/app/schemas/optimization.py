from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class OptimizationRequest(BaseModel):
    planning_date: datetime = Field(..., description="Target date for block optimization")
    corridor_id: str = Field(..., description="Corridor UUID")
    task_ids: Optional[List[str]] = Field(default=None, description="Optional list of specific maintenance task IDs")
    planning_horizon: Optional[str] = Field(default="DAILY", description="DAILY, WEEKLY, or MONTHLY")
    maximum_block_duration_minutes: Optional[int] = Field(default=180, description="Max allowed possession duration in minutes")
    minimum_block_duration_minutes: Optional[int] = Field(default=60, description="Min allowed possession duration in minutes")
    
    # Optional weight overrides
    weight_maintenance_priority: Optional[float] = None
    weight_asset_availability: Optional[float] = None
    weight_shared_block: Optional[float] = None
    weight_train_delay: Optional[float] = None


class ScheduledTaskItem(BaseModel):
    task_id: str
    task_code: str
    department: str
    asset_id: str
    asset_name: Optional[str] = None
    priority: str
    duration_minutes: int
    is_overdue: bool
    description: Optional[str] = None


class BlockExplanationItem(BaseModel):
    why_selected: List[str] = []
    why_this_time: Optional[str] = None
    why_not_others: List[str] = []
    departments: List[str] = []
    is_shared_block: bool = False
    time_saved_vs_sequential_minutes: int = 0
    utilization_pct: float = 0.0


class OptimizationBlockResponse(BaseModel):
    block_id: str
    corridor_id: str
    corridor_name: str
    start_time: str
    end_time: str
    duration_minutes: int
    departments: List[str]
    is_shared_block: bool
    tasks: List[ScheduledTaskItem]
    task_count: int
    maintenance_minutes: int
    block_utilization: float
    train_impact_score: float
    expected_delay_minutes: float
    affected_trains_count: int
    asset_availability_gain: float
    optimization_score: float
    conflicts: List[Dict[str, Any]] = []
    explanation: Dict[str, Any] = {}


class UnscheduledTaskResponse(BaseModel):
    task_id: str
    task_code: str
    department_code: str
    priority: str
    reason: str


class OptimizationData(BaseModel):
    optimization_run_id: str
    status: str
    planning_horizon: str
    planning_date: str
    corridor_id: str
    corridor_name: str
    solver_duration_seconds: float
    objective_value: float
    blocks: List[OptimizationBlockResponse] = []
    unscheduled_tasks: List[UnscheduledTaskResponse] = []
    metrics: Dict[str, Any] = {}
    baseline_plan: Dict[str, Any] = {}
    plan_comparison: Dict[str, Any] = {}
    alternatives: List[Dict[str, Any]] = []
    explanations: List[str] = []


class OptimizationResponse(BaseModel):
    success: bool = True
    data: OptimizationData
    message: str = "Optimization completed successfully"
