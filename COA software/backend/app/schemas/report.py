from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class ReportGenerateRequest(BaseModel):
    report_type: str = Field(..., description="Type of operational report (e.g. DAILY_BLOCK_PLAN, MAINTENANCE_REPORT, etc.)")
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    department: Optional[str] = None
    corridor_id: Optional[str] = None
    options: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ReportSummaryResponse(BaseModel):
    id: str
    report_code: str
    report_type: str
    title: str
    generated_by: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    summary_metrics: Dict[str, Any] = {}
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class ReportDetailResponse(ReportSummaryResponse):
    parameters: Dict[str, Any] = {}
