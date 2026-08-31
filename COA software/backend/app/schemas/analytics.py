from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class DashboardAnalyticsResponse(BaseModel):
    asset_availability: Dict[str, Any]
    block_utilization: Dict[str, Any]
    maintenance: Dict[str, Any]
    train_impact: Dict[str, Any]
    shared_blocks: Dict[str, Any]
    insights: List[Dict[str, Any]] = []


class AssetAnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    health_distribution: List[Dict[str, Any]]
    department_analytics: List[Dict[str, Any]]
    critical_assets: List[Dict[str, Any]]


class MaintenanceAnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    status_distribution: List[Dict[str, Any]]
    priority_distribution: List[Dict[str, Any]]
    workload_by_department: List[Dict[str, Any]]
    overdue_table: List[Dict[str, Any]]


class BlockAnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    duration_analysis: Dict[str, Any]
    shared_blocks_summary: Dict[str, Any]
    utilization_trend: List[Dict[str, Any]]
    before_vs_after: Dict[str, Any]


class TrainImpactAnalyticsResponse(BaseModel):
    kpis: Dict[str, Any]
    impact_by_type: List[Dict[str, Any]]
    delay_trend: List[Dict[str, Any]]


class CorridorAnalyticsResponse(BaseModel):
    formula: str
    corridors: List[Dict[str, Any]]


class TrendAnalyticsResponse(BaseModel):
    metric: str
    days: int
    data: List[Dict[str, Any]]
