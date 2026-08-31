from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict

from app.database.session import get_db
from app.services.ai_priority_service import ai_priority_service
from app.schemas.ai_priority import (
    AIPriorityCalculateRequest,
    AIPriorityBatchRequest,
    AIPriorityPredictionResponse,
    AIPriorityRecalculateRequest
)
from app.api.dependencies import get_current_user
from app.models.user import User
from app.api.risk import router as risk_router
from app.api.train_impact import router as train_impact_router
from app.api.ai_planner import router as ai_planner_router

# Master AI Router
router = APIRouter(prefix="/ai", tags=["AI"])

# Priority Subrouter
priority_router = APIRouter(prefix="/priority", tags=["AI Maintenance Priority"])

@priority_router.post("/calculate", response_model=AIPriorityPredictionResponse)
def calculate_priority(
    req: AIPriorityCalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return ai_priority_service.calculate_priority(db, req.task_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@priority_router.post("/calculate-batch", response_model=List[AIPriorityPredictionResponse])
def calculate_batch_priority(
    req: AIPriorityBatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ai_priority_service.calculate_batch(db, req.task_ids)

@priority_router.get("/tasks", response_model=List[AIPriorityPredictionResponse])
def get_priority_tasks(
    limit: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ai_priority_service.get_priority_tasks(db, limit=limit)

@priority_router.get("/top", response_model=List[AIPriorityPredictionResponse])
def get_top_priority_tasks(
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return ai_priority_service.get_priority_tasks(db, limit=limit)

@priority_router.post("/recalculate", response_model=Dict[str, int])
def recalculate_priorities(
    req: AIPriorityRecalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.maintenance import MaintenanceTask
    from sqlalchemy import select
    
    query = select(MaintenanceTask.id)
    task_ids = list(db.scalars(query.limit(100)))
    results = ai_priority_service.calculate_batch(db, task_ids)
    
    return {"recalculated_count": len(results)}

# Mount subrouters onto master /ai router
router.include_router(priority_router)
router.include_router(risk_router)
router.include_router(train_impact_router)
router.include_router(ai_planner_router)
