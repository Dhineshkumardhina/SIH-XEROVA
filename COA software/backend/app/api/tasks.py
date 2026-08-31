from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List

from app.api.dependencies import get_db
from app.models.crdm import MaintenanceTask
from app.schemas.domain import MaintenanceTaskSchema

router = APIRouter(prefix="/tasks", tags=["tasks"])

@router.get("", response_model=List[MaintenanceTaskSchema])
def get_tasks(db: Session = Depends(get_db)):
    tasks = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).all()
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
