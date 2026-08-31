from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session, joinedload
from app.models.train import Train, TrainSchedule, TrainMovement, GoodsForecast
from app.schemas.train import TrainCreate, TrainUpdate, TrainScheduleCreate, TrainMovementCreate
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError
from app.services.audit_service import create_audit_log

def list_trains(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    train_type: Optional[str] = None,
    direction: Optional[str] = None,
    corridor_id: Optional[str] = None,
    station_id: Optional[str] = None,
    status: Optional[str] = None,
    date: Optional[datetime] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    is_goods_train: Optional[bool] = None,
    is_passenger_train: Optional[bool] = None,
    search: Optional[str] = None
):
    query = db.query(Train)

    if train_type:
        query = query.filter(Train.train_type == train_type.upper())
    if direction:
        query = query.filter(Train.default_direction == direction.upper())
    if status:
        query = query.filter(Train.status == status.upper())
    if is_goods_train is not None:
        if is_goods_train:
            query = query.filter(Train.train_type == "GOODS")
        else:
            query = query.filter(Train.train_type != "GOODS")
    if is_passenger_train is not None:
        if is_passenger_train:
            query = query.filter(Train.train_type.in_(["PASSENGER", "EXPRESS", "SUPERFAST"]))
        else:
            query = query.filter(Train.train_type.notin_(["PASSENGER", "EXPRESS", "SUPERFAST"]))
    if corridor_id:
        query = query.filter(Train.corridor_id == corridor_id)
    if start_date or end_date:
        query = query.join(TrainSchedule, Train.id == TrainSchedule.train_id)
        if start_date:
            query = query.filter(TrainSchedule.scheduled_date >= start_date)
        if end_date:
            query = query.filter(TrainSchedule.scheduled_date <= end_date)
    if station_id:
        query = query.join(TrainSchedule, Train.id == TrainSchedule.train_id).filter(TrainSchedule.station_id == station_id)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Train.train_number.ilike(s)) | (Train.train_name.ilike(s))
        )

    allowed_sorts = {
        "train_number": Train.train_number,
        "name": Train.train_name,
        "priority": Train.priority,
        "created_at": Train.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=Train.priority.asc()
    )

def get_train_by_id(db: Session, train_id: str) -> Train:
    train = db.query(Train).filter(
        (Train.id == train_id) | (Train.train_number == train_id)
    ).first()
    if not train:
        raise ResourceNotFoundError("Train", train_id)
    return train

def create_train(db: Session, payload: TrainCreate, user_id: Optional[str] = None) -> Train:
    if db.query(Train).filter(Train.train_number == payload.train_number).first():
        raise DuplicateResourceError("Train", payload.train_number)

    train = Train(
        train_number=payload.train_number,
        train_name=payload.train_name,
        train_type=payload.train_type,
        default_direction=payload.default_direction,
        origin=payload.origin,
        destination=payload.destination,
        priority=payload.priority
    )
    db.add(train)
    db.commit()
    db.refresh(train)

    create_audit_log(
        db=db,
        action="TRAIN_CREATED",
        entity_type="Train",
        entity_id=train.id,
        user_id=user_id,
        new_value={"train_number": train.train_number, "train_name": train.train_name}
    )
    return train

def update_train(db: Session, train_id: str, payload: TrainUpdate, user_id: Optional[str] = None) -> Train:
    train = get_train_by_id(db, train_id)
    old_val = {"train_name": train.train_name, "priority": train.priority}

    if payload.train_name:
        train.train_name = payload.train_name
    if payload.train_type:
        train.train_type = payload.train_type
    if payload.default_direction:
        train.default_direction = payload.default_direction
    if payload.origin:
        train.origin = payload.origin
    if payload.destination:
        train.destination = payload.destination
    if payload.priority is not None:
        train.priority = payload.priority

    db.commit()
    db.refresh(train)

    create_audit_log(
        db=db,
        action="TRAIN_UPDATED",
        entity_type="Train",
        entity_id=train.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"train_name": train.train_name, "priority": train.priority}
    )
    return train

def get_train_schedules(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    date: Optional[datetime] = None,
    corridor_id: Optional[str] = None,
    station_id: Optional[str] = None
):
    query = db.query(TrainSchedule).options(joinedload(TrainSchedule.train))
    if date:
        query = query.filter(TrainSchedule.scheduled_date == date)
    if corridor_id:
        query = query.filter(TrainSchedule.corridor_id == corridor_id)
    if station_id:
        query = query.filter(TrainSchedule.station_id == station_id)

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=TrainSchedule.arrival_time.asc()
    )

def get_train_movements(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    date: Optional[datetime] = None,
    corridor_id: Optional[str] = None,
    status: Optional[str] = None
):
    query = db.query(TrainMovement).options(joinedload(TrainMovement.train))
    if date:
        query = query.filter(TrainMovement.event_time >= date)
    if corridor_id:
        query = query.filter(TrainMovement.corridor_id == corridor_id)
    if status:
        query = query.filter(TrainMovement.status == status.upper())

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=TrainMovement.event_time.desc()
    )

def get_train_forecast(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    corridor_id: Optional[str] = None,
    date: Optional[datetime] = None
):
    query = db.query(GoodsForecast)
    if corridor_id:
        query = query.filter(GoodsForecast.corridor_id == corridor_id)
    if date:
        query = query.filter(GoodsForecast.forecast_date >= date)

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=GoodsForecast.forecast_date.asc()
    )
