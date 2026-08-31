from typing import Optional, List, Union
from fastapi import APIRouter, Depends, Query, status, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetResponse, AssetHealthResponse, AssetRiskResponse
)
from app.schemas.defect import DefectResponse
from app.schemas.maintenance import MaintenanceTaskResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import asset_service

router = APIRouter(prefix="/assets", tags=["Assets"])

@router.get("", summary="List assets with filtering and pagination")
def get_assets(
    request: Request,
    page: Optional[int] = Query(None, ge=1),
    page_size: int = Query(25, ge=1),
    department: Optional[str] = Query(None, description="Department code or ID"),
    department_id: Optional[str] = Query(None),
    asset_type: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    corridor_id: Optional[str] = Query(None),
    station: Optional[str] = Query(None),
    station_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    criticality_min: Optional[float] = Query(None),
    criticality_max: Optional[float] = Query(None),
    health_min: Optional[float] = Query(None),
    health_max: Optional[float] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    dept = department or department_id
    corr = corridor or corridor_id
    stn = station or station_id

    target_page = page or 1
    items, meta = asset_service.list_assets(
        db=db,
        page=target_page,
        page_size=page_size,
        department_id=dept,
        asset_type=asset_type,
        corridor_id=corr,
        station_id=stn,
        status=status,
        criticality_min=criticality_min,
        criticality_max=criticality_max,
        health_min=health_min,
        health_max=health_max,
        search=search
    )

    serialized = [AssetResponse.model_validate(a) for a in items]

    # If page parameter is not explicitly given, maintain legacy raw list response for compatibility
    if page is None:
        return serialized

    return PaginatedResponse(
        data=PaginatedData(items=serialized, pagination=meta),
        message="Assets retrieved successfully"
    )

@router.get("/{asset_id}", response_model=ApiResponse[AssetResponse], summary="Get asset by ID or code")
def get_asset(
    asset_id: str,
    db: Session = Depends(get_db)
):
    asset = asset_service.get_asset_by_id(db, asset_id)
    return ApiResponse(
        data=AssetResponse.model_validate(asset),
        message="Asset retrieved successfully"
    )

@router.post("", response_model=ApiResponse[AssetResponse], status_code=status.HTTP_201_CREATED, summary="Create a new asset")
def create_asset(
    payload: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ASSET_CREATE"))
):
    asset = asset_service.create_asset(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=AssetResponse.model_validate(asset),
        message="Asset created successfully"
    )

@router.put("/{asset_id}", response_model=ApiResponse[AssetResponse], summary="Update asset details")
def update_asset(
    asset_id: str,
    payload: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ASSET_UPDATE"))
):
    asset = asset_service.update_asset(db, asset_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=AssetResponse.model_validate(asset),
        message="Asset updated successfully"
    )

@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete asset")
def delete_asset(
    asset_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("ASSET_UPDATE"))
):
    asset_service.delete_asset(db, asset_id, user_id=current_user.id)
    return None

@router.get("/{asset_id}/defects", response_model=PaginatedResponse[DefectResponse], summary="Get defects on asset")
def get_asset_defects(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, meta = asset_service.get_asset_defects(db, asset_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[DefectResponse.model_validate(d) for d in items], pagination=meta),
        message="Asset defects retrieved successfully"
    )

@router.get("/{asset_id}/maintenance", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="Get maintenance tasks on asset")
def get_asset_maintenance(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, meta = asset_service.get_asset_maintenance(db, asset_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[MaintenanceTaskResponse.model_validate(m) for m in items], pagination=meta),
        message="Asset maintenance tasks retrieved successfully"
    )

@router.get("/{asset_id}/history", summary="Get maintenance execution history on asset")
def get_asset_history(
    asset_id: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db)
):
    items, meta = asset_service.get_asset_history(db, asset_id, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[{"id": h.id, "action_taken": h.action_taken, "completed_at": h.completed_at} for h in items], pagination=meta),
        message="Asset maintenance history retrieved successfully"
    )

@router.get("/{asset_id}/health", response_model=ApiResponse[AssetHealthResponse], summary="Get asset health metrics")
def get_asset_health(
    asset_id: str,
    db: Session = Depends(get_db)
):
    health = asset_service.get_asset_health(db, asset_id)
    return ApiResponse(
        data=health,
        message="Asset health retrieved successfully"
    )

@router.get("/{asset_id}/risk", response_model=ApiResponse[AssetRiskResponse], summary="Get asset risk prediction and recommendations")
def get_asset_risk(
    asset_id: str,
    db: Session = Depends(get_db)
):
    risk = asset_service.get_asset_risk(db, asset_id)
    return ApiResponse(
        data=risk,
        message="Asset risk retrieved successfully"
    )
