from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    user_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    request_id: Optional[str] = None
    created_at: datetime
