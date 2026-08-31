from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.schemas.defect import DefectCreate, DefectUpdate, DefectResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import defect_service

router = APIRouter(prefix="/defects", tags=["Defects"])

@router.get("", response_model=PaginatedResponse[DefectResponse], summary="List defects with filters")
def get_defects(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    severity: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    asset: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = defect_service.list_defects(
        db=db, page=page, page_size=page_size, severity=severity, department_id=department,
        corridor_id=corridor, asset_id=asset, status=status, date_from=date_from,
        date_to=date_to, search=search
    )
    return PaginatedResponse(
        data=PaginatedData(items=[DefectResponse.model_validate(d) for d in items], pagination=meta),
        message="Defects retrieved successfully"
    )

@router.post("", response_model=ApiResponse[DefectResponse], status_code=status.HTTP_201_CREATED, summary="Record a new defect")
def create_defect(
    payload: DefectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_CREATE"))
):
    defect = defect_service.create_defect(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=DefectResponse.model_validate(defect),
        message="Defect recorded successfully"
    )

@router.get("/critical", response_model=PaginatedResponse[DefectResponse], summary="Get critical defects")
def get_critical_defects(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = defect_service.get_critical_defects(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[DefectResponse.model_validate(d) for d in items], pagination=meta),
        message="Critical defects retrieved successfully"
    )

@router.get("/high-risk", response_model=PaginatedResponse[DefectResponse], summary="Get high-risk defects")
def get_high_risk_defects(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = defect_service.get_high_risk_defects(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[DefectResponse.model_validate(d) for d in items], pagination=meta),
        message="High-risk defects retrieved successfully"
    )

@router.get("/{defect_id}", response_model=ApiResponse[DefectResponse], summary="Get defect details")
def get_defect(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    defect = defect_service.get_defect_by_id(db, defect_id)
    return ApiResponse(
        data=DefectResponse.model_validate(defect),
        message="Defect retrieved successfully"
    )

@router.put("/{defect_id}", response_model=ApiResponse[DefectResponse], summary="Update defect details")
def update_defect(
    defect_id: str,
    payload: DefectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_UPDATE"))
):
    defect = defect_service.update_defect(db, defect_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=DefectResponse.model_validate(defect),
        message="Defect updated successfully"
    )

@router.delete("/{defect_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete defect")
def delete_defect(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_UPDATE"))
):
    defect_service.delete_defect(db, defect_id, user_id=current_user.id)
    return None

from pydantic import BaseModel
class AssignPayload(BaseModel):
    assigned_to: str

class ResolvePayload(BaseModel):
    resolution_notes: str

@router.post("/{defect_id}/assign", response_model=ApiResponse[DefectResponse], summary="Assign a defect")
def assign_defect(
    defect_id: str,
    payload: AssignPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_UPDATE"))
):
    defect = defect_service.assign_defect(db, defect_id, payload.assigned_to, user_id=current_user.id)
    return ApiResponse(data=DefectResponse.model_validate(defect), message="Defect assigned successfully")

@router.post("/{defect_id}/start", response_model=ApiResponse[DefectResponse], summary="Start resolving a defect")
def start_resolution(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_UPDATE"))
):
    defect = defect_service.start_resolution(db, defect_id, user_id=current_user.id)
    return ApiResponse(data=DefectResponse.model_validate(defect), message="Defect resolution started")

@router.post("/{defect_id}/resolve", response_model=ApiResponse[DefectResponse], summary="Resolve a defect")
def resolve_defect(
    defect_id: str,
    payload: ResolvePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_UPDATE"))
):
    defect = defect_service.resolve_defect(db, defect_id, payload.resolution_notes, user_id=current_user.id)
    return ApiResponse(data=DefectResponse.model_validate(defect), message="Defect resolved successfully")

@router.post("/{defect_id}/close", response_model=ApiResponse[DefectResponse], summary="Close a defect")
def close_defect(
    defect_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("DEFECT_UPDATE"))
):
    defect = defect_service.close_defect(db, defect_id, user_id=current_user.id)
    return ApiResponse(data=DefectResponse.model_validate(defect), message="Defect closed successfully")

@router.get("/status/overdue", response_model=PaginatedResponse[DefectResponse], summary="Get overdue defects")
def get_overdue_defects(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = defect_service.get_overdue_defects(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[DefectResponse.model_validate(d) for d in items], pagination=meta),
        message="Overdue defects retrieved successfully"
    )

@router.get("/metrics/analytics", response_model=ApiResponse[dict], summary="Get defect analytics")
def get_defect_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = defect_service.get_defect_analytics(db)
    return ApiResponse(data=data, message="Defect analytics retrieved")

@router.get("/metrics/department-breakdown", response_model=ApiResponse[list], summary="Get department breakdown")
def get_department_breakdown(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = defect_service.get_department_breakdown(db)
    return ApiResponse(data=data, message="Department breakdown retrieved")

@router.get("/metrics/corridor-intelligence", response_model=ApiResponse[list], summary="Get corridor intelligence")
def get_corridor_intelligence(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = defect_service.get_corridor_intelligence(db)
    return ApiResponse(data=data, message="Corridor intelligence retrieved")

@router.get("/metrics/trends", response_model=ApiResponse[list], summary="Get defect trends")
def get_defect_trends(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = defect_service.get_defect_trends(db)
    return ApiResponse(data=data, message="Defect trends retrieved")
