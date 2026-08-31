from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class TrainBase(BaseModel):
    train_number: str
    train_name: str
    train_type: str = "EXPRESS"
    default_direction: str = "UP"
    origin: str = "STN-A"
    destination: str = "STN-C"
    priority: int = 1
    status: str = "SCHEDULED"
    corridor_id: Optional[str] = None

class TrainCreate(TrainBase):
    pass

class TrainUpdate(BaseModel):
    train_name: Optional[str] = None
    train_type: Optional[str] = None
    default_direction: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    priority: Optional[int] = None

class TrainResponse(TrainBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    direction: Optional[str] = "UP"
    created_at: datetime
    updated_at: datetime
    is_goods_train: bool = False
    is_passenger_train: bool = True

class TrainScheduleBase(BaseModel):
    train_id: str
    station_id: Optional[str] = None
    corridor_id: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    arrival_time: Optional[datetime] = None
    departure_time: Optional[datetime] = None
    line: Optional[str] = "MAIN_1"
    sequence_number: int = 1

class TrainScheduleCreate(TrainScheduleBase):
    pass

class TrainScheduleResponse(TrainScheduleBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime

class TrainMovementBase(BaseModel):
    train_id: str
    corridor_id: Optional[str] = None
    station_id: Optional[str] = None
    event_type: str = "ARRIVAL"
    event_time: Optional[datetime] = None
    actual_time: Optional[datetime] = None
    direction: Optional[str] = "UP"
    line: Optional[str] = "MAIN_1"
    status: str = "SCHEDULED"

class TrainMovementCreate(TrainMovementBase):
    pass

class TrainMovementResponse(TrainMovementBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
