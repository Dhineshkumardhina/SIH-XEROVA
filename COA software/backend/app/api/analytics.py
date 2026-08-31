"""
RAILOPT AI — Analytics API Router
Provides operational intelligence endpoints computed directly from database records.
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.schemas.common import ApiResponse
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    AssetAnalyticsResponse,
    MaintenanceAnalyticsResponse,
    BlockAnalyticsResponse,
    TrainImpactAnalyticsResponse,
    CorridorAnalyticsResponse,
    TrendAnalyticsResponse
)
from app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Operations Analytics & Intelligence"])


@router.get("/dashboard", response_model=ApiResponse[DashboardAnalyticsResponse], summary="Executive dashboard analytics summary")
def get_dashboard_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    department: Optional[str] = Query(None),
    corridor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_dashboard_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_code=department,
        corridor_id=corridor_id
    )
    return ApiResponse(
        data=DashboardAnalyticsResponse(**data),
        message="Dashboard analytics retrieved successfully"
    )


@router.get("/assets", response_model=ApiResponse[AssetAnalyticsResponse], summary="Asset reliability & degradation analytics")
def get_asset_analytics(
    department: Optional[str] = Query(None),
    corridor_id: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_asset_analytics(
        db=db,
        department_code=department,
        corridor_id=corridor_id,
        asset_type=asset_type
    )
    return ApiResponse(
        data=AssetAnalyticsResponse(**data),
        message="Asset analytics retrieved successfully"
    )


@router.get("/maintenance", response_model=ApiResponse[MaintenanceAnalyticsResponse], summary="Maintenance workload & completion analytics")
def get_maintenance_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    department: Optional[str] = Query(None),
    corridor_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_maintenance_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        department_code=department,
        corridor_id=corridor_id,
        status=status
    )
    return ApiResponse(
        data=MaintenanceAnalyticsResponse(**data),
        message="Maintenance analytics retrieved successfully"
    )


@router.get("/blocks", response_model=ApiResponse[BlockAnalyticsResponse], summary="Block utilization & shared coordination analytics")
def get_block_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    corridor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_block_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        corridor_id=corridor_id
    )
    return ApiResponse(
        data=BlockAnalyticsResponse(**data),
        message="Block analytics retrieved successfully"
    )


@router.get("/train-impact", response_model=ApiResponse[TrainImpactAnalyticsResponse], summary="Train operational impact & delay analytics")
def get_train_impact_analytics(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    corridor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_train_impact_analytics(
        db=db,
        start_date=start_date,
        end_date=end_date,
        corridor_id=corridor_id
    )
    return ApiResponse(
        data=TrainImpactAnalyticsResponse(**data),
        message="Train impact analytics retrieved successfully"
    )


@router.get("/corridors", response_model=ApiResponse[CorridorAnalyticsResponse], summary="Corridor performance and risk ranking")
def get_corridor_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_corridor_analytics(db=db)
    return ApiResponse(
        data=CorridorAnalyticsResponse(**data),
        message="Corridor analytics retrieved successfully"
    )


@router.get("/trends", response_model=ApiResponse[TrendAnalyticsResponse], summary="Historical time-series trend analytics")
def get_trend_analytics(
    metric: str = Query("availability", regex="^(availability|delay|workload)$"),
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = analytics_service.get_trend_analytics(db=db, metric=metric, days=days)
    return ApiResponse(
        data=TrendAnalyticsResponse(
            metric=metric,
            days=days,
            data=data
        ),
        message="Trend analytics retrieved successfully"
    )
