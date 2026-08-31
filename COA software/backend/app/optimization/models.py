from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Dict, Any, Optional


@dataclass
class OptimizationConfig:
    horizon: str = "DAILY"
    min_block_duration_minutes: int = 60
    max_block_duration_minutes: int = 180
    time_step_minutes: int = 5
    solver_max_time_seconds: float = 5.0
    num_search_workers: int = 4
    
    # Objective weights (Configurable simulation weights)
    weight_maintenance_priority: float = 40.0
    weight_asset_availability: float = 25.0
    weight_shared_block: float = 15.0
    weight_overdue_reduction: float = 10.0
    weight_train_delay: float = 20.0
    weight_downtime: float = 15.0
    weight_unused_capacity: float = 10.0
    weight_conflict_penalty: float = 10.0


@dataclass
class TaskWrapper:
    id: str
    code: str
    department_id: str
    department_code: str
    asset_id: str
    asset_name: str
    asset_criticality: float
    description: str
    duration_minutes: int
    priority: str
    priority_weight: float
    is_overdue: bool
    isolation_required: bool
    due_date: Optional[datetime] = None
    preferred_start: Optional[datetime] = None
    preferred_end: Optional[datetime] = None


@dataclass
class CandidateBlock:
    candidate_id: int
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    feasible: bool
    conflict_count: int
    severity: str
    train_impact_score: float
    expected_delay_minutes: float
    affected_trains: int
    conflicts: List[Dict[str, Any]] = field(default_factory=list)
    affected_train_list: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ScheduledTask:
    task_id: str
    task_code: str
    department_code: str
    asset_id: str
    priority: str
    duration_minutes: int
    start_time: datetime
    end_time: datetime


@dataclass
class OptimizedBlock:
    block_id: str
    corridor_id: str
    corridor_name: str
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    departments: List[str]
    is_shared_block: bool
    tasks: List[Dict[str, Any]]
    task_count: int
    maintenance_minutes: int
    block_utilization: float
    train_impact_score: float
    expected_delay_minutes: float
    affected_trains_count: int
    asset_availability_gain: float
    optimization_score: float
    conflicts: List[Dict[str, Any]]
    explanation: Dict[str, Any]


@dataclass
class UnscheduledTask:
    task_id: str
    task_code: str
    department_code: str
    priority: str
    reason: str


@dataclass
class OptimizationContext:
    planning_date: datetime
    corridor_id: str
    corridor_name: str
    corridor_track_count: int
    config: OptimizationConfig
    tasks: List[TaskWrapper] = field(default_factory=list)
    candidates: List[CandidateBlock] = field(default_factory=list)


@dataclass
class OptimizationOutcome:
    optimization_run_id: str
    status: str # OPTIMAL, FEASIBLE, INFEASIBLE, UNKNOWN
    planning_horizon: str
    planning_date: str
    corridor_id: str
    corridor_name: str
    solver_duration_seconds: float
    objective_value: float
    blocks: List[OptimizedBlock] = field(default_factory=list)
    unscheduled_tasks: List[UnscheduledTask] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    baseline_plan: Dict[str, Any] = field(default_factory=dict)
    plan_comparison: Dict[str, Any] = field(default_factory=dict)
    alternatives: List[Dict[str, Any]] = field(default_factory=list)
    explanations: List[str] = field(default_factory=list)
