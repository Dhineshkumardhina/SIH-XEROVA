from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class ScenarioCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=128, description="Scenario name")
    description: Optional[str] = Field(None, max_length=500, description="Scenario description")
    base_plan_id: Optional[str] = Field(None, description="Base Plan ID snapshot")
    corridor_id: Optional[str] = Field(None, description="Target corridor ID")
    scenario_type: Optional[str] = Field(default="WHAT_IF_EXPERIMENT")
    parameters: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Scenario parameter overrides")


class ScenarioUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[Dict[str, Any]] = None


class ScenarioDetailResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    scenario_type: str
    configuration: Optional[Dict[str, Any]] = None
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class ScenarioValidationResponse(BaseModel):
    scenario_id: str
    is_valid: bool
    conflicts: List[str] = []
    validation_timestamp: str


class ScenarioRunResultResponse(BaseModel):
    scenario_id: str
    status: str
    executed_at: str
    baseline_metrics: Dict[str, Any]
    scenario_metrics: Dict[str, Any]
    deltas: Dict[str, Any]
    explanation: Dict[str, Any]
    alternative_recommendation: Optional[Dict[str, Any]] = None
    score: float


class ScenarioCompareRequest(BaseModel):
    scenario_ids: List[str]


class ScenarioCompareResponse(BaseModel):
    comparison: List[Dict[str, Any]]
    best_option: Optional[Dict[str, Any]] = None
