from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from app.models.block import (
    BlockRequest, BlockPlan, BlockTask, BlockConflict, BlockApproval, BlockRequestStatus, BlockApprovalAction, BlockRequestTask
)
from app.models.user import User
from app.models.maintenance import MaintenanceTask
from app.models.train import TrainSchedule
from app.schemas.block import (
    BlockRequestCreate, BlockRequestUpdate, BlockPlanCreate, BlockPlanUpdate,
    BlockImpactResponse, BlockConflictResponse, BlockConflictDetail
)
from app.core.pagination import paginate_query
from app.core.exceptions import (
    ResourceNotFoundError, DuplicateResourceError, InvalidStatusTransitionError,
    BlockApprovalForbiddenError, ForbiddenError
)
from app.services.audit_service import create_audit_log

# ── Block Requests ───────────────────────────────────────────────────

def list_block_requests(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    department_id: Optional[str] = None,
    corridor_id: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(BlockRequest).options(joinedload(BlockRequest.department), joinedload(BlockRequest.corridor))

    if department_id:
        from app.models.department import Department
        query = query.join(Department, BlockRequest.department_id == Department.id, isouter=True)
        query = query.filter((Department.id == department_id) | (Department.code == department_id))
    if corridor_id:
        query = query.filter(BlockRequest.corridor_id == corridor_id)
    if status:
        query = query.filter(BlockRequest.status == status.upper())
    if priority:
        query = query.filter(BlockRequest.priority == priority.upper())
    if search:
        s = f"%{search}%"
        query = query.filter((BlockRequest.request_code.ilike(s)) | (BlockRequest.reason.ilike(s)))

    allowed_sorts = {
        "request_code": BlockRequest.request_code,
        "priority": BlockRequest.priority,
        "status": BlockRequest.status,
        "start_time": BlockRequest.preferred_start_at,
        "duration": BlockRequest.duration_minutes,
        "created_at": BlockRequest.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=BlockRequest.preferred_start_at.asc()
    )

def get_block_request_by_id(db: Session, request_id: str) -> BlockRequest:
    req = db.query(BlockRequest).options(joinedload(BlockRequest.department), joinedload(BlockRequest.corridor)).filter(
        (BlockRequest.id == request_id) | (BlockRequest.request_code == request_id)
    ).first()
    if not req:
        raise ResourceNotFoundError("BlockRequest", request_id)
    return req

def create_block_request(db: Session, payload: BlockRequestCreate, user: User) -> BlockRequest:
    code = payload.request_code or f"BR-{datetime.utcnow().strftime('%y%m%d')}-{str(datetime.utcnow().timestamp()).replace('.', '')[-4:]}"

    req = BlockRequest(
        request_code=code,
        department_id=payload.department_id,
        asset_id=payload.asset_id,
        corridor_id=payload.corridor_id,
        requested_date=payload.requested_date or datetime.utcnow(),
        preferred_start_at=payload.preferred_start_at,
        preferred_end_at=payload.preferred_end_at,
        duration_minutes=payload.duration_minutes,
        block_type=payload.block_type,
        isolation_required=payload.isolation_required,
        reason=payload.reason,
        priority=payload.priority,
        requested_by=user.full_name or user.username,
        status="DRAFT" if payload.status == "DRAFT" else "SUBMITTED"
    )
    db.add(req)
    
    if payload.task_ids:
        for t_id in payload.task_ids:
            task = db.query(MaintenanceTask).filter(MaintenanceTask.id == t_id).first()
            if task:
                db.add(BlockRequestTask(block_request=req, maintenance_task=task))

    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_CREATED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        new_value={"request_code": req.request_code, "status": req.status}
    )
    return req

def update_block_request(db: Session, request_id: str, payload: BlockRequestUpdate, user: User) -> BlockRequest:
    req = get_block_request_by_id(db, request_id)
    old_val = {"status": req.status, "duration": req.duration_minutes}

    if payload.asset_id is not None:
        req.asset_id = payload.asset_id
    if payload.corridor_id:
        req.corridor_id = payload.corridor_id
    if payload.preferred_start_at:
        req.preferred_start_at = payload.preferred_start_at
    if payload.preferred_end_at:
        req.preferred_end_at = payload.preferred_end_at
    if payload.duration_minutes is not None:
        req.duration_minutes = payload.duration_minutes
    if payload.block_type:
        req.block_type = payload.block_type
    if payload.isolation_required is not None:
        req.isolation_required = payload.isolation_required
    if payload.reason:
        req.reason = payload.reason
    if payload.priority:
        req.priority = payload.priority
    if payload.status:
        req.status = payload.status

    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_UPDATED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value=old_val,
        new_value={"status": req.status, "duration": req.duration_minutes}
    )
    return req

