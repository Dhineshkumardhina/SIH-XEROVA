from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.schemas.train import (
    TrainCreate, TrainUpdate, TrainResponse, TrainScheduleResponse, TrainMovementResponse
)
from app.schemas.forecast import GoodsForecastResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import train_service

router = APIRouter(prefix="/trains", tags=["Trains"])

@router.get("", response_model=PaginatedResponse[TrainResponse], summary="List trains with filters")
def get_trains(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    train_type: Optional[str] = Query(None),
    direction: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    station: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    is_goods_train: Optional[bool] = Query(None),
    is_passenger_train: Optional[bool] = Query(None),
    date: Optional[datetime] = Query(None),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = train_service.list_trains(
        db=db, page=page, page_size=page_size, train_type=train_type, direction=direction,
        corridor_id=corridor, station_id=station, search=search, status=status,
        is_goods_train=is_goods_train, is_passenger_train=is_passenger_train,
        date=date, start_date=start_date, end_date=end_date
    )
    return PaginatedResponse(
        data=PaginatedData(items=[TrainResponse.model_validate(t) for t in items], pagination=meta),
        message="Trains retrieved successfully"
    )

@router.get("/schedule", response_model=PaginatedResponse[TrainScheduleResponse], summary="Get train schedules")
def get_train_schedules(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    date: Optional[datetime] = Query(None),
    corridor: Optional[str] = Query(None),
    station: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = train_service.get_train_schedules(
        db=db, page=page, page_size=page_size, date=date, corridor_id=corridor, station_id=station
    )
    return PaginatedResponse(
        data=PaginatedData(items=[TrainScheduleResponse.model_validate(s) for s in items], pagination=meta),
        message="Train schedules retrieved successfully"
    )

@router.get("/movements", response_model=PaginatedResponse[TrainMovementResponse], summary="Get live/historical train movements")
def get_train_movements(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    date: Optional[datetime] = Query(None),
    corridor: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = train_service.get_train_movements(
        db=db, page=page, page_size=page_size, date=date, corridor_id=corridor, status=status
    )
    return PaginatedResponse(
        data=PaginatedData(items=[TrainMovementResponse.model_validate(m) for m in items], pagination=meta),
        message="Train movements retrieved successfully"
    )

@router.get("/forecast", response_model=PaginatedResponse[GoodsForecastResponse], summary="Get corridor train density forecast")
def get_train_forecast(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    corridor: Optional[str] = Query(None),
    date: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = train_service.get_train_forecast(
        db=db, page=page, page_size=page_size, corridor_id=corridor, date=date
    )
    return PaginatedResponse(
        data=PaginatedData(items=[GoodsForecastResponse.model_validate(f) for f in items], pagination=meta),
        message="Train forecast retrieved successfully"
    )

@router.get("/{train_id}", response_model=ApiResponse[TrainResponse], summary="Get train details")
def get_train(
    train_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    train = train_service.get_train_by_id(db, train_id)
    return ApiResponse(
        data=TrainResponse.model_validate(train),
        message="Train retrieved successfully"
    )

@router.get("/{train_id}/schedule", response_model=PaginatedResponse[TrainScheduleResponse], summary="Get train schedule for a specific train")
def get_train_schedule_by_id(
    train_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    from app.models.train import TrainSchedule
    from app.core.pagination import paginate_query
    
    query = db.query(TrainSchedule).filter(TrainSchedule.train_id == train_id)
    items, meta = paginate_query(query, page, page_size, default_sort=TrainSchedule.arrival_time.asc())
    
    return PaginatedResponse(
        data=PaginatedData(items=[TrainScheduleResponse.model_validate(s) for s in items], pagination=meta),
        message="Train schedule retrieved successfully"
    )

@router.get("/{train_id}/movements", response_model=PaginatedResponse[TrainMovementResponse], summary="Get train movements for a specific train")
def get_train_movements_by_id(
    train_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    from app.models.train import TrainMovement
    from app.core.pagination import paginate_query
    
    query = db.query(TrainMovement).filter(TrainMovement.train_id == train_id)
    items, meta = paginate_query(query, page, page_size, default_sort=TrainMovement.event_time.desc())
    
    return PaginatedResponse(
        data=PaginatedData(items=[TrainMovementResponse.model_validate(s) for s in items], pagination=meta),
        message="Train movements retrieved successfully"
    )

@router.post("", response_model=ApiResponse[TrainResponse], status_code=status.HTTP_201_CREATED, summary="Create a new train")
def create_train(
    payload: TrainCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("TRAIN_VIEW"))
):
    train = train_service.create_train(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=TrainResponse.model_validate(train),
        message="Train created successfully"
    )

@router.put("/{train_id}", response_model=ApiResponse[TrainResponse], summary="Update train details")
def update_train(
    train_id: str,
    payload: TrainUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("TRAIN_VIEW"))
):
    train = train_service.update_train(db, train_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=TrainResponse.model_validate(train),
        message="Train updated successfully"
    )
