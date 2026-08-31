from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_role
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.common import ApiResponse
from app.services import department_service

router = APIRouter(prefix="/departments", tags=["Departments"])

@router.get("", response_model=ApiResponse[List[DepartmentResponse]], summary="List all departments")
def get_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    depts = department_service.list_departments(db)
    return ApiResponse(
        data=[DepartmentResponse.model_validate(d) for d in depts],
        message="Departments retrieved successfully"
    )

@router.get("/{department_id}", response_model=ApiResponse[DepartmentResponse], summary="Get department details")
def get_department(
    department_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    dept = department_service.get_department_by_id(db, department_id)
    return ApiResponse(
        data=DepartmentResponse.model_validate(dept),
        message="Department retrieved successfully"
    )

@router.post("", response_model=ApiResponse[DepartmentResponse], status_code=status.HTTP_201_CREATED, summary="Create a new department")
def create_department(
    payload: DepartmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    dept = department_service.create_department(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=DepartmentResponse.model_validate(dept),
        message="Department created successfully"
    )

@router.put("/{department_id}", response_model=ApiResponse[DepartmentResponse], summary="Update department details")
def update_department(
    department_id: str,
    payload: DepartmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("SUPER_ADMIN"))
):
    dept = department_service.update_department(db, department_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=DepartmentResponse.model_validate(dept),
        message="Department updated successfully"
    )
