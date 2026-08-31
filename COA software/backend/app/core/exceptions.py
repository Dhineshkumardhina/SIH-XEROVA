from typing import Optional, Any, Dict
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

class AppException(Exception):
    def __init__(self, code: str, message: str, status_code: int = status.HTTP_400_BAD_REQUEST, data: Optional[Any] = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.data = data
        super().__init__(message)

class ResourceNotFoundError(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            code="RESOURCE_NOT_FOUND",
            message=f"{resource} with id '{identifier}' was not found",
            status_code=status.HTTP_404_NOT_FOUND
        )

class DuplicateResourceError(AppException):
    def __init__(self, resource: str, identifier: Any):
        super().__init__(
            code="DUPLICATE_RESOURCE",
            message=f"{resource} with identifier '{identifier}' already exists",
            status_code=status.HTTP_409_CONFLICT
        )

class ValidationError(AppException):
    def __init__(self, message: str, data: Optional[Any] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            data=data
        )

class UnauthorizedError(AppException):
    def __init__(self, message: str = "Invalid credentials or token expired"):
        super().__init__(
            code="UNAUTHORIZED",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED
        )

class ForbiddenError(AppException):
    def __init__(self, message: str = "Access denied: insufficient permissions"):
        super().__init__(
            code="FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )

class InvalidStatusTransitionError(AppException):
    def __init__(self, current_status: str, target_status: str, entity: str = "Entity"):
        super().__init__(
            code="INVALID_STATUS_TRANSITION",
            message=f"Cannot transition {entity} from status '{current_status}' to '{target_status}'",
            status_code=status.HTTP_400_BAD_REQUEST
        )

class BlockApprovalForbiddenError(AppException):
    def __init__(self, message: str = "Only authorized Control Officers or Super Administrators may approve blocks"):
        super().__init__(
            code="BLOCK_APPROVAL_FORBIDDEN",
            message=message,
            status_code=status.HTTP_403_FORBIDDEN
        )


def create_error_response(code: str, message: str, status_code: int, data: Optional[Any] = None) -> JSONResponse:
    error_payload = {
        "code": code,
        "message": message
    }
    if data:
        error_payload["details"] = data

    return JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "error": error_payload,
            "detail": error_payload  # Dual detail key for compatibility with existing tests
        }
    )

async def app_exception_handler(request: Request, exc: AppException):
    return create_error_response(
        code=exc.code,
        message=exc.message,
        status_code=exc.status_code,
        data=exc.data
    )

async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    # Handle dict detail if provided
    if isinstance(exc.detail, dict):
        code = exc.detail.get("code") or ("UNAUTHORIZED" if exc.status_code == 401 else "FORBIDDEN" if exc.status_code == 403 else "HTTP_ERROR")
        message = exc.detail.get("message") or str(exc.detail)
        return create_error_response(code=code, message=message, status_code=exc.status_code)
    
    code = "UNAUTHORIZED" if exc.status_code == 401 else "FORBIDDEN" if exc.status_code == 403 else "NOT_FOUND" if exc.status_code == 404 else "HTTP_ERROR"
    return create_error_response(code=code, message=str(exc.detail), status_code=exc.status_code)

async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    message = "; ".join([f"{'.'.join(str(loc) for loc in err['loc'])}: {err['msg']}" for err in errors])
    return create_error_response(
        code="VALIDATION_ERROR",
        message=f"Request validation failed: {message}",
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        data=errors
    )
