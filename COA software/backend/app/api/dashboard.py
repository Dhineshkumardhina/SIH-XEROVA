from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from app.api.dependencies import get_db
from app.models.crdm import Asset, MaintenanceTask, BlockPlan, Defect
from app.schemas.domain import DashboardStats, BlockPlanSchema, MaintenanceTaskSchema
from typing import List
from datetime import datetime

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_assets = db.query(Asset).count()
    if total_assets > 0:
        healthy_assets = db.query(Asset).filter(Asset.status == "HEALTHY").count()
        availability = (healthy_assets / total_assets) * 100.0
    else:
        availability = 100.0

    active_blocks = db.query(BlockPlan).filter(BlockPlan.status.in_(["APPROVED", "EXECUTED", "IN_PROGRESS"])).count()
    critical_defects = db.query(Defect).filter(Defect.severity == "CRITICAL", Defect.status == "OPEN").count()
    now = datetime.utcnow()
    overdue_tasks = db.query(MaintenanceTask).filter(
        (MaintenanceTask.status == "OVERDUE") | ((MaintenanceTask.due_at != None) & (MaintenanceTask.due_at < now) & (MaintenanceTask.status != "COMPLETED"))
    ).count()
    recommendations_count = db.query(BlockPlan).filter(BlockPlan.status.in_(["AI_ANALYZED", "RECOMMENDED", "PENDING_APPROVAL"])).count()

    return DashboardStats(
        asset_availability=round(availability, 1),
        active_blocks=active_blocks,
        critical_defects=critical_defects,
        overdue_tasks=overdue_tasks,
        todays_maintenance=db.query(MaintenanceTask).filter(MaintenanceTask.status == "PLANNED").count(),
        train_impact_minutes=0,
        block_utilization=78.5,
        ai_recommendations_count=recommendations_count
    )

@router.get("/recommendations", response_model=List[BlockPlanSchema])
def get_ai_recommendations(db: Session = Depends(get_db)):
    plans = db.query(BlockPlan).options(
        joinedload(BlockPlan.corridor),
        joinedload(BlockPlan.block_tasks).joinedload(BlockPlan.block_tasks.property.mapper.class_.maintenance_task)
    ).filter(
        BlockPlan.status.in_(["AI_ANALYZED", "RECOMMENDED", "APPROVED", "PENDING_APPROVAL", "DRAFT"])
    ).all()
    
    # Format plans into BlockPlanSchema
    result = []
    for p in plans:
        result.append(BlockPlanSchema(
            id=p.id,
            plan_code=p.plan_code,
            corridor_id=p.corridor_id,
            corridor=p.corridor.name if p.corridor else "",
            start_time=p.planned_start_at,
            end_time=p.planned_end_at,
            duration_minutes=p.duration_minutes,
            status=p.status,
            tasks_included=p.tasks_included,
            departments=p.departments,
            train_impact=p.expected_train_delay_minutes or 0,
            expected_delay_minutes=p.expected_train_delay_minutes or 0,
            downtime_saved_minutes=int((p.asset_availability_gain or 0.0) * 10),
            optimization_score=p.optimization_score or 90.0,
            confidence_score=95.0,
            ai_reason="AI Recommended Consolidated Multi-Department Block"
        ))
    return result

@router.get("/priority-tasks", response_model=List[MaintenanceTaskSchema])
def get_priority_tasks(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    tasks = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).filter(
        (MaintenanceTask.priority == "CRITICAL") | 
        (MaintenanceTask.status == "OVERDUE") |
        ((MaintenanceTask.due_at != None) & (MaintenanceTask.due_at < now))
    ).limit(10).all()

    result = []
    for t in tasks:
        result.append(MaintenanceTaskSchema(
            id=t.id,
            task_code=t.task_code,
            asset_id=t.asset_id,
            department_id=t.department_id,
            department=t.department.code if t.department else "",
            task_type=t.task_type,
            description=t.description,
            created_at=t.created_at,
            scheduled_start_at=t.scheduled_start_at,
            scheduled_date=t.scheduled_start_at,
            due_at=t.due_at,
            due_date=t.due_at,
            duration_minutes=t.duration_minutes,
            priority=t.priority,
            urgency=t.urgency,
            safety_impact=t.safety_impact,
            train_impact=t.train_impact,
            block_required=t.block_required,
            isolation_required=t.isolation_required,
            is_overdue=t.is_overdue,
            overdue_days=t.overdue_days,
            status=t.status
        ))
    return result
