from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.models.optimization import OptimizationRun
from app.schemas.optimization import (
    OptimizationRequest,
    OptimizationResponse,
    OptimizationData,
    OptimizationBlockResponse,
    UnscheduledTaskResponse
)
from app.schemas.common import ApiResponse
from app.optimization.block_optimizer import block_optimizer
from app.optimization.models import OptimizationConfig

router = APIRouter(prefix="/optimization", tags=["Optimization"])


@router.post("/run", response_model=OptimizationResponse, status_code=status.HTTP_200_OK, summary="Run OR-Tools CP-SAT Block Optimizer")
def run_block_optimization(
    payload: OptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    cfg = OptimizationConfig(
        horizon=payload.planning_horizon or "DAILY",
        min_block_duration_minutes=payload.minimum_block_duration_minutes or 60,
        max_block_duration_minutes=payload.maximum_block_duration_minutes or 180
    )
    if payload.weight_maintenance_priority is not None:
        cfg.weight_maintenance_priority = payload.weight_maintenance_priority
    if payload.weight_asset_availability is not None:
        cfg.weight_asset_availability = payload.weight_asset_availability
    if payload.weight_shared_block is not None:
        cfg.weight_shared_block = payload.weight_shared_block
    if payload.weight_train_delay is not None:
        cfg.weight_train_delay = payload.weight_train_delay

    outcome = block_optimizer.run_optimization(
        db=db,
        corridor_id=payload.corridor_id,
        planning_date=payload.planning_date,
        task_ids=payload.task_ids,
        config=cfg,
        user_id=current_user.username
    )

    blocks_resp = []
    for b in outcome.blocks:
        blocks_resp.append(OptimizationBlockResponse(
            block_id=b.block_id,
            corridor_id=b.corridor_id,
            corridor_name=b.corridor_name,
            start_time=b.start_time.strftime("%H:%M"),
            end_time=b.end_time.strftime("%H:%M"),
            duration_minutes=b.duration_minutes,
            departments=b.departments,
            is_shared_block=b.is_shared_block,
            tasks=b.tasks,
            task_count=b.task_count,
            maintenance_minutes=b.maintenance_minutes,
            block_utilization=b.block_utilization,
            train_impact_score=b.train_impact_score,
            expected_delay_minutes=b.expected_delay_minutes,
            affected_trains_count=b.affected_trains_count,
            asset_availability_gain=b.asset_availability_gain,
            optimization_score=b.optimization_score,
            conflicts=b.conflicts,
            explanation=b.explanation
        ))

    unsched_resp = [
        UnscheduledTaskResponse(
            task_id=u.task_id,
            task_code=u.task_code,
            department_code=u.department_code,
            priority=u.priority,
            reason=u.reason
        ) for u in outcome.unscheduled_tasks
    ]

    data = OptimizationData(
        optimization_run_id=outcome.optimization_run_id,
        status=outcome.status,
        planning_horizon=outcome.planning_horizon,
        planning_date=outcome.planning_date,
        corridor_id=outcome.corridor_id,
        corridor_name=outcome.corridor_name,
        solver_duration_seconds=outcome.solver_duration_seconds,
        objective_value=outcome.objective_value,
        blocks=blocks_resp,
        unscheduled_tasks=unsched_resp,
        metrics=outcome.metrics,
        baseline_plan=outcome.baseline_plan,
        plan_comparison=outcome.plan_comparison,
        alternatives=outcome.alternatives,
        explanations=outcome.explanations
    )

    return OptimizationResponse(
        success=True,
        data=data,
        message="Automatic block optimization completed"
    )


@router.get("/runs", summary="List past optimization runs")
def get_optimization_runs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    runs = list(db.scalars(
        select(OptimizationRun).order_by(desc(OptimizationRun.created_at)).limit(limit)
    ))
    return ApiResponse(
        data=[{
            "id": r.id,
            "run_code": r.run_code,
            "planning_horizon": r.planning_horizon,
            "corridor_id": r.corridor_id,
            "status": r.status,
            "solver_name": r.solver_name,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in runs],
        message="Optimization runs retrieved"
    )
