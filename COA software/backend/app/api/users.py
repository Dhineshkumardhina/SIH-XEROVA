from typing import List, Optional, Any
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_permission
from app.models.user import User
from app.schemas.auth import UserResponse, UserCreate, UserUpdate, DepartmentSummary
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import user_service

router = APIRouter(prefix="/users", tags=["Users"])

def build_user_response(user: User) -> UserResponse:
    dept_summary = None
    if user.department:
        dept_summary = DepartmentSummary(
            id=user.department.id,
            code=user.department.code,
            name=user.department.name
        )
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        roles=[r.code for r in user.roles],
        permissions=user.permissions,
        department=dept_summary,
        is_active=user.is_active,
        is_locked=user.is_locked,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.get("", summary="List registered users with filtering and pagination")
def list_users(
    page: Optional[int] = Query(None, ge=1),
    page_size: Optional[int] = Query(None, ge=1, le=100),
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_permission("USER_VIEW")),
    db: Session = Depends(get_db)
):
    target_page = page or (skip // (page_size or limit) + 1)
    target_size = page_size or limit

    users, meta = user_service.list_users(
        db=db, page=target_page, page_size=target_size,
        role=role, department=department, status=status, search=search
    )

    data = [build_user_response(u).model_dump() for u in users]

    # If page parameter is explicitly provided, return PaginatedResponse envelope
    if page is not None:
        return PaginatedResponse(
            data=PaginatedData(items=data, pagination=meta),
            message="Users retrieved successfully"
        )

    # Legacy response format for existing test suite compatibility
    return {
        "success": True,
        "data": data,
        "total": meta.total,
        "message": "Users retrieved successfully"
    }

@router.post("", status_code=status.HTTP_201_CREATED, summary="Create a new user account")
def create_user(
    payload: UserCreate,
    current_user: User = Depends(require_permission("USER_CREATE")),
    db: Session = Depends(get_db)
):
    user = user_service.create_user(db, payload, current_user=current_user)
    return {
        "success": True,
        "data": build_user_response(user).model_dump(),
        "message": f"User {user.username} created successfully"
    }

@router.get("/{user_id}", summary="Get user details by ID")
def get_user(
    user_id: str,
    current_user: User = Depends(require_permission("USER_VIEW")),
    db: Session = Depends(get_db)
):
    user = user_service.get_user_by_id(db, user_id)
    return {
        "success": True,
        "data": build_user_response(user).model_dump(),
        "message": "User retrieved successfully"
    }

@router.put("/{user_id}", summary="Update user account")
def update_user(
    user_id: str,
    payload: UserUpdate,
    current_user: User = Depends(require_permission("USER_UPDATE")),
    db: Session = Depends(get_db)
):
    user = user_service.update_user(db, user_id, payload, current_user=current_user)
    return {
        "success": True,
        "data": build_user_response(user).model_dump(),
        "message": "User updated successfully"
    }

@router.delete("/{user_id}", summary="Delete user account")
def delete_user(
    user_id: str,
    current_user: User = Depends(require_permission("USER_DELETE")),
    db: Session = Depends(get_db)
):
    user_service.delete_user(db, user_id, current_user=current_user)
    return {
        "success": True,
        "message": "User deleted successfully"
    }

@router.post("/{user_id}/activate", summary="Activate user account")
def activate_user(
    user_id: str,
    current_user: User = Depends(require_permission("USER_UPDATE")),
    db: Session = Depends(get_db)
):
    user = user_service.set_user_active_status(db, user_id, is_active=True, current_user=current_user)
    return {
        "success": True,
        "data": build_user_response(user).model_dump(),
        "message": f"User {user.username} activated successfully"
    }

@router.post("/{user_id}/deactivate", summary="Deactivate user account")
def deactivate_user(
    user_id: str,
    current_user: User = Depends(require_permission("USER_UPDATE")),
    db: Session = Depends(get_db)
):
    user = user_service.set_user_active_status(db, user_id, is_active=False, current_user=current_user)
    return {
        "success": True,
        "data": build_user_response(user).model_dump(),
        "message": f"User {user.username} deactivated successfully"
    }

@router.post("/{user_id}/unlock", summary="Unlock a locked user account")
def unlock_user(
    user_id: str,
    current_user: User = Depends(require_permission("USER_UPDATE")),
    db: Session = Depends(get_db)
):
    user = user_service.unlock_user_account(db, user_id, current_user=current_user)
    return {
        "success": True,
        "data": build_user_response(user).model_dump(),
        "message": f"User {user.username} account unlocked successfully"
    }
