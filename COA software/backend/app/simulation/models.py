from datetime import datetime, time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field


@dataclass
class StationNode:
    station_id: str
    code: str
    name: str
    km_post: float
    tracks_count: int = 2
    x_coord: float = 0.0
    y_coord: float = 0.0


@dataclass
class TrackSegment:
    segment_id: str
    from_station_id: str
    to_station_id: str
    length_km: float
    max_speed_kmh: int = 130
    electrified: bool = True
    is_blocked: bool = False
    active_block_id: Optional[str] = None


@dataclass
class SimulatedTrain:
    train_id: str
    train_number: str
    train_type: str            # EXPRESS, FREIGHT, SUBURBAN
    direction: str             # UP, DOWN
    origin: str
    destination: str
    current_station: Optional[str] = None
    current_section: Optional[str] = None
    progress_pct: float = 0.0  # 0.0 to 100.0 along current section
    speed_kmh: float = 90.0
    scheduled_departure: str = "00:00"
    scheduled_arrival: str = "04:00"
    actual_departure: Optional[str] = None
    actual_arrival: Optional[str] = None
    delay_minutes: float = 0.0
    status: str = "SCHEDULED"  # SCHEDULED, DEPARTED, IN_TRANSIT, AT_STATION, DELAYED, BLOCKED, COMPLETED


@dataclass
class SimulatedTask:
    task_id: str
    task_code: str
    department: str
    asset_id: str
    asset_name: str
    duration_minutes: int
    progress_pct: float = 0.0
    status: str = "PLANNED"    # PLANNED, STARTED, IN_PROGRESS, COMPLETED


@dataclass
class SimulatedBlock:
    block_id: str
    corridor_id: str
    section_code: str
    start_time: str            # "01:00"
    end_time: str              # "03:00"
    duration_minutes: int
    departments: List[str]
    is_shared: bool
    status: str = "PLANNED"    # PLANNED, ACTIVE, COMPLETED, CONFLICT
    tasks: List[SimulatedTask] = field(default_factory=list)


@dataclass
class SimulationEventData:
    event_id: str
    event_type: str
    simulation_time: str
    title: str
    description: str
    severity: str = "INFO"     # INFO, WARNING, CRITICAL, SUCCESS


@dataclass
class SimulationMetrics:
    active_trains: int = 0
    completed_trains: int = 0
    delayed_trains: int = 0
    total_train_delay_minutes: float = 0.0
    active_blocks: int = 0
    completed_blocks: int = 0
    active_maintenance_tasks: int = 0
    completed_maintenance_tasks: int = 0
    conflicts_detected: int = 0
    conflicts_resolved: int = 0
    asset_availability_pct: float = 100.0
    block_utilization_pct: float = 0.0


@dataclass
class SimulationState:
    simulation_id: str
    scenario_id: str
    scenario_name: str
    simulation_date: str       # "2026-08-30"
    simulation_time_minutes: int = 0  # 0 to 1440 (00:00 to 24:00)
    simulation_time_str: str = "00:00"
    status: str = "INITIALIZING"      # INITIALIZING, RUNNING, PAUSED, COMPLETED, RESET
    speed_multiplier: float = 1.0     # 1.0, 2.0, 5.0, 10.0
    plan_mode: str = "AI_OPTIMIZED"   # MANUAL_BASELINE, AI_OPTIMIZED
    network_stations: List[StationNode] = field(default_factory=list)
    track_segments: List[TrackSegment] = field(default_factory=list)
    trains: List[SimulatedTrain] = field(default_factory=list)
    blocks: List[SimulatedBlock] = field(default_factory=list)
    events: List[SimulationEventData] = field(default_factory=list)
    metrics: SimulationMetrics = field(default_factory=SimulationMetrics)
    plan_comparison: Dict[str, Any] = field(default_factory=dict)
