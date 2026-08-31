from typing import Optional
from sqlalchemy.orm import Session
from app.models.station import Station
from app.schemas.station import StationCreate, StationUpdate
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError
from app.services.audit_service import create_audit_log

def list_stations(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    search: Optional[str] = None,
    division_id: Optional[str] = None
):
    query = db.query(Station)
    if division_id:
        query = query.filter(Station.division_id == division_id)
    if search:
        s = f"%{search}%"
        query = query.filter((Station.code.ilike(s)) | (Station.name.ilike(s)))

    allowed_sorts = {
        "code": Station.code,
        "name": Station.name,
        "created_at": Station.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=Station.code.asc()
    )

def get_station_by_id(db: Session, station_id: str) -> Station:
    stn = db.query(Station).filter(
        (Station.id == station_id) | (Station.code == station_id)
    ).first()
    if not stn:
        raise ResourceNotFoundError("Station", station_id)
    return stn

def create_station(db: Session, payload: StationCreate, user_id: Optional[str] = None) -> Station:
    if db.query(Station).filter(Station.code == payload.code).first():
        raise DuplicateResourceError("Station", payload.code)

    stn = Station(
        code=payload.code,
        name=payload.name,
        division_id=payload.division_id,
        latitude=payload.latitude,
        longitude=payload.longitude
    )
    db.add(stn)
    db.commit()
    db.refresh(stn)

    create_audit_log(
        db=db,
        action="STATION_CREATED",
        entity_type="Station",
        entity_id=stn.id,
        user_id=user_id,
        new_value={"code": stn.code, "name": stn.name}
    )
    return stn

def update_station(db: Session, station_id: str, payload: StationUpdate, user_id: Optional[str] = None) -> Station:
    stn = get_station_by_id(db, station_id)
    old_val = {"name": stn.name, "code": stn.code}

    if payload.code and payload.code != stn.code:
        if db.query(Station).filter(Station.code == payload.code).first():
            raise DuplicateResourceError("Station", payload.code)
        stn.code = payload.code

    if payload.name:
        stn.name = payload.name
    if payload.division_id is not None:
        stn.division_id = payload.division_id
    if payload.latitude is not None:
        stn.latitude = payload.latitude
    if payload.longitude is not None:
        stn.longitude = payload.longitude

    db.commit()
    db.refresh(stn)

    create_audit_log(
        db=db,
        action="STATION_UPDATED",
        entity_type="Station",
        entity_id=stn.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"name": stn.name, "code": stn.code}
    )
    return stn

def delete_station(db: Session, station_id: str, user_id: Optional[str] = None) -> None:
    stn = get_station_by_id(db, station_id)
    old_val = {"code": stn.code, "name": stn.name}
    db.delete(stn)
    db.commit()

    create_audit_log(
        db=db,
        action="STATION_DELETED",
        entity_type="Station",
        entity_id=station_id,
        user_id=user_id,
        old_value=old_val
    )
