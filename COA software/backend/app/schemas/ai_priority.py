from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class AIPriorityFactor(BaseModel):
    raw_value: Any
    normalized_value: float
    weight: float
    contribution: float

class AIPriorityCalculateRequest(BaseModel):
    task_id: str

class AIPriorityBatchRequest(BaseModel):
    task_ids: List[str]

class AIPriorityRecalculateRequest(BaseModel):
    scope: str = Field(..., description="all, overdue, critical, corridor, department")

class AIPriorityPredictionResponse(BaseModel):
    id: str
    task_id: str
    priority_score: float
    priority_level: str
    model_name: str
    model_version: str
    factor_breakdown: Dict[str, AIPriorityFactor]
    recommendation: Optional[str] = None
    explanation: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AIWeightConfigUpdate(BaseModel):
    asset_criticality: float = Field(ge=0, le=1)
    defect_severity: float = Field(ge=0, le=1)
    urgency: float = Field(ge=0, le=1)
    overdue_days: float = Field(ge=0, le=1)
    safety_impact: float = Field(ge=0, le=1)
    train_impact: float = Field(ge=0, le=1)
    failure_probability: float = Field(ge=0, le=1)
    maintenance_duration: float = Field(ge=0, le=1, default=0.0)
    operational_importance: float = Field(ge=0, le=1, default=0.0)
