from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class BlockEvaluationRequest(BaseModel):
    corridor_id: str = Field(..., description="Corridor UUID")
    start_time: datetime = Field(..., description="Block start datetime")
    end_time: datetime = Field(..., description="Block end datetime")
    task_ids: Optional[List[str]] = Field(default=None, description="Optional list of maintenance task UUIDs")
    isolation_required: Optional[bool] = Field(default=False, description="Isolation requirement flag")
    exclude_block_id: Optional[str] = Field(default=None, description="Block request ID to exclude from overlap checks")


class ConflictItem(BaseModel):
    conflict_type: str
    severity: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    entity_name: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    description: str
    resolution: Optional[str] = None


class BlockEvaluationData(BaseModel):
    corridor_id: str
    corridor_name: Optional[str] = None
    start_time: str
    end_time: str
    start_datetime: str
    end_datetime: str
    duration_minutes: int
    feasible: bool
    severity: str
    conflict_count: int
    critical_conflicts_count: int
    conflicts: List[ConflictItem] = []
    resolution_suggestions: List[str] = []
    affected_trains: List[Dict[str, Any]] = []
    train_impact: Dict[str, Any] = {}
    alternatives: List[Dict[str, Any]] = []
    shared_block_possible: bool = False


class BlockEvaluationResponse(BaseModel):
    success: bool = True
    data: BlockEvaluationData
    message: str = "Block evaluation completed successfully"


class FeasibleWindowsRequest(BaseModel):
    corridor_id: str
    date: datetime
    duration_minutes: int = 120
    preferred_start_hour: Optional[int] = 0
    preferred_end_hour: Optional[int] = 24
    task_ids: Optional[List[str]] = None


class FeasibleWindowItem(BaseModel):
    start_time: str
    end_time: str
    start_datetime: str
    end_datetime: str
    duration_minutes: int
    impact_score: float
    expected_delay_minutes: float
    conflict_count: int
    severity: str
    feasible: bool
    reason: str


class FeasibleWindowsResponse(BaseModel):
    success: bool = True
    data: List[FeasibleWindowItem] = []
    message: str = "Feasible windows retrieved successfully"
