from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_role
from app.models.user import User
from app.schemas.corridor import CorridorCreate, CorridorUpdate, CorridorResponse, CorridorAvailabilityResponse
from app.schemas.asset import AssetResponse
from app.schemas.maintenance import MaintenanceTaskResponse
from app.schemas.train import TrainScheduleResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import corridor_service

router = APIRouter(prefix="/corridors", tags=["Corridors"])

@router.get("", response_model=PaginatedResponse[CorridorResponse], summary="List railway corridors")
def get_corridors(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search corridor code or name"),
    status: Optional[str] = Query(None, description="Filter by operational status"),
    electrified: Optional[bool] = Query(None, description="Filter by electrification"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = corridor_service.list_corridors(
        db=db, page=page, page_size=page_size, search=search, status=status, electrified=electrified
    )
    return PaginatedResponse(
        data=PaginatedData(
            items=[CorridorResponse.model_validate(c) for c in items],
            pagination=meta
        ),
        message="Corridors retrieved successfully"
    )

@router.get("/{corridor_id}", response_model=ApiResponse[CorridorResponse], summary="Get corridor details")
def get_corridor(
    corridor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    c = corridor_service.get_corridor_by_id(db, corridor_id)
    return ApiResponse(
        data=CorridorResponse.model_validate(c),
        message="Corridor retrieved successfully"
    )

@router.post("", response_model=ApiResponse[CorridorResponse], status_code=status.HTTP_201_CREATED, summary="Create a new corridor")
def create_corridor(
    payload: CorridorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    c = corridor_service.create_corridor(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=CorridorResponse.model_validate(c),
        message="Corridor created successfully"
    )

@router.put("/{corridor_id}", response_model=ApiResponse[CorridorResponse], summary="Update corridor details")
def update_corridor(
    corridor_id: str,
    payload: CorridorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    c = corridor_service.update_corridor(db, corridor_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=CorridorResponse.model_validate(c),
        message="Corridor updated successfully"
    )

@router.delete("/{corridor_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete corridor")
def delete_corridor(
    corridor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    corridor_service.delete_corridor(db, corridor_id, user_id=current_user.id)
    return None

@router.get("/{corridor_id}/assets", response_model=PaginatedResponse[AssetResponse], summary="Get assets along corridor")
def get_corridor_assets(
    corridor_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = corridor_service.get_corridor_assets(db, corridor_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(
            items=[AssetResponse.model_validate(a) for a in items],
            pagination=meta
        ),
        message="Corridor assets retrieved successfully"
    )

@router.get("/{corridor_id}/maintenance", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="Get maintenance tasks on corridor")
def get_corridor_maintenance(
    corridor_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = corridor_service.get_corridor_maintenance(db, corridor_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(
            items=[MaintenanceTaskResponse.model_validate(m) for m in items],
            pagination=meta
        ),
        message="Corridor maintenance retrieved successfully"
    )

@router.get("/{corridor_id}/trains", response_model=PaginatedResponse[TrainScheduleResponse], summary="Get trains traversing corridor")
def get_corridor_trains(
    corridor_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = corridor_service.get_corridor_trains(db, corridor_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(
            items=[TrainScheduleResponse.model_validate(t) for t in items],
            pagination=meta
        ),
        message="Corridor trains retrieved successfully"
    )

@router.get("/{corridor_id}/availability", response_model=ApiResponse[CorridorAvailabilityResponse], summary="Get corridor availability metrics")
def get_corridor_availability(
    corridor_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    res = corridor_service.get_corridor_availability(db, corridor_id)
    return ApiResponse(
        data=res,
        message="Corridor availability retrieved successfully"
    )

@router.get("/{corridor_id}/train-density", response_model=ApiResponse[dict], summary="Get corridor train density")
def get_corridor_train_density(
    corridor_id: str,
    start_date: str = Query(..., description="Start date/time (ISO format)"),
    end_date: str = Query(..., description="End date/time (ISO format)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    from datetime import datetime
    from app.services.train_occupancy_service import calculate_train_density
    
    start = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    end = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    data = calculate_train_density(db, corridor_id, start, end)
    return ApiResponse(
        data=data,
        message="Corridor train density retrieved successfully"
    )
