from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.schemas.forecast import GoodsForecastCreate, GoodsForecastResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import forecast_service

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])

@router.get("/goods", response_model=PaginatedResponse[GoodsForecastResponse], summary="List goods traffic forecasts")
def get_goods_forecasts(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    corridor: Optional[str] = Query(None),
    date: Optional[datetime] = Query(None),
    hour: Optional[int] = Query(None, ge=0, le=23),
    traffic_density: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = forecast_service.list_goods_forecasts(
        db=db, page=page, page_size=page_size, corridor_id=corridor,
        date=date, hour=hour, traffic_density=traffic_density
    )
    return PaginatedResponse(
        data=PaginatedData(items=[GoodsForecastResponse.model_validate(f) for f in items], pagination=meta),
        message="Goods forecasts retrieved successfully"
    )

@router.post("/goods", response_model=ApiResponse[GoodsForecastResponse], status_code=status.HTTP_201_CREATED, summary="Create goods traffic forecast")
def create_goods_forecast(
    payload: GoodsForecastCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    forecast = forecast_service.create_goods_forecast(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=GoodsForecastResponse.model_validate(forecast),
        message="Goods forecast created successfully"
    )

@router.get("/goods/{forecast_id}", response_model=ApiResponse[GoodsForecastResponse], summary="Get goods forecast details")
def get_goods_forecast(
    forecast_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    forecast = forecast_service.get_goods_forecast_by_id(db, forecast_id)
    return ApiResponse(
        data=GoodsForecastResponse.model_validate(forecast),
        message="Goods forecast retrieved successfully"
    )
