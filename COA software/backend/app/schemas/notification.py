from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    severity: str = "INFO"
    title: str
    message: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: Optional[str] = None

class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: Optional[str] = None
    is_read: bool
    created_at: datetime
    read_at: Optional[datetime] = None
