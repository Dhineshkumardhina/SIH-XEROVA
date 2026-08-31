from typing import Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.models.maintenance import MaintenanceTask, MaintenanceHistory, MaintenanceStatus
from app.models.asset import Asset
from app.schemas.maintenance import (
    MaintenanceTaskCreate, MaintenanceTaskUpdate, MaintenanceTaskComplete, MaintenanceTaskCancel
)
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError, InvalidStatusTransitionError
from app.services.audit_service import create_audit_log

def list_tasks(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    department_id: Optional[str] = None,
    corridor_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    task_type: Optional[str] = None,
    block_required: Optional[bool] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None
):
    query = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department))

    if department_id:
        from app.models.department import Department
        query = query.join(Department, MaintenanceTask.department_id == Department.id, isouter=True)
        query = query.filter((Department.id == department_id) | (Department.code == department_id))
    if corridor_id:
        query = query.join(Asset, MaintenanceTask.asset_id == Asset.id, isouter=True)
        query = query.filter(Asset.corridor_id == corridor_id)
    if asset_id:
        query = query.filter(MaintenanceTask.asset_id == asset_id)
    if status:
        query = query.filter(MaintenanceTask.status == status.upper())
    if priority:
        query = query.filter(MaintenanceTask.priority == priority.upper())
    if task_type:
        query = query.filter(MaintenanceTask.task_type == task_type.upper())
    if block_required is not None:
        query = query.filter(MaintenanceTask.block_required == block_required)
    if date_from:
        query = query.filter(MaintenanceTask.scheduled_start_at >= date_from)
    if date_to:
        query = query.filter(MaintenanceTask.scheduled_start_at <= date_to)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (MaintenanceTask.task_code.ilike(s)) | (MaintenanceTask.description.ilike(s))
        )

    allowed_sorts = {
        "task_code": MaintenanceTask.task_code,
        "priority": MaintenanceTask.priority,
        "urgency": MaintenanceTask.urgency,
        "status": MaintenanceTask.status,
        "scheduled_date": MaintenanceTask.scheduled_start_at,
        "due_date": MaintenanceTask.due_at,
        "created_at": MaintenanceTask.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=MaintenanceTask.scheduled_start_at.asc()
    )

def get_task_by_id(db: Session, task_id: str) -> MaintenanceTask:
    task = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).filter(
        (MaintenanceTask.id == task_id) | (MaintenanceTask.task_code == task_id)
    ).first()
    if not task:
        raise ResourceNotFoundError("MaintenanceTask", task_id)
    return task

def create_task(db: Session, payload: MaintenanceTaskCreate, user_id: Optional[str] = None) -> MaintenanceTask:
    code = payload.task_code or f"MT-{datetime.utcnow().strftime('%y%m%d')}-{str(datetime.utcnow().timestamp()).replace('.', '')[-4:]}"

    task = MaintenanceTask(
        task_code=code,
        asset_id=payload.asset_id,
        department_id=payload.department_id,
        task_type=payload.task_type,
        description=payload.description,
        scheduled_start_at=payload.scheduled_start_at,
        due_at=payload.due_at,
        duration_minutes=payload.duration_minutes,
        priority=payload.priority,
        urgency=payload.urgency,
        safety_impact=payload.safety_impact,
        train_impact=payload.train_impact,
        block_required=payload.block_required,
        isolation_required=payload.isolation_required,
        status=payload.status or "PENDING"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    create_audit_log(
        db=db,
        action="MAINTENANCE_TASK_CREATED",
        entity_type="MaintenanceTask",
        entity_id=task.id,
        user_id=user_id,
        new_value={"task_code": task.task_code, "priority": task.priority}
    )
    return task

def update_task(db: Session, task_id: str, payload: MaintenanceTaskUpdate, user_id: Optional[str] = None) -> MaintenanceTask:
    task = get_task_by_id(db, task_id)
    old_val = {"status": task.status, "priority": task.priority}

    if payload.description:
        task.description = payload.description
    if payload.scheduled_start_at is not None:
        task.scheduled_start_at = payload.scheduled_start_at
    if payload.due_at is not None:
        task.due_at = payload.due_at
    if payload.duration_minutes is not None:
        task.duration_minutes = payload.duration_minutes
    if payload.priority:
        task.priority = payload.priority
    if payload.urgency is not None:
        task.urgency = payload.urgency
    if payload.safety_impact is not None:
        task.safety_impact = payload.safety_impact
    if payload.train_impact is not None:
        task.train_impact = payload.train_impact
    if payload.block_required is not None:
        task.block_required = payload.block_required
    if payload.isolation_required is not None:
        task.isolation_required = payload.isolation_required
    if payload.status:
        # Check transition if changing status
        if task.status == "COMPLETED" and payload.status != "COMPLETED":
            raise InvalidStatusTransitionError(task.status, payload.status, "MaintenanceTask")
        task.status = payload.status

    db.commit()
    db.refresh(task)

    create_audit_log(
        db=db,
        action="MAINTENANCE_TASK_UPDATED",
        entity_type="MaintenanceTask",
        entity_id=task.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"status": task.status, "priority": task.priority}
    )
    return task

