from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, field_validator


class OptimizationObjectiveWeights(BaseModel):
    asset_availability: float = Field(default=40.0, description="Weight for asset availability gain")
    maintenance_priority: float = Field(default=25.0, description="Weight for maintenance priority coverage")
    train_impact: float = Field(default=20.0, description="Weight for minimizing train timetable delay")
    block_utilization: float = Field(default=15.0, description="Weight for block time utilization efficiency")

    @field_validator("*", mode="after")
    @classmethod
    def check_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Optimization objective weights must be non-negative.")
        return v


class AIPlanningRequest(BaseModel):
    planning_date: datetime = Field(..., description="Target planning date")
    horizon: Optional[str] = Field(default="DAILY", description="DAILY, WEEKLY, or MONTHLY")
    corridor_ids: Optional[List[str]] = Field(default=None, description="Target corridor UUIDs (empty for all)")
    departments: Optional[List[str]] = Field(default=None, description="Department filters (ENGINEERING, SIGNAL_TELECOM, TRACTION)")
    max_block_duration_minutes: Optional[int] = Field(default=180, description="Maximum possession duration in minutes")
    min_priority: Optional[float] = Field(default=0.0, description="Minimum asset criticality or priority threshold")
    include_overdue: Optional[bool] = Field(default=True, description="Include overdue maintenance tasks")
    include_critical: Optional[bool] = Field(default=True, description="Include critical priority tasks")
    include_shared_blocks: Optional[bool] = Field(default=True, description="Enable multi-department shared possession bundling")
    optimization_objective: Optional[Dict[str, float]] = Field(
        default={
            "asset_availability": 40.0,
            "maintenance_priority": 25.0,
            "train_impact": 20.0,
            "block_utilization": 15.0
        },
        description="Configurable optimization weights (must sum to 100%)"
    )

    @field_validator("optimization_objective", mode="after")
    @classmethod
    def validate_weights_total(cls, v: Optional[Dict[str, float]]) -> Optional[Dict[str, float]]:
        if v:
            total = sum(v.values())
            if abs(total - 100.0) > 0.5:
                raise ValueError(f"Optimization objective weights must total 100%. Current total: {total:.1f}%")
        return v


class RecommendedBlockItem(BaseModel):
    block_id: str
    corridor_id: str
    corridor_name: str
    date: str
    start_time: str
    end_time: str
    duration_minutes: int
    departments: List[str]
    is_shared_block: bool
    tasks: List[Dict[str, Any]]
    task_count: int
    critical_task_count: int
    affected_trains: List[Dict[str, Any]] = []
    expected_train_delay: float
    maximum_train_delay: float
    asset_availability_gain: float
    block_utilization: float
    optimization_score: float
    confidence: float
    risk_level: str
    reason: str
    alternatives: List[Dict[str, Any]] = []
    constraints_checked: List[str] = []
    approval_status: str


class UnplannedTaskItem(BaseModel):
    task_id: str
    task_code: str
    department: str
    priority: str
    reason: str


class PlanningSummaryData(BaseModel):
    planning_run_id: str
    planning_date: str
    planning_horizon: str
    corridors_analyzed: int
    tasks_analyzed: int
    tasks_selected: int
    tasks_unplanned: int
    critical_tasks_total: int
    critical_tasks_covered: int
    overdue_tasks_covered: int
    blocks_generated: int
    shared_blocks_generated: int
    departments_coordinated: int
    expected_train_delay_minutes: float
    optimization_score: float
    planning_confidence: float
    time_saved_minutes: int
    downtime_reduction_pct: float
    validation_status: str
    solver_duration_seconds: float


class PlanningExplanationData(BaseModel):
    why_selected: List[str] = []
    why_this_time: Optional[str] = ""
    why_not_others: List[str] = []
    overall_narrative: List[str] = []
    validation_checks: List[str] = []


class AIPlanningData(BaseModel):
    planning_run_id: str
    status: str
    planning_date: str
    horizon: str
    corridor_id: str
    corridor_name: str
    summary: PlanningSummaryData
    recommended_blocks: List[RecommendedBlockItem] = []
    unplanned_tasks: List[UnplannedTaskItem] = []
    plan_comparison: Dict[str, Any] = {}
    alternatives: List[Dict[str, Any]] = []
    explanation: PlanningExplanationData


class AIPlanningResponse(BaseModel):
    success: bool = True
    data: AIPlanningData
    message: str = "AI block plan generated successfully"
