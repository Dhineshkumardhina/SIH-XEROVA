from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_role
from app.models.user import User
from app.schemas.station import StationCreate, StationUpdate, StationResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import station_service

router = APIRouter(prefix="/stations", tags=["Stations"])

@router.get("", response_model=PaginatedResponse[StationResponse], summary="List railway stations")
def get_stations(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(25, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search station code or name"),
    division_id: Optional[str] = Query(None, description="Filter by railway division"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = station_service.list_stations(
        db=db, page=page, page_size=page_size, search=search, division_id=division_id
    )
    return PaginatedResponse(
        data=PaginatedData(
            items=[StationResponse.model_validate(s) for s in items],
            pagination=meta
        ),
        message="Stations retrieved successfully"
    )

@router.get("/{station_id}", response_model=ApiResponse[StationResponse], summary="Get station details")
def get_station(
    station_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    stn = station_service.get_station_by_id(db, station_id)
    return ApiResponse(
        data=StationResponse.model_validate(stn),
        message="Station retrieved successfully"
    )

@router.post("", response_model=ApiResponse[StationResponse], status_code=status.HTTP_201_CREATED, summary="Create a new station")
def create_station(
    payload: StationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    stn = station_service.create_station(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=StationResponse.model_validate(stn),
        message="Station created successfully"
    )

@router.put("/{station_id}", response_model=ApiResponse[StationResponse], summary="Update station details")
def update_station(
    station_id: str,
    payload: StationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    stn = station_service.update_station(db, station_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=StationResponse.model_validate(stn),
        message="Station updated successfully"
    )

@router.delete("/{station_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete station")
def delete_station(
    station_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    station_service.delete_station(db, station_id, user_id=current_user.id)
    return None