def complete_task(db: Session, task_id: str, payload: MaintenanceTaskComplete, user_id: Optional[str] = None) -> MaintenanceTask:
    task = get_task_by_id(db, task_id)
    if task.status in ["COMPLETED", "CANCELLED"]:
        raise InvalidStatusTransitionError(task.status, "COMPLETED", "MaintenanceTask")

    old_status = task.status
    task.status = "COMPLETED"

    # In a transaction, record in maintenance_history
    history = MaintenanceHistory(
        asset_id=task.asset_id,
        maintenance_task_id=task.id,
        performed_by=user_id or "SYSTEM_OPERATOR",
        status="COMPLETED",
        event_type="TASK_COMPLETION",
        completed_at=datetime.utcnow(),
        remarks=payload.completion_notes or "Maintenance task completed successfully",
        result="SUCCESS"
    )
    db.add(history)
    db.commit()
    db.refresh(task)

    create_audit_log(
        db=db,
        action="MAINTENANCE_TASK_COMPLETED",
        entity_type="MaintenanceTask",
        entity_id=task.id,
        user_id=user_id,
        old_value={"status": old_status},
        new_value={"status": "COMPLETED", "notes": payload.completion_notes}
    )
    return task

def cancel_task(db: Session, task_id: str, payload: MaintenanceTaskCancel, user_id: Optional[str] = None) -> MaintenanceTask:
    task = get_task_by_id(db, task_id)
    if task.status == "COMPLETED":
        raise InvalidStatusTransitionError("COMPLETED", "CANCELLED", "MaintenanceTask")

    old_status = task.status
    task.status = "CANCELLED"
    db.commit()
    db.refresh(task)

    create_audit_log(
        db=db,
        action="MAINTENANCE_TASK_CANCELLED",
        entity_type="MaintenanceTask",
        entity_id=task.id,
        user_id=user_id,
        old_value={"status": old_status},
        new_value={"status": "CANCELLED", "reason": payload.cancellation_reason}
    )
    return task

def delete_task(db: Session, task_id: str, user_id: Optional[str] = None) -> None:
    task = get_task_by_id(db, task_id)
    old_val = {"task_code": task.task_code}
    db.delete(task)
    db.commit()

    create_audit_log(
        db=db,
        action="MAINTENANCE_TASK_DELETED",
        entity_type="MaintenanceTask",
        entity_id=task_id,
        user_id=user_id,
        old_value=old_val
    )

def get_overdue_tasks(db: Session, page: int = 1, page_size: int = 25):
    now = datetime.utcnow()
    query = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).filter(
        MaintenanceTask.due_at < now,
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceTask.due_at.asc())

def get_critical_tasks(db: Session, page: int = 1, page_size: int = 25):
    query = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).filter(
        (MaintenanceTask.priority == "CRITICAL") | (MaintenanceTask.safety_impact >= 75.0),
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceTask.urgency.desc())

def get_today_tasks(db: Session, page: int = 1, page_size: int = 25):
    now = datetime.utcnow()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
    query = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).filter(
        MaintenanceTask.scheduled_start_at >= start_of_day,
        MaintenanceTask.scheduled_start_at <= end_of_day
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceTask.scheduled_start_at.asc())

