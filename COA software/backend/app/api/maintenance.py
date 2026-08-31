from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceTaskCreate, MaintenanceTaskUpdate, MaintenanceTaskComplete,
    MaintenanceTaskCancel, MaintenanceTaskResponse
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.services import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])

@router.get("/tasks", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="List maintenance tasks with filters")
def get_maintenance_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    department: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    asset: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    task_type: Optional[str] = Query(None),
    block_required: Optional[bool] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = maintenance_service.list_tasks(
        db=db, page=page, page_size=page_size, department_id=department, corridor_id=corridor,
        asset_id=asset, status=status, priority=priority, task_type=task_type,
        block_required=block_required, date_from=date_from, date_to=date_to, search=search
    )
    return PaginatedResponse(
        data=PaginatedData(items=[MaintenanceTaskResponse.model_validate(t) for t in items], pagination=meta),
        message="Maintenance tasks retrieved successfully"
    )

@router.post("/tasks", response_model=ApiResponse[MaintenanceTaskResponse], status_code=status.HTTP_201_CREATED, summary="Create a new maintenance task")
def create_maintenance_task(
    payload: MaintenanceTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MAINTENANCE_CREATE"))
):
    task = maintenance_service.create_task(db, payload, user_id=current_user.id)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Maintenance task created successfully"
    )

@router.get("/tasks/{task_id}", response_model=ApiResponse[MaintenanceTaskResponse], summary="Get maintenance task details")
def get_maintenance_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    task = maintenance_service.get_task_by_id(db, task_id)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Maintenance task retrieved successfully"
    )

@router.put("/tasks/{task_id}", response_model=ApiResponse[MaintenanceTaskResponse], summary="Update maintenance task")
def update_maintenance_task(
    task_id: str,
    payload: MaintenanceTaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MAINTENANCE_UPDATE"))
):
    task = maintenance_service.update_task(db, task_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Maintenance task updated successfully"
    )

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete maintenance task")
def delete_maintenance_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MAINTENANCE_UPDATE"))
):
    maintenance_service.delete_task(db, task_id, user_id=current_user.id)
    return None

@router.post("/tasks/{task_id}/complete", response_model=ApiResponse[MaintenanceTaskResponse], summary="Mark maintenance task as complete")
def complete_maintenance_task(
    task_id: str,
    payload: MaintenanceTaskComplete,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MAINTENANCE_COMPLETE"))
):
    task = maintenance_service.complete_task(db, task_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Maintenance task completed successfully"
    )

@router.post("/tasks/{task_id}/cancel", response_model=ApiResponse[MaintenanceTaskResponse], summary="Cancel maintenance task")
def cancel_maintenance_task(
    task_id: str,
    payload: MaintenanceTaskCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MAINTENANCE_UPDATE"))
):
    task = maintenance_service.cancel_task(db, task_id, payload, user_id=current_user.id)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Maintenance task cancelled"
    )

@router.get("/overdue", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="Get overdue maintenance tasks")
def get_overdue_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = maintenance_service.get_overdue_tasks(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[MaintenanceTaskResponse.model_validate(t) for t in items], pagination=meta),
        message="Overdue tasks retrieved successfully"
    )

@router.get("/critical", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="Get critical maintenance tasks")
def get_critical_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = maintenance_service.get_critical_tasks(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[MaintenanceTaskResponse.model_validate(t) for t in items], pagination=meta),
        message="Critical tasks retrieved successfully"
    )

@router.get("/today", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="Get tasks scheduled for today")
def get_today_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = maintenance_service.get_today_tasks(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[MaintenanceTaskResponse.model_validate(t) for t in items], pagination=meta),
        message="Today's tasks retrieved successfully"
    )

@router.get("/upcoming", response_model=PaginatedResponse[MaintenanceTaskResponse], summary="Get upcoming maintenance tasks")
def get_upcoming_tasks(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = maintenance_service.get_upcoming_tasks(db, page=page, page_size=page_size)
    return PaginatedResponse(
        data=PaginatedData(items=[MaintenanceTaskResponse.model_validate(t) for t in items], pagination=meta),
        message="Upcoming tasks retrieved successfully"
    )

@router.post("/tasks/{task_id}/start", response_model=ApiResponse[MaintenanceTaskResponse], summary="Start maintenance task")
def start_maintenance_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("MAINTENANCE_UPDATE"))
):
    task = maintenance_service.start_task(db, task_id, user_id=current_user.id)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Maintenance task started successfully"
    )

@router.get("/analytics", response_model=ApiResponse[dict], summary="Get maintenance analytics")
def get_maintenance_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = maintenance_service.get_maintenance_analytics(db)
    return ApiResponse(data=data, message="Maintenance analytics retrieved")

@router.get("/department-workload", response_model=ApiResponse[list], summary="Get maintenance workload by department")
def get_department_workload(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = maintenance_service.get_department_workload(db)
    return ApiResponse(data=data, message="Department workload retrieved")
