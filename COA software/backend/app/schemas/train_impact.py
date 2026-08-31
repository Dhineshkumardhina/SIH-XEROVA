from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class TrainImpactRequest(BaseModel):
    corridor_id: str = Field(..., description="Corridor UUID")
    start_time: datetime = Field(..., description="Proposed block start datetime")
    end_time: datetime = Field(..., description="Proposed block end datetime")
    block_type: Optional[str] = Field("MAINTENANCE", description="Block category")
    isolation_required: Optional[bool] = Field(False, description="Traction/OHE isolation flag")


class AffectedTrainDetail(BaseModel):
    train_id: str
    train_number: str
    train_name: str
    train_type: str
    direction: str
    scheduled_entry: str
    scheduled_exit: str
    overlap_minutes: int
    estimated_delay_minutes: float
    maximum_delay_minutes: float
    priority_label: str
    impact_level: str
    passengers_affected: int
    reason: str


class AlternativeWindow(BaseModel):
    start_time: str
    end_time: str
    start_datetime: str
    end_datetime: str
    duration_minutes: int
    affected_trains: int
    expected_delay_minutes: float
    impact_score: float
    impact_level: str
    feasible: bool
    reason: str


class TrainImpactSummary(BaseModel):
    affected_trains: int
    expected_delay_minutes: float
    maximum_delay_minutes: float
    passenger_trains: int
    goods_trains: int
    express_trains: int
    superfast_trains: int
    special_trains: int
    maintenance_trains: int
    up_trains: int
    down_trains: int
    total_passengers_estimated: int
    highest_priority: str
    impact_score: float
    operational_impact: str
    is_acceptable: bool


class TrainImpactData(BaseModel):
    corridor_id: str
    corridor_name: Optional[str] = None
    start_time: str
    end_time: str
    start_datetime: str
    end_datetime: str
    duration_minutes: int
    block_id: Optional[str] = None
    block_code: Optional[str] = None
    summary: TrainImpactSummary
    trains: List[AffectedTrainDetail] = []
    explanation_bullets: List[str] = []
    recommendation: str
    alternatives: List[AlternativeWindow] = []
    method: str = "Synthetic Simulation — Baseline Operational Delay Model"


class TrainImpactResponse(BaseModel):
    success: bool = True
    data: TrainImpactData
    message: str = "Train impact calculated successfully"
