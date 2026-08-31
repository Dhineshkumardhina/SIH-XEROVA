from datetime import datetime
from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, Field, field_validator


class RiskPredictionRequest(BaseModel):
    asset_id: str = Field(..., description="Asset UUID or Asset Code (e.g. TRK-1002)")
    horizon_days: int = Field(30, description="Prediction horizon in days (7, 30, 60, 90)")

    @field_validator("horizon_days")
    @classmethod
    def validate_horizon(cls, v: int) -> int:
        if v not in [7, 30, 60, 90]:
            raise ValueError("horizon_days must be one of [7, 30, 60, 90]")
        return v


class BulkRiskPredictionRequest(BaseModel):
    asset_ids: List[str] = Field(..., min_length=1, description="List of asset IDs or codes")
    horizon_days: int = Field(30, description="Prediction horizon in days (7, 30, 60, 90)")

    @field_validator("horizon_days")
    @classmethod
    def validate_horizon(cls, v: int) -> int:
        if v not in [7, 30, 60, 90]:
            raise ValueError("horizon_days must be one of [7, 30, 60, 90]")
        return v


class RiskFactor(BaseModel):
    factor: str
    raw_value: Union[float, int, str]
    normalized_value: float
    weight: float
    contribution: float
    severity: str


class RiskPredictionData(BaseModel):
    asset_id: str
    asset_code: str
    asset_name: Optional[str] = None
    asset_type: Optional[str] = None
    department: Optional[str] = None
    corridor_id: Optional[str] = None
    horizon_days: int
    risk_score: float
    risk_level: str
    failure_probability: float
    model: str
    model_version: Optional[str] = None
    recommendation: str
    explanation: Optional[str] = None
    factors: List[RiskFactor] = []
    prediction_date: Optional[str] = None


class RiskPredictionResponse(BaseModel):
    success: bool = True
    data: RiskPredictionData
    message: str = "Risk prediction generated successfully"


class BulkRiskPredictionResponse(BaseModel):
    success: bool = True
    data: Dict[str, Any]
    message: str = "Bulk risk predictions generated successfully"


class RiskHistoryItem(BaseModel):
    id: str
    asset_id: str
    prediction_date: datetime
    horizon_days: int
    risk_score: float
    risk_level: str
    failure_probability: float
    model_name: str
    model_version: str
    recommendation: Optional[str] = None
    explanation: Optional[str] = None

    class Config:
        from_attributes = True


class HighRiskAssetItem(BaseModel):
    id: str
    asset_id: str
    asset_code: str
    asset_name: str
    asset_type: str
    department: str
    corridor_id: Optional[str] = None
    health_score: float
    criticality_score: float
    risk_score: float
    risk_level: str
    failure_probability: float
    horizon_days: int
    recommendation: Optional[str] = None
    explanation: Optional[str] = None
    factors: List[RiskFactor] = []
    prediction_date: Optional[str] = None


class RiskSummaryData(BaseModel):
    critical_risk_count: int
    high_risk_count: int
    medium_risk_count: int
    low_risk_count: int
    total_predictions_monitored: int
    total_assets_count: int
    average_risk_score: float
    department_distribution: Dict[str, Dict[str, int]]
    risk_distribution: Dict[str, int]


class RiskSummaryResponse(BaseModel):
    success: bool = True
    data: RiskSummaryData
    message: str = "Risk summary retrieved successfully"
