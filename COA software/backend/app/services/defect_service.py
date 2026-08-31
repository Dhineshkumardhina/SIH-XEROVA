from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, extract
from app.models.defect import Defect, DefectSeverity, DefectStatus
from app.models.asset import Asset
from app.schemas.defect import DefectCreate, DefectUpdate
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError, InvalidStatusTransitionError
from app.services.audit_service import create_audit_log

def list_defects(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    severity: Optional[str] = None,
    department_id: Optional[str] = None,
    corridor_id: Optional[str] = None,
    asset_id: Optional[str] = None,
    status: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    search: Optional[str] = None
):
    query = db.query(Defect).options(joinedload(Defect.department))

    if severity:
        query = query.filter(Defect.severity == severity.upper())
    if department_id:
        from app.models.department import Department
        query = query.join(Department, Defect.department_id == Department.id, isouter=True)
        query = query.filter((Department.id == department_id) | (Department.code == department_id))
    if corridor_id:
        query = query.join(Asset, Defect.asset_id == Asset.id, isouter=True)
        query = query.filter(Asset.corridor_id == corridor_id)
    if asset_id:
        query = query.filter(Defect.asset_id == asset_id)
    if status:
        query = query.filter(Defect.status == status.upper())
    if date_from:
        query = query.filter(Defect.detected_at >= date_from)
    if date_to:
        query = query.filter(Defect.detected_at <= date_to)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Defect.defect_code.ilike(s)) | (Defect.description.ilike(s))
        )

    allowed_sorts = {
        "defect_code": Defect.defect_code,
        "severity": Defect.severity,
        "risk_score": Defect.risk_score,
        "detected_date": Defect.detected_at,
        "status": Defect.status,
        "created_at": Defect.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=Defect.risk_score.desc()
    )

def get_defect_by_id(db: Session, defect_id: str) -> Defect:
    defect = db.query(Defect).options(joinedload(Defect.department)).filter(
        (Defect.id == defect_id) | (Defect.defect_code == defect_id)
    ).first()
    if not defect:
        raise ResourceNotFoundError("Defect", defect_id)
    return defect

def create_defect(db: Session, payload: DefectCreate, user_id: Optional[str] = None) -> Defect:
    code = payload.defect_code or f"DEF-{datetime.utcnow().strftime('%y%m%d')}-{str(datetime.utcnow().timestamp()).replace('.', '')[-4:]}"

    defect = Defect(
        defect_code=code,
        asset_id=payload.asset_id,
        department_id=payload.department_id,
        description=payload.description,
        severity=payload.severity or DefectSeverity.HIGH,
        detected_at=payload.detected_at or datetime.utcnow(),
        detected_by=payload.detected_by or "INSPECTION_SYSTEM",
        risk_score=payload.risk_score or 70.0,
        safety_impact=payload.safety_impact or 50.0,
        operational_impact=payload.operational_impact or 50.0,
        status=payload.status or DefectStatus.OPEN,
        target_resolution_date=payload.target_resolution_date
    )
    db.add(defect)
    db.commit()
    db.refresh(defect)

    create_audit_log(
        db=db,
        action="DEFECT_RECORDED",
        entity_type="Defect",
        entity_id=defect.id,
        user_id=user_id,
        new_value={"defect_code": defect.defect_code, "severity": defect.severity}
    )
    return defect

def update_defect(db: Session, defect_id: str, payload: DefectUpdate, user_id: Optional[str] = None) -> Defect:
    defect = get_defect_by_id(db, defect_id)
    old_val = {"status": defect.status, "severity": defect.severity}

    if payload.description:
        defect.description = payload.description
    if payload.severity:
        defect.severity = payload.severity
    if payload.risk_score is not None:
        defect.risk_score = payload.risk_score
    if payload.safety_impact is not None:
        defect.safety_impact = payload.safety_impact
    if payload.operational_impact is not None:
        defect.operational_impact = payload.operational_impact
    if payload.status:
        defect.status = payload.status
        if payload.status in ["RESOLVED", "CLOSED"] and not defect.resolved_at:
            defect.resolved_at = datetime.utcnow()
    if payload.target_resolution_date is not None:
        defect.target_resolution_date = payload.target_resolution_date
    if payload.resolved_at is not None:
        defect.resolved_at = payload.resolved_at

    db.commit()
    db.refresh(defect)

    create_audit_log(
        db=db,
        action="DEFECT_UPDATED",
        entity_type="Defect",
        entity_id=defect.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"status": defect.status, "severity": defect.severity}
    )
    return defect

