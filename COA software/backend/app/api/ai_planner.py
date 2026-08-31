from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.models.optimization import OptimizationRun
from app.schemas.ai_planner import (
    AIPlanningRequest,
    AIPlanningResponse,
    AIPlanningData,
    PlanningSummaryData,
    PlanningExplanationData,
    RecommendedBlockItem,
    UnplannedTaskItem
)
from app.schemas.common import ApiResponse
from app.ai.block_planner import ai_block_planner

router = APIRouter(prefix="/planner", tags=["AI Block Planner"])


@router.post("/generate", response_model=AIPlanningResponse, status_code=status.HTTP_200_OK, summary="Generate AI-recommended railway maintenance block plan")
def generate_ai_block_plan(
    payload: AIPlanningRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    plan_dict = ai_block_planner.generate_plan(
        db=db,
        planning_date=payload.planning_date,
        horizon=payload.horizon or "DAILY",
        corridor_ids=payload.corridor_ids,
        departments=payload.departments,
        max_block_duration_minutes=payload.max_block_duration_minutes or 180,
        min_priority=payload.min_priority or 0.0,
        include_overdue=payload.include_overdue if payload.include_overdue is not None else True,
        include_critical=payload.include_critical if payload.include_critical is not None else True,
        include_shared_blocks=payload.include_shared_blocks if payload.include_shared_blocks is not None else True,
        optimization_objective=payload.optimization_objective,
        user=current_user
    )

    data = AIPlanningData(
        planning_run_id=plan_dict["planning_run_id"],
        status=plan_dict["status"],
        planning_date=plan_dict["planning_date"],
        horizon=plan_dict["horizon"],
        corridor_id=plan_dict["corridor_id"],
        corridor_name=plan_dict["corridor_name"],
        summary=PlanningSummaryData(**plan_dict["summary"]),
        recommended_blocks=[RecommendedBlockItem(**b) for b in plan_dict["recommended_blocks"]],
        unplanned_tasks=[UnplannedTaskItem(**u) for u in plan_dict["unplanned_tasks"]],
        plan_comparison=plan_dict["plan_comparison"],
        alternatives=plan_dict["alternatives"],
        explanation=PlanningExplanationData(**plan_dict["explanation"])
    )

    return AIPlanningResponse(
        success=True,
        data=data,
        message="AI block plan generated successfully"
    )


@router.get("/runs", summary="List historical AI planning runs")
def list_ai_planning_runs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    runs = list(db.scalars(
        select(OptimizationRun).order_by(desc(OptimizationRun.created_at)).limit(limit)
    ))
    return ApiResponse(
        data=[{
            "planning_run_id": r.run_code or r.id,
            "planning_horizon": r.planning_horizon,
            "corridor_id": r.corridor_id,
            "status": r.status,
            "created_by": r.created_by,
            "created_at": r.created_at.isoformat() if r.created_at else None
        } for r in runs],
        message="AI planning runs retrieved successfully"
    )
