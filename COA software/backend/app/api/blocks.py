from typing import Optional, List, Union
from fastapi import APIRouter, Depends, Query, status, Request
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.schemas.block import (
    BlockRequestCreate, BlockRequestUpdate, BlockRequestResponse,
    BlockRequestRejectPayload, BlockRequestCancelPayload,
    BlockPlanCreate, BlockPlanUpdate, BlockPlanResponse,
    BlockConflictResponse, BlockImpactResponse, BlockConflictDetail
)
from app.schemas.maintenance import MaintenanceTaskResponse
from app.schemas.train import TrainScheduleResponse
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.schemas.conflict import (
    BlockEvaluationRequest, BlockEvaluationResponse, BlockEvaluationData,
    FeasibleWindowsRequest, FeasibleWindowsResponse, FeasibleWindowItem
)
from app.services import block_service
from app.services.block_conflict_service import block_conflict_service

router = APIRouter(prefix="/blocks", tags=["Blocks"])

# ── Block Requests ───────────────────────────────────────────────────

@router.get("/requests", response_model=PaginatedResponse[BlockRequestResponse], summary="List block requests with filters")
def get_block_requests(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    department: Optional[str] = Query(None),
    corridor: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, meta = block_service.list_block_requests(
        db=db, page=page, page_size=page_size, department_id=department,
        corridor_id=corridor, status=status, priority=priority, search=search
    )
    return PaginatedResponse(
        data=PaginatedData(items=[BlockRequestResponse.model_validate(r) for r in items], pagination=meta),
        message="Block requests retrieved successfully"
    )

@router.post("/requests", response_model=ApiResponse[BlockRequestResponse], status_code=status.HTTP_201_CREATED, summary="Create a block request")
def create_block_request(
    payload: BlockRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_CREATE"))
):
    req = block_service.create_block_request(db, payload, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request created successfully"
    )

@router.get("/requests/{request_id}", response_model=ApiResponse[BlockRequestResponse], summary="Get block request details")
def get_block_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    req = block_service.get_block_request_by_id(db, request_id)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request retrieved successfully"
    )

@router.put("/requests/{request_id}", response_model=ApiResponse[BlockRequestResponse], summary="Update block request")
def update_block_request(
    request_id: str,
    payload: BlockRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    req = block_service.update_block_request(db, request_id, payload, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request updated successfully"
    )

@router.delete("/requests/{request_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete block request")
def delete_block_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    block_service.delete_block_request(db, request_id, user=current_user)
    return None

@router.post("/requests/{request_id}/submit", response_model=ApiResponse[BlockRequestResponse], summary="Submit block request for analysis")
def submit_block_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_CREATE"))
):
    req = block_service.submit_block_request(db, request_id, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request submitted successfully"
    )

@router.post("/requests/{request_id}/approve", response_model=ApiResponse[BlockRequestResponse], summary="Approve block request (Control Officer)")
def approve_block_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_APPROVE"))
):
    req = block_service.approve_block_request(db, request_id, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request approved successfully"
    )

@router.post("/requests/{request_id}/reject", response_model=ApiResponse[BlockRequestResponse], summary="Reject block request (Control Officer)")
def reject_block_request(
    request_id: str,
    payload: BlockRequestRejectPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_REJECT"))
):
    req = block_service.reject_block_request(db, request_id, reason=payload.rejection_reason, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request rejected"
    )

@router.post("/requests/{request_id}/cancel", response_model=ApiResponse[BlockRequestResponse], summary="Cancel block request")
def cancel_block_request(
    request_id: str,
    payload: BlockRequestCancelPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    req = block_service.cancel_block_request(db, request_id, reason=payload.cancellation_reason, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request cancelled"
    )

@router.post("/requests/{request_id}/validate", response_model=ApiResponse[BlockConflictDetail], summary="Validate block request")
def validate_block_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_VALIDATE"))
):
    conflicts = block_service.validate_block_request(db, request_id, user=current_user)
    return ApiResponse(
        data=conflicts,
        message="Block request validated successfully"
    )

@router.post("/requests/{request_id}/complete", response_model=ApiResponse[BlockRequestResponse], summary="Complete block request")
def complete_block_request(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_COMPLETE"))
):
    req = block_service.complete_block_request(db, request_id, user=current_user)
    return ApiResponse(
        data=BlockRequestResponse.model_validate(req),
        message="Block request completed"
    )

