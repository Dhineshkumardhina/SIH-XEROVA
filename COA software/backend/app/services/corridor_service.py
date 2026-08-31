from typing import Optional
from sqlalchemy.orm import Session
from app.models.corridor import Corridor
from app.models.asset import Asset
from app.models.maintenance import MaintenanceTask
from app.models.defect import Defect
from app.models.train import TrainSchedule
from app.models.block import BlockPlan, BlockRequestStatus
from app.schemas.corridor import CorridorCreate, CorridorUpdate, CorridorAvailabilityResponse
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError
from app.services.audit_service import create_audit_log

def list_corridors(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: Optional[str] = None,
    status: Optional[str] = None,
    electrified: Optional[bool] = None
):
    query = db.query(Corridor)
    if status:
        query = query.filter(Corridor.status == status)
    if electrified is not None:
        query = query.filter(Corridor.electrified == electrified)
    if search:
        s = f"%{search}%"
        query = query.filter((Corridor.code.ilike(s)) | (Corridor.name.ilike(s)))

    allowed_sorts = {
        "code": Corridor.code,
        "name": Corridor.name,
        "distance_km": Corridor.distance_km,
        "created_at": Corridor.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=Corridor.code.asc()
    )

def get_corridor_by_id(db: Session, corridor_id: str) -> Corridor:
    c = db.query(Corridor).filter(
        (Corridor.id == corridor_id) | (Corridor.code == corridor_id)
    ).first()
    if not c:
        raise ResourceNotFoundError("Corridor", corridor_id)
    return c

def create_corridor(db: Session, payload: CorridorCreate, user_id: Optional[str] = None) -> Corridor:
    if db.query(Corridor).filter(Corridor.code == payload.code).first():
        raise DuplicateResourceError("Corridor", payload.code)

    c = Corridor(
        code=payload.code,
        name=payload.name,
        start_station_id=payload.start_station_id,
        end_station_id=payload.end_station_id,
        distance_km=payload.distance_km,
        track_count=payload.track_count,
        electrified=payload.electrified,
        status=payload.status,
        geometry=payload.geometry
    )
    db.add(c)
    db.commit()
    db.refresh(c)

    create_audit_log(
        db=db,
        action="CORRIDOR_CREATED",
        entity_type="Corridor",
        entity_id=c.id,
        user_id=user_id,
        new_value={"code": c.code, "name": c.name}
    )
    return c

def update_corridor(db: Session, corridor_id: str, payload: CorridorUpdate, user_id: Optional[str] = None) -> Corridor:
    c = get_corridor_by_id(db, corridor_id)
    old_val = {"name": c.name, "status": c.status}

    if payload.name:
        c.name = payload.name
    if payload.start_station_id:
        c.start_station_id = payload.start_station_id
    if payload.end_station_id:
        c.end_station_id = payload.end_station_id
    if payload.distance_km is not None:
        c.distance_km = payload.distance_km
    if payload.track_count is not None:
        c.track_count = payload.track_count
    if payload.electrified is not None:
        c.electrified = payload.electrified
    if payload.status:
        c.status = payload.status
    if payload.geometry is not None:
        c.geometry = payload.geometry

    db.commit()
    db.refresh(c)

    create_audit_log(
        db=db,
        action="CORRIDOR_UPDATED",
        entity_type="Corridor",
        entity_id=c.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"name": c.name, "status": c.status}
    )
    return c

def delete_corridor(db: Session, corridor_id: str, user_id: Optional[str] = None) -> None:
    c = get_corridor_by_id(db, corridor_id)
    old_val = {"code": c.code, "name": c.name}
    db.delete(c)
    db.commit()

    create_audit_log(
        db=db,
        action="CORRIDOR_DELETED",
        entity_type="Corridor",
        entity_id=corridor_id,
        user_id=user_id,
        old_value=old_val
    )

def get_corridor_assets(db: Session, corridor_id: str, page: int = 1, page_size: int = 25):
    c = get_corridor_by_id(db, corridor_id)
    query = db.query(Asset).filter(Asset.corridor_id == c.id)
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Asset.asset_code.asc())

def get_corridor_maintenance(db: Session, corridor_id: str, page: int = 1, page_size: int = 25):
    c = get_corridor_by_id(db, corridor_id)
    query = db.query(MaintenanceTask).join(Asset, MaintenanceTask.asset_id == Asset.id).filter(Asset.corridor_id == c.id)
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceTask.created_at.desc())

def get_corridor_trains(db: Session, corridor_id: str, page: int = 1, page_size: int = 25):
    c = get_corridor_by_id(db, corridor_id)
    query = db.query(TrainSchedule).filter(TrainSchedule.corridor_id == c.id)
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=TrainSchedule.arrival_time.asc())

def get_corridor_availability(db: Session, corridor_id: str) -> CorridorAvailabilityResponse:
    c = get_corridor_by_id(db, corridor_id)

    active_blocks = db.query(BlockPlan).filter(
        BlockPlan.corridor_id == c.id,
        BlockPlan.status == BlockRequestStatus.APPROVED
    ).count()

    open_defects = db.query(Defect).join(Asset, Defect.asset_id == Asset.id).filter(
        Asset.corridor_id == c.id,
        Defect.status.in_(["OPEN", "UNDER_REVIEW", "SCHEDULED"])
    ).count()

    pending_tasks = db.query(MaintenanceTask).join(Asset, MaintenanceTask.asset_id == Asset.id).filter(
        Asset.corridor_id == c.id,
        MaintenanceTask.status.in_(["PENDING", "PLANNED", "IN_PROGRESS"])
    ).count()

    scheduled_trains = db.query(TrainSchedule).filter(TrainSchedule.corridor_id == c.id).count()

    # Dynamic calculation of availability
    base_avail = 96.5
    penalty = (active_blocks * 2.5) + (open_defects * 0.4)
    avail_pct = round(max(50.0, min(100.0, base_avail - penalty)), 1)

    return CorridorAvailabilityResponse(
        corridor_id=c.id,
        corridor_code=c.code,
        corridor_name=c.name,
        status=c.status,
        availability_pct=avail_pct,
        active_blocks_count=active_blocks,
        open_defects_count=open_defects,
        pending_tasks_count=pending_tasks,
        scheduled_trains_count=scheduled_trains
    )
