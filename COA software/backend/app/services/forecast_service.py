from typing import Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.train import GoodsForecast
from app.schemas.forecast import GoodsForecastCreate
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError
from app.services.audit_service import create_audit_log

def list_goods_forecasts(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    corridor_id: Optional[str] = None,
    date: Optional[datetime] = None,
    hour: Optional[int] = None,
    traffic_density: Optional[str] = None
):
    query = db.query(GoodsForecast)
    if corridor_id:
        query = query.filter(GoodsForecast.corridor_id == corridor_id)
    if date:
        query = query.filter(GoodsForecast.forecast_date >= date)
    if hour is not None:
        query = query.filter(GoodsForecast.hour_start == hour)
    if traffic_density:
        query = query.filter(GoodsForecast.traffic_density == traffic_density.upper())

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        default_sort=GoodsForecast.forecast_date.asc()
    )

def get_goods_forecast_by_id(db: Session, forecast_id: str) -> GoodsForecast:
    forecast = db.query(GoodsForecast).filter(GoodsForecast.id == forecast_id).first()
    if not forecast:
        raise ResourceNotFoundError("GoodsForecast", forecast_id)
    return forecast

def create_goods_forecast(db: Session, payload: GoodsForecastCreate, user_id: Optional[str] = None) -> GoodsForecast:
    forecast = GoodsForecast(
        corridor_id=payload.corridor_id,
        forecast_date=payload.forecast_date,
        hour_start=payload.hour_start,
        hour_end=payload.hour_end,
        expected_goods_trains=payload.expected_goods_trains,
        traffic_density=payload.traffic_density,
        movement_probability=payload.movement_probability,
        model_version=payload.model_version
    )
    db.add(forecast)
    db.commit()
    db.refresh(forecast)

    create_audit_log(
        db=db,
        action="GOODS_FORECAST_CREATED",
        entity_type="GoodsForecast",
        entity_id=forecast.id,
        user_id=user_id,
        new_value={"corridor_id": forecast.corridor_id, "hour_start": forecast.hour_start}
    )
    return forecast