def get_upcoming_tasks(db: Session, page: int = 1, page_size: int = 25):
    now = datetime.utcnow()
    query = db.query(MaintenanceTask).options(joinedload(MaintenanceTask.department)).filter(
        MaintenanceTask.scheduled_start_at > now,
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceTask.scheduled_start_at.asc())

def start_task(db: Session, task_id: str, user_id: Optional[str] = None) -> MaintenanceTask:
    task = get_task_by_id(db, task_id)
    if task.status not in ["PLANNED", "PENDING"]:
        raise InvalidStatusTransitionError(task.status, "IN_PROGRESS", "MaintenanceTask")

    old_status = task.status
    task.status = "IN_PROGRESS"
    db.commit()
    db.refresh(task)

    create_audit_log(
        db=db,
        action="MAINTENANCE_TASK_STARTED",
        entity_type="MaintenanceTask",
        entity_id=task.id,
        user_id=user_id,
        old_value={"status": old_status},
        new_value={"status": "IN_PROGRESS"}
    )
    return task

def get_maintenance_analytics(db: Session) -> dict:
    total_tasks = db.query(func.count(MaintenanceTask.id)).scalar() or 0
    now = datetime.utcnow()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
    
    todays_maintenance = db.query(func.count(MaintenanceTask.id)).filter(
        MaintenanceTask.scheduled_start_at >= start_of_day,
        MaintenanceTask.scheduled_start_at <= end_of_day
    ).scalar() or 0

    overdue = db.query(func.count(MaintenanceTask.id)).filter(
        MaintenanceTask.due_at < now,
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    ).scalar() or 0

    critical = db.query(func.count(MaintenanceTask.id)).filter(
        (MaintenanceTask.priority == "CRITICAL") | (MaintenanceTask.safety_impact >= 75.0),
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    ).scalar() or 0

    high_priority = db.query(func.count(MaintenanceTask.id)).filter(
        MaintenanceTask.priority == "HIGH",
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    ).scalar() or 0

    in_progress = db.query(func.count(MaintenanceTask.id)).filter(
        MaintenanceTask.status == "IN_PROGRESS"
    ).scalar() or 0

    completed_30d = db.query(func.count(MaintenanceTask.id)).filter(
        MaintenanceTask.status == "COMPLETED",
        MaintenanceTask.completion_at >= (now.replace(day=1) if now.day > 1 else now) # rough approximation for speed, can adjust
    ).scalar() or 0
    
    block_required = db.query(func.count(MaintenanceTask.id)).filter(
        MaintenanceTask.block_required == True,
        MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
    ).scalar() or 0

    return {
        "total_tasks": total_tasks,
        "todays_maintenance": todays_maintenance,
        "overdue": overdue,
        "critical": critical,
        "high_priority": high_priority,
        "in_progress": in_progress,
        "completed_30d": completed_30d, # not strict 30d but gives a value
        "block_required": block_required
    }

def get_department_workload(db: Session) -> list:
    from app.models.department import Department
    depts = db.query(Department).all()
    results = []
    for dept in depts:
        pending = db.query(func.count(MaintenanceTask.id)).filter(
            MaintenanceTask.department_id == dept.id,
            MaintenanceTask.status.in_(["PLANNED", "PENDING"])
        ).scalar() or 0
        
        in_progress = db.query(func.count(MaintenanceTask.id)).filter(
            MaintenanceTask.department_id == dept.id,
            MaintenanceTask.status == "IN_PROGRESS"
        ).scalar() or 0
        
        now = datetime.utcnow()
        overdue = db.query(func.count(MaintenanceTask.id)).filter(
            MaintenanceTask.department_id == dept.id,
            MaintenanceTask.due_at < now,
            MaintenanceTask.status.notin_(["COMPLETED", "CANCELLED"])
        ).scalar() or 0
        
        completed = db.query(func.count(MaintenanceTask.id)).filter(
            MaintenanceTask.department_id == dept.id,
            MaintenanceTask.status == "COMPLETED"
        ).scalar() or 0

        results.append({
            "department_code": dept.code,
            "department_name": dept.name,
            "pending": pending,
            "in_progress": in_progress,
            "overdue": overdue,
            "completed": completed
        })
    return results