def delete_block_request(db: Session, request_id: str, user: User) -> None:
    req = get_block_request_by_id(db, request_id)
    old_val = {"request_code": req.request_code}
    db.delete(req)
    db.commit()

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_DELETED",
        entity_type="BlockRequest",
        entity_id=request_id,
        user_id=user.id,
        old_value=old_val
    )

def submit_block_request(db: Session, request_id: str, user: User) -> BlockRequest:
    req = get_block_request_by_id(db, request_id)
    if req.status not in ["DRAFT"]:
        raise InvalidStatusTransitionError(req.status, "SUBMITTED", "BlockRequest")

    old_status = req.status
    req.status = "SUBMITTED"
    req.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_SUBMITTED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "SUBMITTED"}
    )
    return req

def validate_block_request(db: Session, request_id: str, user: User) -> BlockConflictDetail:
    from app.services.train_occupancy_service import get_train_occupancy_for_window
    req = get_block_request_by_id(db, request_id)
    
    if req.status not in ["SUBMITTED", "UNDER_REVIEW", "VALIDATED"]:
        raise InvalidStatusTransitionError(req.status, "VALIDATED", "BlockRequest")

    old_status = req.status
    req.status = "VALIDATED"
    req.reviewed_at = datetime.utcnow()
    req.reviewed_by = user.username
    db.commit()

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_VALIDATED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "VALIDATED"}
    )
    
    return get_block_request_conflicts(db, request_id)

def get_block_request_conflicts(db: Session, request_id: str) -> BlockConflictDetail:
    from app.services.block_conflict_service import block_conflict_service
    req = get_block_request_by_id(db, request_id)
    task_items = get_block_request_tasks(db, request_id)
    task_ids = [t.id for t in task_items]

    evaluation = block_conflict_service.evaluate_block(
        db=db,
        corridor_id=req.corridor_id,
        start_time=req.preferred_start_at,
        end_time=req.preferred_end_at,
        task_ids=task_ids,
        isolation_required=req.isolation_required or False,
        exclude_block_id=req.id
    )

    conflict_dicts = []
    for c in evaluation["conflicts"]:
        conflict_dicts.append({
            "type": c["conflict_type"],
            "severity": c["severity"],
            "description": c["description"],
            "start": c.get("start_time") or req.preferred_start_at.isoformat(),
            "end": c.get("end_time") or req.preferred_end_at.isoformat(),
            "train_id": c.get("entity_id") if c.get("entity_type") == "TRAIN" else None,
            "block_id": c.get("entity_id") if c.get("entity_type") == "BLOCK_REQUEST" else None,
            "resolution": c.get("resolution")
        })

    return BlockConflictDetail(
        has_conflict=len(conflict_dicts) > 0,
        conflicts=conflict_dicts
    )

def approve_block_request(db: Session, request_id: str, user: User) -> BlockRequest:
    req = get_block_request_by_id(db, request_id)

    # Check approval permissions
    user_roles = [r.code for r in user.roles]
    is_super = "SUPER_ADMIN" in user_roles
    is_control = "CONTROL_OFFICER" in user_roles

    if not (is_super or is_control):
        # Department officers (ENGINEERING, SIGNAL_TELECOM, TRACTION) cannot approve
        raise BlockApprovalForbiddenError(
            f"Role(s) {[r.name for r in user.roles]} not permitted to approve block requests. CONTROL_OFFICER or SUPER_ADMIN required."
        )

    if req.status in ["APPROVED", "REJECTED", "CANCELLED", "COMPLETED"]:
        raise InvalidStatusTransitionError(req.status, "APPROVED", "BlockRequest")

    # Check for critical conflicts
    conflict_detail = get_block_request_conflicts(db, request_id)
    if any(c["severity"] == "CRITICAL" for c in conflict_detail.conflicts):
        raise ForbiddenError("Cannot approve block request with CRITICAL conflicts.")

    old_status = req.status
    req.status = "APPROVED"
    req.approved_at = datetime.utcnow()
    req.approved_by = user.username
    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_APPROVED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "APPROVED", "approved_by": user.username}
    )
    return req

