from typing import Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class DepartmentBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class DepartmentResponse(DepartmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime
    updated_at: datetime
