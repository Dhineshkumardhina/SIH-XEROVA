from typing import Generic, TypeVar, List, Optional, Any
from pydantic import BaseModel, ConfigDict
from app.core.pagination import PaginationMeta

T = TypeVar("T")

class ApiResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    success: bool = True
    data: T
    message: str = "Operation successful"

class PaginatedData(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    items: List[T]
    pagination: PaginationMeta

class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    success: bool = True
    data: PaginatedData[T]
    message: str = "Items retrieved successfully"

class ApiErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[Any] = None

class ApiErrorResponse(BaseModel):
    success: bool = False
    error: ApiErrorDetail
