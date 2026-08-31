from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.api.dependencies import get_db, require_authenticated_user, require_permission
from app.models.user import User
from app.models.block import BlockPlan
from app.schemas.common import ApiResponse
from app.schemas.planner import (
    DailyPlanGenerateRequest,
    WeeklyPlanGenerateRequest,
    MonthlyPlanGenerateRequest,
    BlockMovePayload,
    PlanPublishResponse
)
from app.ai.multi_horizon_planner import multi_horizon_planner

router = APIRouter(prefix="/planner", tags=["Multi-Horizon Planner"])


# ── Daily Planner Endpoints ──────────────────────────────────────────────────

@router.post("/daily/generate", summary="Generate 24-hour Daily Maintenance Block Plan")
def generate_daily_plan(
    payload: DailyPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = multi_horizon_planner.generate_daily_plan(
        db=db,
        planning_date=payload.planning_date,
        corridor_ids=payload.corridor_ids,
        departments=payload.departments,
        max_block_duration_minutes=payload.max_block_duration_minutes or 180,
        min_priority=payload.min_priority or 0.0,
        include_overdue=payload.include_overdue if payload.include_overdue is not None else True,
        include_critical=payload.include_critical if payload.include_critical is not None else True,
        optimization_objective=payload.optimization_objective,
        user=current_user
    )
    return ApiResponse(
        data=data,
        message="Daily maintenance block plan generated successfully"
    )


@router.get("/daily", summary="Get Daily Maintenance Block Plan for a specific date")
def get_daily_plan(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    corridor_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    target_date = datetime.strptime(date, "%Y-%m-%d") if date else datetime.utcnow()
    data = multi_horizon_planner.generate_daily_plan(
        db=db,
        planning_date=target_date,
        corridor_ids=[corridor_id] if corridor_id else None,
        user=current_user
    )
    return ApiResponse(
        data=data,
        message="Daily plan retrieved successfully"
    )


# ── Weekly Planner Endpoints ─────────────────────────────────────────────────

@router.post("/weekly/generate", summary="Generate 7-Day Weekly Maintenance Block Plan")
def generate_weekly_plan(
    payload: WeeklyPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = multi_horizon_planner.generate_weekly_plan(
        db=db,
        start_date=payload.start_date,
        corridor_ids=payload.corridor_ids,
        departments=payload.departments,
        optimization_objective=payload.optimization_objective,
        user=current_user
    )
    return ApiResponse(
        data=data,
        message="Weekly maintenance block plan generated successfully"
    )


@router.get("/weekly", summary="Get Weekly Maintenance Block Plan")
def get_weekly_plan(
    start_date: Optional[str] = Query(None, description="Start date in YYYY-MM-DD format"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    target_start = datetime.strptime(start_date, "%Y-%m-%d") if start_date else datetime.utcnow()
    data = multi_horizon_planner.generate_weekly_plan(
        db=db,
        start_date=target_start,
        user=current_user
    )
    return ApiResponse(
        data=data,
        message="Weekly plan retrieved successfully"
    )


# ── Monthly Planner Endpoints ────────────────────────────────────────────────

@router.post("/monthly/generate", summary="Generate 30-Day Monthly Maintenance Plan")
def generate_monthly_plan(
    payload: MonthlyPlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = multi_horizon_planner.generate_monthly_plan(
        db=db,
        year=payload.year,
        month=payload.month,
        corridor_ids=payload.corridor_ids,
        departments=payload.departments,
        user=current_user
    )
    return ApiResponse(
        data=data,
        message="Monthly maintenance block plan generated successfully"
    )


@router.get("/monthly", summary="Get Monthly Maintenance Block Plan")
def get_monthly_plan(
    year: Optional[int] = Query(2026),
    month: Optional[int] = Query(8),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    data = multi_horizon_planner.generate_monthly_plan(
        db=db,
        year=year or 2026,
        month=month or 8,
        user=current_user
    )
    return ApiResponse(
        data=data,
        message="Monthly plan retrieved successfully"
    )


# ── Plan Lifecycle & Operations ──────────────────────────────────────────────

@router.get("/{planning_id}", summary="Get specific plan details")
def get_plan_details(
    planning_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    plan = db.scalar(
        select(BlockPlan).where(
            (BlockPlan.id == planning_id) | (BlockPlan.plan_code == planning_id)
        )
    )
    if not plan:
        # Fallback to returning summary
        return ApiResponse(
            data={"planning_id": planning_id, "status": "AI_RECOMMENDED"},
            message="Plan details retrieved"
        )
    return ApiResponse(
        data={
            "id": plan.id,
            "plan_code": plan.plan_code,
            "corridor_id": plan.corridor_id,
            "planning_date": plan.planning_date.isoformat() if plan.planning_date else None,
            "planned_start_at": plan.planned_start_at.isoformat(),
            "planned_end_at": plan.planned_end_at.isoformat(),
            "duration_minutes": plan.duration_minutes,
            "status": plan.status,
            "version": plan.version,
            "change_reason": plan.change_reason,
            "published_at": plan.published_at.isoformat() if plan.published_at else None,
            "published_by": plan.published_by,
            "expected_train_delay": plan.expected_train_delay
        },
        message="Plan details retrieved successfully"
    )


@router.post("/{planning_id}/modify", summary="Reschedule/move block window with timetable validation")
def modify_block_window(
    planning_id: str,
    payload: BlockMovePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    result = multi_horizon_planner.modify_daily_block(
        db=db,
        plan_id=planning_id,
        new_start_time=payload.new_start_time,
        new_end_time=payload.new_end_time,
        change_reason=payload.change_reason,
        user=current_user
    )
    return ApiResponse(
        data=result,
        message=result.get("message", "Block modification processed")
    )


@router.post("/{planning_id}/publish", response_model=ApiResponse[PlanPublishResponse], summary="Publish approved block plan")
def publish_block_plan(
    planning_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_APPROVE"))
):
    result = multi_horizon_planner.publish_plan(
        db=db,
        plan_id=planning_id,
        user=current_user
    )
    return ApiResponse(
        data=PlanPublishResponse(**result),
        message="Plan published successfully"
    )


@router.post("/{planning_id}/reset", summary="Reset block plan to initial draft state")
def reset_block_plan(
    planning_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("BLOCK_UPDATE"))
):
    result = multi_horizon_planner.reset_plan(
        db=db,
        plan_id=planning_id,
        user=current_user
    )
    return ApiResponse(
        data=result,
        message="Plan reset successfully"
    )
