from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    """Unified success response envelope used by all API endpoints.
    ``success`` is always ``True`` for a successful request.
    ``data`` holds the payload of type ``T`` and may be ``None`` for endpoints
    that return no content (e.g., DELETE). ``message`` provides a human‑readable
    description.
    """
    success: bool = True
    data: Optional[T] = None
    message: str = ""

class ErrorDetail(BaseModel):
    code: str
    message: str

class ErrorResponse(BaseModel):
    """Unified error response envelope.
    ``success`` is always ``False``. ``error`` contains a machine‑readable ``code``
    and a human‑readable ``message``. Additional ``details`` may be added by the
    exception handlers.
    """
    success: bool = False
    error: ErrorDetail
    detail: Optional[ErrorDetail] = None  # Compatibility with older tests
