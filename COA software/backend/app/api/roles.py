from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, require_permission
from app.models.role import Role
from app.models.permission import Permission
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.auth import RoleResponse, RoleUpdateRequest, PermissionResponse

router = APIRouter(tags=["Roles & Permissions"])

def build_role_response(role: Role) -> RoleResponse:
    return RoleResponse(
        id=role.id,
        code=role.code,
        name=role.name,
        description=role.description,
        permissions=[p.code for p in role.permissions]
    )

def audit_log_role_action(db: Session, actor_id: str, action: str, role_id: str, description: str):
    try:
        log = AuditLog(
            user_id=actor_id,
            action=action,
            entity_type="ROLE",
            entity_id=role_id,
            description=description
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

@router.get("/roles")
def list_roles(
    current_user: User = Depends(require_permission("ROLE_VIEW")),
    db: Session = Depends(get_db)
):
    """Retrieve all available system roles."""
    roles = db.query(Role).all()
    data = [build_role_response(r).model_dump() for r in roles]
    return {
        "success": True,
        "data": data,
        "message": f"Retrieved {len(data)} roles"
    }

@router.get("/roles/{role_id}")
def get_role(
    role_id: str,
    current_user: User = Depends(require_permission("ROLE_VIEW")),
    db: Session = Depends(get_db)
):
    """Retrieve specific role by ID."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail={"code": "ROLE_NOT_FOUND", "message": "Role not found."})
    return {
        "success": True,
        "data": build_role_response(role).model_dump(),
        "message": "Role retrieved"
    }

@router.put("/roles/{role_id}")
def update_role(
    role_id: str,
    payload: RoleUpdateRequest,
    current_user: User = Depends(require_permission("ROLE_UPDATE")),
    db: Session = Depends(get_db)
):
    """Update role metadata or permissions."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail={"code": "ROLE_NOT_FOUND", "message": "Role not found."})

    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    if payload.permission_codes is not None:
        perms = db.query(Permission).filter(Permission.code.in_(payload.permission_codes)).all()
        role.permissions = perms

    db.commit()
    db.refresh(role)

    audit_log_role_action(
        db, actor_id=current_user.id, action="ROLE_UPDATED",
        role_id=role.id, description=f"Updated role {role.code}"
    )

    return {
        "success": True,
        "data": build_role_response(role).model_dump(),
        "message": f"Role {role.code} updated successfully"
    }

@router.get("/permissions")
def list_permissions(
    current_user: User = Depends(require_permission("ROLE_VIEW")),
    db: Session = Depends(get_db)
):
    """List all available system permissions."""
    permissions = db.query(Permission).all()
    data = [
        PermissionResponse(
            id=p.id,
            code=p.code,
            name=p.name,
            description=p.description,
            resource=p.resource,
            action=p.action
        ).model_dump() for p in permissions
    ]
    return {
        "success": True,
        "data": data,
        "message": f"Retrieved {len(data)} permissions"
    }