def reject_block_request(db: Session, request_id: str, reason: str, user: User) -> BlockRequest:
    req = get_block_request_by_id(db, request_id)

    user_roles = [r.code for r in user.roles]
    if not ("SUPER_ADMIN" in user_roles or "CONTROL_OFFICER" in user_roles):
        raise BlockApprovalForbiddenError("Only Control Officers or Super Administrators may reject block requests")

    if req.status in ["APPROVED", "REJECTED", "CANCELLED", "COMPLETED"]:
        raise InvalidStatusTransitionError(req.status, "REJECTED", "BlockRequest")

    old_status = req.status
    req.status = "REJECTED"
    req.rejection_reason = reason
    req.reviewed_by = user.username
    req.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_REJECTED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "REJECTED", "reason": reason}
    )
    return req

def cancel_block_request(db: Session, request_id: str, reason: str, user: User) -> BlockRequest:
    req = get_block_request_by_id(db, request_id)
    if req.status in ["CANCELLED", "COMPLETED"]:
        raise InvalidStatusTransitionError(req.status, "CANCELLED", "BlockRequest")

    old_status = req.status
    req.status = "CANCELLED"
    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_CANCELLED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "CANCELLED", "reason": reason}
    )
    return req

def complete_block_request(db: Session, request_id: str, user: User) -> BlockRequest:
    req = get_block_request_by_id(db, request_id)
    if req.status != "APPROVED":
        raise InvalidStatusTransitionError(req.status, "COMPLETED", "BlockRequest")
        
    old_status = req.status
    req.status = "COMPLETED"
    db.commit()
    db.refresh(req)

    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_COMPLETED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "COMPLETED"}
    )
    return req

def get_block_request_tasks(db: Session, request_id: str) -> List[MaintenanceTask]:
    req = get_block_request_by_id(db, request_id)
    return [rt.maintenance_task for rt in req.request_tasks if rt.maintenance_task]

def add_block_request_task(db: Session, request_id: str, task_id: str, user: User):
    req = get_block_request_by_id(db, request_id)
    task = db.query(MaintenanceTask).filter(MaintenanceTask.id == task_id).first()
    if not task:
        raise ResourceNotFoundError("MaintenanceTask", task_id)
        
    db.add(BlockRequestTask(block_request_id=req.id, maintenance_task_id=task.id))
    db.commit()
    
    create_audit_log(
        db=db,
        action="BLOCK_REQUEST_TASK_ADDED",
        entity_type="BlockRequest",
        entity_id=req.id,
        user_id=user.id,
        new_value={"task_id": task_id}
    )
    return task
    
def remove_block_request_task(db: Session, request_id: str, task_id: str, user: User):
    rt = db.query(BlockRequestTask).filter(
        BlockRequestTask.block_request_id == request_id, 
        BlockRequestTask.maintenance_task_id == task_id
    ).first()
    if rt:
        db.delete(rt)
        db.commit()
        
        create_audit_log(
            db=db,
            action="BLOCK_REQUEST_TASK_REMOVED",
            entity_type="BlockRequest",
            entity_id=request_id,
            user_id=user.id,
            old_value={"task_id": task_id}
        )

# ── Block Plans ──────────────────────────────────────────────────────

def list_block_plans(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    corridor_id: Optional[str] = None,
    status: Optional[str] = None
):
    query = db.query(BlockPlan).options(
        joinedload(BlockPlan.corridor),
        joinedload(BlockPlan.block_tasks).joinedload(BlockTask.maintenance_task).joinedload(MaintenanceTask.department)
    )
    if corridor_id:
        query = query.filter(BlockPlan.corridor_id == corridor_id)
    if status:
        query = query.filter(BlockPlan.status == status.upper())

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=BlockPlan.planned_start_at.asc()
    )

def get_block_plan_by_id(db: Session, plan_id: str) -> BlockPlan:
    plan = db.query(BlockPlan).options(
        joinedload(BlockPlan.corridor),
        joinedload(BlockPlan.block_tasks).joinedload(BlockTask.maintenance_task).joinedload(MaintenanceTask.department)
    ).filter(
        (BlockPlan.id == plan_id) | (BlockPlan.plan_code == plan_id)
    ).first()
    if not plan:
        raise ResourceNotFoundError("BlockPlan", plan_id)
    return plan

def create_block_plan(db: Session, payload: BlockPlanCreate, user: User) -> BlockPlan:
    code = payload.plan_code or f"BP-{datetime.utcnow().strftime('%y%m%d')}-{str(datetime.utcnow().timestamp()).replace('.', '')[-4:]}"

    plan = BlockPlan(
        plan_code=code,
        corridor_id=payload.corridor_id,
        planning_date=payload.planning_date or datetime.utcnow(),
        planned_start_at=payload.planned_start_at,
        planned_end_at=payload.planned_end_at,
        duration_minutes=payload.duration_minutes,
        status=payload.status or BlockRequestStatus.DRAFT,
        planning_horizon=payload.planning_horizon,
        optimization_score=payload.optimization_score,
        expected_train_delay=payload.expected_train_delay or 0,
        asset_availability_gain=payload.asset_availability_gain or 0.0,
        generated_by=user.full_name or user.username
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)

    create_audit_log(
        db=db,
        action="BLOCK_PLAN_CREATED",
        entity_type="BlockPlan",
        entity_id=plan.id,
        user_id=user.id,
        new_value={"plan_code": plan.plan_code, "status": plan.status}
    )
    return plan