def delete_defect(db: Session, defect_id: str, user_id: Optional[str] = None) -> None:
    defect = get_defect_by_id(db, defect_id)
    old_val = {"defect_code": defect.defect_code}
    db.delete(defect)
    db.commit()

    create_audit_log(
        db=db,
        action="DEFECT_DELETED",
        entity_type="Defect",
        entity_id=defect_id,
        user_id=user_id,
        old_value=old_val
    )

def get_critical_defects(db: Session, page: int = 1, page_size: int = 25):
    query = db.query(Defect).options(joinedload(Defect.department)).filter(
        Defect.severity == "CRITICAL",
        Defect.status.notin_(["RESOLVED", "CLOSED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Defect.risk_score.desc())

def get_high_risk_defects(db: Session, page: int = 1, page_size: int = 25):
    query = db.query(Defect).options(joinedload(Defect.department)).filter(
        (Defect.severity.in_(["CRITICAL", "HIGH"])) | (Defect.risk_score >= 75.0),
        Defect.status.notin_(["RESOLVED", "CLOSED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Defect.risk_score.desc())

def assign_defect(db: Session, defect_id: str, assigned_to: str, user_id: Optional[str] = None) -> Defect:
    defect = get_defect_by_id(db, defect_id)
    if defect.status not in ["OPEN", "UNDER_REVIEW"]:
        raise InvalidStatusTransitionError(defect.status, "ASSIGNED", "Defect")
    
    old_status = defect.status
    defect.status = "ASSIGNED"
    defect.assigned_to = assigned_to
    db.commit()
    db.refresh(defect)
    
    create_audit_log(
        db=db, action="DEFECT_ASSIGNED", entity_type="Defect", entity_id=defect.id, user_id=user_id,
        old_value={"status": old_status}, new_value={"status": "ASSIGNED", "assigned_to": assigned_to}
    )
    return defect

def start_resolution(db: Session, defect_id: str, user_id: Optional[str] = None) -> Defect:
    defect = get_defect_by_id(db, defect_id)
    if defect.status not in ["ASSIGNED", "SCHEDULED", "OPEN", "UNDER_REVIEW"]:
        raise InvalidStatusTransitionError(defect.status, "IN_PROGRESS", "Defect")
    
    old_status = defect.status
    defect.status = "IN_PROGRESS"
    db.commit()
    db.refresh(defect)
    
    create_audit_log(
        db=db, action="DEFECT_STARTED", entity_type="Defect", entity_id=defect.id, user_id=user_id,
        old_value={"status": old_status}, new_value={"status": "IN_PROGRESS"}
    )
    return defect

def resolve_defect(db: Session, defect_id: str, resolution_notes: str, user_id: Optional[str] = None) -> Defect:
    defect = get_defect_by_id(db, defect_id)
    if defect.status in ["RESOLVED", "CLOSED", "CANCELLED"]:
        raise InvalidStatusTransitionError(defect.status, "RESOLVED", "Defect")
    
    old_status = defect.status
    defect.status = "RESOLVED"
    defect.resolved_at = datetime.utcnow()
    defect.resolved_by = user_id
    defect.resolution_notes = resolution_notes
    db.commit()
    db.refresh(defect)
    
    create_audit_log(
        db=db, action="DEFECT_RESOLVED", entity_type="Defect", entity_id=defect.id, user_id=user_id,
        old_value={"status": old_status}, new_value={"status": "RESOLVED"}
    )
    return defect

def close_defect(db: Session, defect_id: str, user_id: Optional[str] = None) -> Defect:
    defect = get_defect_by_id(db, defect_id)
    if defect.status != "RESOLVED":
        raise InvalidStatusTransitionError(defect.status, "CLOSED", "Defect")
    
    old_status = defect.status
    defect.status = "CLOSED"
    db.commit()
    db.refresh(defect)
    
    create_audit_log(
        db=db, action="DEFECT_CLOSED", entity_type="Defect", entity_id=defect.id, user_id=user_id,
        old_value={"status": old_status}, new_value={"status": "CLOSED"}
    )
    return defect

def get_critical_defects(db: Session, page: int = 1, page_size: int = 25):
    query = db.query(Defect).options(joinedload(Defect.department)).filter(
        Defect.severity == DefectSeverity.CRITICAL.value,
        Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Defect.detected_at.desc())

def get_high_risk_defects(db: Session, page: int = 1, page_size: int = 25):
    query = db.query(Defect).options(joinedload(Defect.department)).filter(
        Defect.risk_score >= 75.0,
        Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Defect.risk_score.desc())

def get_overdue_defects(db: Session, page: int = 1, page_size: int = 25):
    now = datetime.utcnow()
    query = db.query(Defect).options(joinedload(Defect.department)).filter(
        Defect.target_resolution_date < now,
        Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])
    )
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Defect.target_resolution_date.asc())

def get_defect_analytics(db: Session) -> dict:
    now = datetime.utcnow()
    start_of_day = datetime(now.year, now.month, now.day, 0, 0, 0)
    end_of_day = datetime(now.year, now.month, now.day, 23, 59, 59)
    
    open_defects = db.query(func.count(Defect.id)).filter(Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
    critical = db.query(func.count(Defect.id)).filter(Defect.severity == "CRITICAL", Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
    high = db.query(func.count(Defect.id)).filter(Defect.severity == "HIGH", Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
    medium = db.query(func.count(Defect.id)).filter(Defect.severity == "MEDIUM", Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
    low = db.query(func.count(Defect.id)).filter(Defect.severity == "LOW", Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
    
    new_today = db.query(func.count(Defect.id)).filter(Defect.detected_at >= start_of_day, Defect.detected_at <= end_of_day).scalar() or 0
    
    overdue = db.query(func.count(Defect.id)).filter(Defect.target_resolution_date < now, Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
    
    resolved_7d = db.query(func.count(Defect.id)).filter(
        Defect.status.in_(["RESOLVED", "CLOSED"]),
        Defect.resolved_at >= (datetime.utcnow().replace(day=1) if datetime.utcnow().day > 7 else datetime.utcnow()) # Mocking 7d roughly
    ).scalar() or 0

    return {
        "open_defects": open_defects,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "new_today": new_today,
        "overdue": overdue,
        "resolved": resolved_7d
    }

def get_department_breakdown(db: Session) -> list:
    from app.models.department import Department
    depts = db.query(Department).all()
    results = []
    for dept in depts:
        open_count = db.query(func.count(Defect.id)).filter(Defect.department_id == dept.id, Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
        critical = db.query(func.count(Defect.id)).filter(Defect.department_id == dept.id, Defect.severity == "CRITICAL", Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
        high = db.query(func.count(Defect.id)).filter(Defect.department_id == dept.id, Defect.severity == "HIGH", Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
        now = datetime.utcnow()
        overdue = db.query(func.count(Defect.id)).filter(Defect.department_id == dept.id, Defect.target_resolution_date < now, Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])).scalar() or 0
        resolved = db.query(func.count(Defect.id)).filter(Defect.department_id == dept.id, Defect.status.in_(["RESOLVED", "CLOSED"])).scalar() or 0
        
        results.append({
            "department_code": dept.code,
            "department_name": dept.name,
            "open": open_count,
            "critical": critical,
            "high": high,
            "overdue": overdue,
            "resolved": resolved
        })
    return results

def get_corridor_intelligence(db: Session) -> list:
    from app.models.corridor import Corridor
    corridors = db.query(Corridor).all()
    results = []
    for corridor in corridors:
        defects = db.query(func.count(Defect.id)).join(Asset, Defect.asset_id == Asset.id).filter(
            Asset.corridor_id == corridor.id,
            Defect.status.notin_(["RESOLVED", "CLOSED", "CANCELLED"])
        ).scalar() or 0
        
        results.append({
            "corridor_code": corridor.code,
            "corridor_name": corridor.name,
            "defects": defects
        })
    return results

def get_defect_trends(db: Session) -> list:
    # Dummy implementation for trend: return last 7 days of counts
    # Ideally should use group_by(extract('day', Defect.detected_at))
    return [
        {"date": "Mon", "detected": 12, "resolved": 10},
        {"date": "Tue", "detected": 15, "resolved": 12},
        {"date": "Wed", "detected": 10, "resolved": 15},
        {"date": "Thu", "detected": 18, "resolved": 14},
        {"date": "Fri", "detected": 8, "resolved": 10},
        {"date": "Sat", "detected": 5, "resolved": 8},
        {"date": "Sun", "detected": 4, "resolved": 6},
    ]
