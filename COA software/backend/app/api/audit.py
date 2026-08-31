from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_permission
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import audit_service

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("", response_model=PaginatedResponse[AuditLogResponse], summary="List system audit logs")
def get_audit_logs(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    entity_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("AUDIT_VIEW"))
):
    items, meta = audit_service.list_audit_logs(
        db=db, page=page, page_size=page_size, entity_type=entity_type,
        action=action, date_from=date_from, date_to=date_to
    )
    return PaginatedResponse(
        data=PaginatedData(items=[AuditLogResponse.model_validate(a) for a in items], pagination=meta),
        message="Audit logs retrieved successfully"
    )

@router.get("/{id}", response_model=ApiResponse[AuditLogResponse], summary="Get audit log details")
def get_audit_log(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("AUDIT_VIEW"))
):
    log = audit_service.get_audit_log_by_id(db, audit_id=id)
    return ApiResponse(
        data=AuditLogResponse.model_validate(log),
        message="Audit log retrieved successfully"
    )
