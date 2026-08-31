from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime

# ── Auth & Users ────────────────────────────────────────────────────

class UserLogin(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str
    username: str
    role: str
    department: str

class UserSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    username: str
    email: str
    name: str
    role: str
    department: str
    active: bool
    created_at: datetime


# ── Infrastructure (Zone, Division, Station, Corridor, Department) ──

class ZoneSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    created_at: datetime
    updated_at: datetime


class DivisionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    zone_id: str
    code: str
    name: str
    created_at: datetime
    updated_at: datetime


class StationSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    division_id: Optional[str] = None
    code: str
    name: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    created_at: datetime
    updated_at: datetime


class DepartmentSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class CorridorSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    start_station_id: str
    end_station_id: str
    distance_km: float
    track_count: int
    electrified: bool
    status: str
    created_at: datetime
    updated_at: datetime


# ── Assets & Health ──────────────────────────────────────────────────

class AssetHealthSchema(BaseModel):
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
    source: Optional[str] = None


class InspectionSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_id: str
    department_id: str
    inspection_type: str
    inspection_date: datetime
    inspector_reference: str
    condition_score: Optional[float] = None
    findings: Optional[str] = None
    next_due_at: Optional[datetime] = None
    source: Optional[str] = None


class AssetSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    asset_code: str
    asset_type: str
    department_id: str
    department: Optional[str] = ""
    name: str
    description: Optional[str] = None
    location: Optional[str] = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    corridor_id: Optional[str] = None
    station_id: Optional[str] = None
    criticality_score: float
    health_score: float
    last_inspection_at: Optional[datetime] = None
    next_inspection_at: Optional[datetime] = None
    last_inspection: Optional[datetime] = None
    next_inspection: Optional[datetime] = None
    status: str


# ── Maintenance & Defects ───────────────────────────────────────────

class MaintenanceTaskSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_code: Optional[str] = None
    asset_id: str
    department_id: str
    department: Optional[str] = ""
    task_type: str
    description: str
    created_at: datetime
    scheduled_start_at: Optional[datetime] = None
    scheduled_date: Optional[datetime] = None
    due_at: Optional[datetime] = None
    due_date: Optional[datetime] = None
    duration_minutes: int
    priority: str
    urgency: float = 50.0
    safety_impact: float = 50.0
    train_impact: float = 10.0
    block_required: bool = True
    isolation_required: bool = False
    is_overdue: bool = False
    overdue_days: int = 0
    status: str


class DefectSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    defect_code: Optional[str] = None
    asset_id: str
    department_id: str
    department: Optional[str] = ""
    description: str
    severity: str
    detected_at: Optional[datetime] = None
    detected_date: Optional[datetime] = None
    detected_by_reference: Optional[str] = None
    detected_by: Optional[str] = None
    risk_score: float = 70.0
    safety_impact: float = 50.0
    operational_impact: float = 50.0
    status: str


# ── Block Plans & Demands ───────────────────────────────────────────

class BlockRequestSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    request_code: Optional[str] = None
    department_id: str
    department: Optional[str] = ""
    asset_id: Optional[str] = None
    corridor_id: str
    requested_date: datetime
    preferred_start_at: Optional[datetime] = None
    preferred_end_at: Optional[datetime] = None
    preferred_start: Optional[datetime] = None
    preferred_end: Optional[datetime] = None
    duration_minutes: int
    reason: str
    priority: str
    status: str


class BlockPlanSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    plan_code: Optional[str] = None
    corridor_id: str
    corridor: Optional[str] = ""
    start_time: datetime
    end_time: datetime
    duration_minutes: int
    status: str
    tasks_included: List[str] = []
    departments: List[str] = []
    train_impact: int = 0
    expected_delay_minutes: int = 0
    downtime_saved_minutes: int = 0
    optimization_score: Optional[float] = None
    confidence_score: Optional[float] = 95.0
    ai_reason: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None


# ── Trains & Timetables ─────────────────────────────────────────────

class TrainSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    train_number: str
    train_name: str
    train_type: str
    default_direction: str
    direction: Optional[str] = "UP"
    origin: str
    destination: str
    priority: int


class TrainScheduleSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    train_id: str
    station_id: Optional[str] = None
    corridor_id: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    line: Optional[str] = "MAIN_1"
    sequence_number: int = 1


# ── Dashboard & Analytics ───────────────────────────────────────────

class DashboardStats(BaseModel):
    asset_availability: float
    active_blocks: int
    todays_maintenance: int = 0
    critical_defects: int
    overdue_tasks: int
    train_impact_minutes: int = 0
    block_utilization: float = 0.0
    ai_recommendations_count: int = 0


# ── AI & Optimization ───────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    corridor_id: str
    horizon_days: int = 1
    max_train_impact: int = 3
    objective_weights: Optional[Dict[str, Any]] = None

class OptimizeResponse(BaseModel):
    block_plans: List[BlockPlanSchema]
    tasks_consolidated: int
    downtime_saved_minutes: int
    baseline_downtime_minutes: int
    optimized_downtime_minutes: int
    optimization_score: float
    explainability: List[str]
