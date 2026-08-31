from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class ScenarioItemResponse(BaseModel):
    scenario_id: str
    name: str
    description: str
    difficulty: str
    train_count: int
    block_count: int


class SimulationRunRequest(BaseModel):
    scenario_id: Optional[str] = Field(default="SHARED_BLOCK_OPTIMIZATION", description="Scenario ID to load")
    plan_mode: Optional[str] = Field(default="AI_OPTIMIZED", description="MANUAL_BASELINE or AI_OPTIMIZED")


class SimulationControlRequest(BaseModel):
    delta_minutes: Optional[int] = Field(default=5, description="Minutes to step forward")
    speed_multiplier: Optional[float] = Field(default=1.0, description="1.0, 2.0, 5.0, 10.0")


class StationNodeSchema(BaseModel):
    station_id: str
    code: str
    name: str
    km_post: float
    tracks_count: int
    x_coord: float
    y_coord: float


class TrackSegmentSchema(BaseModel):
    segment_id: str
    from_station_id: str
    to_station_id: str
    length_km: float
    max_speed_kmh: int
    electrified: bool
    is_blocked: bool
    active_block_id: Optional[str] = None


class SimulatedTrainSchema(BaseModel):
    train_id: str
    train_number: str
    train_type: str
    direction: str
    origin: str
    destination: str
    current_station: Optional[str] = None
    current_section: Optional[str] = None
    progress_pct: float
    speed_kmh: float
    scheduled_departure: str
    scheduled_arrival: str
    actual_departure: Optional[str] = None
    actual_arrival: Optional[str] = None
    delay_minutes: float
    status: str


class SimulatedTaskSchema(BaseModel):
    task_id: str
    task_code: str
    department: str
    asset_id: str
    asset_name: str
    duration_minutes: int
    progress_pct: float
    status: str


class SimulatedBlockSchema(BaseModel):
    block_id: str
    corridor_id: str
    section_code: str
    start_time: str
    end_time: str
    duration_minutes: int
    departments: List[str]
    is_shared: bool
    status: str
    tasks: List[SimulatedTaskSchema] = []


class SimulationEventSchema(BaseModel):
    event_id: str
    event_type: str
    simulation_time: str
    title: str
    description: str
    severity: str


class SimulationMetricsSchema(BaseModel):
    active_trains: int
    completed_trains: int
    delayed_trains: int
    total_train_delay_minutes: float
    active_blocks: int
    completed_blocks: int
    active_maintenance_tasks: int
    completed_maintenance_tasks: int
    conflicts_detected: int
    conflicts_resolved: int
    asset_availability_pct: float
    block_utilization_pct: float


class SimulationStateResponse(BaseModel):
    simulation_id: str
    scenario_id: str
    scenario_name: str
    simulation_date: str
    simulation_time_minutes: int
    simulation_time_str: str
    status: str
    speed_multiplier: float
    plan_mode: str
    network_stations: List[StationNodeSchema] = []
    track_segments: List[TrackSegmentSchema] = []
    trains: List[SimulatedTrainSchema] = []
    blocks: List[SimulatedBlockSchema] = []
    events: List[SimulationEventSchema] = []
    metrics: SimulationMetricsSchema
    plan_comparison: Dict[str, Any] = {}
