from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class StationBase(BaseModel):
    code: str
    name: str
    division_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class StationCreate(StationBase):
    pass

class StationUpdate(BaseModel):
    code: Optional[str] = None
    name: Optional[str] = None
    division_id: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class StationResponse(StationBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
