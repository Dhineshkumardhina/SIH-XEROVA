from typing import Optional, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.audit import AuditLog
from app.core.pagination import paginate_query, PaginationMeta
from app.core.exceptions import ResourceNotFoundError

def create_audit_log(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: str,
    user_id: Optional[str] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> AuditLog:
    # Sanitize old_value / new_value to never persist passwords or secrets
    def sanitize(val: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not isinstance(val, dict):
            return val
        sanitized = dict(val)
        for key in ["password", "password_hash", "token", "access_token", "refresh_token", "jwt_secret"]:
            if key in sanitized:
                sanitized[key] = "******"
        return sanitized

    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id),
        old_value=sanitize(old_value),
        new_value=sanitize(new_value),
        request_id=request_id
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def list_audit_logs(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None
):
    query = db.query(AuditLog)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if action:
        query = query.filter(AuditLog.action == action)
    if date_from:
        query = query.filter(AuditLog.created_at >= date_from)
    if date_to:
        query = query.filter(AuditLog.created_at <= date_to)

    items, meta = paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=AuditLog.created_at.desc()
    )
    return items, meta

def get_audit_log_by_id(db: Session, audit_id: str) -> AuditLog:
    entry = db.query(AuditLog).filter(AuditLog.id == audit_id).first()
    if not entry:
        raise ResourceNotFoundError("AuditLog", audit_id)
    return entry