@router.get("/requests/{request_id}/conflicts", response_model=ApiResponse[BlockConflictDetail], summary="Check request conflicts")
def get_block_request_conflicts(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    conflicts = block_service.get_block_request_conflicts(db, request_id)
    return ApiResponse(
        data=conflicts,
        message="Conflicts checked"
    )

@router.get("/requests/{request_id}/tasks", response_model=ApiResponse[List[MaintenanceTaskResponse]], summary="Get tasks for request")
def get_block_request_tasks(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    tasks = block_service.get_block_request_tasks(db, request_id)
    return ApiResponse(
        data=[MaintenanceTaskResponse.model_validate(t) for t in tasks],
        message="Tasks retrieved"
    )

@router.post("/requests/{request_id}/tasks", response_model=ApiResponse[MaintenanceTaskResponse], summary="Add task to request")
def add_block_request_task(
    request_id: str,
    task_id: str = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    task = block_service.add_block_request_task(db, request_id, task_id, user=current_user)
    return ApiResponse(
        data=MaintenanceTaskResponse.model_validate(task),
        message="Task added to request"
    )

@router.delete("/requests/{request_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove task from request")
def remove_block_request_task(
    request_id: str,
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    block_service.remove_block_request_task(db, request_id, task_id, user=current_user)
    return None

@router.post("/requests/{request_id}/train-impact", summary="Calculate and save train impact for block request")
def calculate_block_request_train_impact(
    request_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    from app.services.train_impact_service import train_impact_service
    data = train_impact_service.calculate_block_train_impact(db, request_id)
    return ApiResponse(
        data=data,
        message="Block request train impact calculated successfully"
    )

@router.post("/evaluate", response_model=BlockEvaluationResponse, summary="Evaluate candidate block for conflicts and feasibility")
def evaluate_block(
    payload: BlockEvaluationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = block_conflict_service.evaluate_block(
        db=db,
        corridor_id=payload.corridor_id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        task_ids=payload.task_ids,
        isolation_required=payload.isolation_required or False,
        exclude_block_id=payload.exclude_block_id
    )
    return BlockEvaluationResponse(
        data=BlockEvaluationData(**data),
        message="Block evaluated successfully"
    )

@router.post("/feasible-windows", response_model=FeasibleWindowsResponse, summary="Find ranked feasible possession windows")
def find_feasible_windows(
    payload: FeasibleWindowsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    windows = block_conflict_service.find_feasible_windows(
        db=db,
        corridor_id=payload.corridor_id,
        target_date=payload.date,
        duration_minutes=payload.duration_minutes,
        preferred_start_hour=payload.preferred_start_hour or 0,
        preferred_end_hour=payload.preferred_end_hour or 24,
        task_ids=payload.task_ids
    )
    return FeasibleWindowsResponse(
        data=[FeasibleWindowItem(**w) for w in windows],
        message="Feasible windows found"
    )

# ── Block Plans ──────────────────────────────────────────────────────

@router.get("", summary="List block plans")
def get_block_plans(
    request: Request,
    page: Optional[int] = Query(None, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    corridor: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    target_page = page or 1
    items, meta = block_service.list_block_plans(
        db=db, page=target_page, page_size=page_size, corridor_id=corridor, status=status
    )
    serialized = [
        BlockPlanResponse(
            id=p.id,
            plan_code=p.plan_code,
            corridor_id=p.corridor_id,
            corridor=p.corridor.name if p.corridor else "",
            start_time=p.planned_start_at,
            end_time=p.planned_end_at,
            planned_start_at=p.planned_start_at,
            planned_end_at=p.planned_end_at,
            duration_minutes=p.duration_minutes,
            status=p.status,
            tasks_included=p.tasks_included,
            departments=p.departments,
            train_impact=p.expected_train_delay or 0,
            expected_delay_minutes=p.expected_train_delay or 0,
            downtime_saved_minutes=int((p.asset_availability_gain or 0.0) * 10),
            optimization_score=p.optimization_score or 90.0,
            confidence_score=95.0,
            ai_reason="Consolidated Multi-Department Block",
            approved_by=p.approved_by,
            approved_at=p.approved_at,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in items
    ]

    # If page parameter is not explicitly provided, maintain legacy raw list response for compatibility
    if page is None:
        return serialized

    return PaginatedResponse(
        data=PaginatedData(items=serialized, pagination=meta),
        message="Block plans retrieved successfully"
    )

@router.get("/{block_id}", response_model=ApiResponse[BlockPlanResponse], summary="Get block plan details")
def get_block_plan(
    block_id: str,
    db: Session = Depends(get_db)
):
    p = block_service.get_block_plan_by_id(db, block_id)
    return ApiResponse(
        data=BlockPlanResponse(
            id=p.id,
            plan_code=p.plan_code,
            corridor_id=p.corridor_id,
            corridor=p.corridor.name if p.corridor else "",
            start_time=p.planned_start_at,
            end_time=p.planned_end_at,
            planned_start_at=p.planned_start_at,
            planned_end_at=p.planned_end_at,
            duration_minutes=p.duration_minutes,
            status=p.status,
            tasks_included=p.tasks_included,
            departments=p.departments,
            train_impact=p.expected_train_delay or 0,
            expected_delay_minutes=p.expected_train_delay or 0,
            downtime_saved_minutes=int((p.asset_availability_gain or 0.0) * 10),
            optimization_score=p.optimization_score or 90.0,
            confidence_score=95.0,
            ai_reason="Consolidated Multi-Department Block",
            approved_by=p.approved_by,
            approved_at=p.approved_at,
            created_at=p.created_at,
            updated_at=p.updated_at
        ),
        message="Block plan retrieved successfully"
    )

@router.post("", response_model=ApiResponse[BlockPlanResponse], status_code=status.HTTP_201_CREATED, summary="Create a block plan")
def create_block_plan(
    payload: BlockPlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_CREATE"))
):
    plan = block_service.create_block_plan(db, payload, user=current_user)
    return ApiResponse(
        data=BlockPlanResponse.model_validate(plan),
        message="Block plan created successfully"
    )

@router.put("/{block_id}", response_model=ApiResponse[BlockPlanResponse], summary="Update block plan")
def update_block_plan(
    block_id: str,
    payload: BlockPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    plan = block_service.update_block_plan(db, block_id, payload, user=current_user)
    return ApiResponse(
        data=BlockPlanResponse.model_validate(plan),
        message="Block plan updated successfully"
    )

@router.patch("/{plan_id}/approve", response_model=BlockPlanResponse, summary="Approve block plan")
def approve_block_plan(
    plan_id: str,
    current_user: User = Depends(require_permission("BLOCK_APPROVE")),
    db: Session = Depends(get_db)
):
    plan = block_service.approve_block_plan(db, plan_id, user=current_user)
    return BlockPlanResponse(
        id=plan.id,
        plan_code=plan.plan_code,
        corridor_id=plan.corridor_id,
        corridor=plan.corridor.name if plan.corridor else "",
        start_time=plan.planned_start_at,
        end_time=plan.planned_end_at,
        planned_start_at=plan.planned_start_at,
        planned_end_at=plan.planned_end_at,
        duration_minutes=plan.duration_minutes,
        status=plan.status,
        tasks_included=plan.tasks_included,
        departments=plan.departments,
        train_impact=plan.expected_train_delay or 0,
        expected_delay_minutes=plan.expected_train_delay or 0,
        downtime_saved_minutes=int((plan.asset_availability_gain or 0.0) * 10),
        optimization_score=plan.optimization_score or 90.0,
        confidence_score=95.0,
        ai_reason="Block approved by human operator",
        approved_by=plan.approved_by,
        approved_at=plan.approved_at,
        created_at=plan.created_at,
        updated_at=plan.updated_at
    )

@router.get("/{block_id}/tasks", response_model=List[MaintenanceTaskResponse], summary="Get maintenance tasks included in block")
def get_block_plan_tasks(
    block_id: str,
    db: Session = Depends(get_db)
):
    tasks = block_service.get_block_plan_tasks(db, block_id)
    return [MaintenanceTaskResponse.model_validate(t) for t in tasks]

@router.get("/{block_id}/conflicts", response_model=List[BlockConflictResponse], summary="Get conflicts identified for block plan")
def get_block_plan_conflicts(
    block_id: str,
    db: Session = Depends(get_db)
):
    return block_service.get_block_plan_conflicts(db, block_id)

@router.get("/{block_id}/trains", response_model=List[TrainScheduleResponse], summary="Get train schedules affected by block")
def get_block_plan_trains(
    block_id: str,
    db: Session = Depends(get_db)
):
    schedules = block_service.get_block_plan_trains(db, block_id)
    return [TrainScheduleResponse.model_validate(s) for s in schedules]

@router.get("/{block_id}/impact", response_model=ApiResponse[BlockImpactResponse], summary="Get operational impact analysis for block")
def get_block_plan_impact(
    block_id: str,
    db: Session = Depends(get_db)
):
    impact = block_service.get_block_plan_impact(db, block_id)
    return ApiResponse(
        data=impact,
        message="Block impact analysis retrieved successfully"
    )