def update_block_plan(db: Session, plan_id: str, payload: BlockPlanUpdate, user: User) -> BlockPlan:
    plan = get_block_plan_by_id(db, plan_id)
    old_val = {"status": plan.status, "duration": plan.duration_minutes}

    if payload.planned_start_at:
        plan.planned_start_at = payload.planned_start_at
    if payload.planned_end_at:
        plan.planned_end_at = payload.planned_end_at
    if payload.duration_minutes is not None:
        plan.duration_minutes = payload.duration_minutes
    if payload.status:
        plan.status = payload.status
    if payload.expected_train_delay is not None:
        plan.expected_train_delay = payload.expected_train_delay
    if payload.asset_availability_gain is not None:
        plan.asset_availability_gain = payload.asset_availability_gain

    db.commit()
    db.refresh(plan)

    create_audit_log(
        db=db,
        action="BLOCK_PLAN_UPDATED",
        entity_type="BlockPlan",
        entity_id=plan.id,
        user_id=user.id,
        old_value=old_val,
        new_value={"status": plan.status, "duration": plan.duration_minutes}
    )
    return plan

def approve_block_plan(db: Session, plan_id: str, user: User) -> BlockPlan:
    plan = get_block_plan_by_id(db, plan_id)
    old_status = plan.status
    plan.status = BlockRequestStatus.APPROVED
    plan.approved_by = user.full_name or user.username
    plan.approved_at = datetime.utcnow()

    approval = BlockApproval(
        block_plan_id=plan.id,
        action=BlockApprovalAction.APPROVED,
        actor_reference=user.full_name or user.username,
        comment="Approved in Control Office console"
    )
    db.add(approval)
    db.commit()
    db.refresh(plan)

    create_audit_log(
        db=db,
        action="BLOCK_PLAN_APPROVED",
        entity_type="BlockPlan",
        entity_id=plan.id,
        user_id=user.id,
        old_value={"status": old_status},
        new_value={"status": "APPROVED", "approved_by": plan.approved_by}
    )
    return plan

def get_block_plan_tasks(db: Session, plan_id: str) -> List[MaintenanceTask]:
    plan = get_block_plan_by_id(db, plan_id)
    return [bt.maintenance_task for bt in plan.block_tasks if bt.maintenance_task]

def get_block_plan_conflicts(db: Session, plan_id: str) -> List[BlockConflictResponse]:
    plan = get_block_plan_by_id(db, plan_id)
    conflicts = db.query(BlockConflict).filter(BlockConflict.block_plan_id == plan.id).all()
    return [BlockConflictResponse.model_validate(c) for c in conflicts]

def get_block_plan_trains(db: Session, plan_id: str):
    plan = get_block_plan_by_id(db, plan_id)
    # Return train schedules overlapping the block corridor and time interval
    return db.query(TrainSchedule).options(joinedload(TrainSchedule.train)).filter(
        TrainSchedule.corridor_id == plan.corridor_id,
        TrainSchedule.arrival_time >= plan.planned_start_at,
        TrainSchedule.arrival_time <= plan.planned_end_at
    ).all()

def get_block_plan_impact(db: Session, plan_id: str) -> BlockImpactResponse:
    plan = get_block_plan_by_id(db, plan_id)
    affected_trains = db.query(TrainSchedule).filter(
        TrainSchedule.corridor_id == plan.corridor_id,
        TrainSchedule.arrival_time >= plan.planned_start_at,
        TrainSchedule.arrival_time <= plan.planned_end_at
    ).count()

    delay = plan.expected_train_delay or (affected_trains * 15)

    return BlockImpactResponse(
        block_id=plan.id,
        corridor_id=plan.corridor_id,
        duration_minutes=plan.duration_minutes,
        train_delay_minutes=delay,
        trains_affected_count=affected_trains,
        passengers_impacted_estimate=affected_trains * 650,
        freight_delay_hours=round(delay / 60.0 * 0.4, 2),
        asset_availability_gain=plan.asset_availability_gain or 4.5,
        safety_score=94.0
    )
