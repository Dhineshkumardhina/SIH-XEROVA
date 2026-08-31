from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class GoodsForecastBase(BaseModel):
    corridor_id: str
    forecast_date: datetime
    hour_start: int
    hour_end: int
    expected_goods_trains: float = 0.0
    traffic_density: str = "LOW"
    movement_probability: float = 0.8
    model_version: str = "v1.0"

class GoodsForecastCreate(GoodsForecastBase):
    pass

class GoodsForecastResponse(GoodsForecastBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    expected_goods_count: Optional[float] = None
    hour_slot: Optional[int] = None
    created_at: datetime
