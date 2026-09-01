from datetime import datetime, timezone, timedelta
from typing import Generator, Optional, List, Callable
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import decode_token
from app.database.session import SessionLocal
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login",
    auto_error=False
)

def get_db() -> Generator:
    """Reusable database dependency for FastAPI routers."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates JWT access token, checks account lock / expiration,
    and returns the active User object with loaded roles & permissions.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "AUTHENTICATION_REQUIRED",
                "message": "Authentication required. Please provide a valid Bearer token."
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_TOKEN",
                "message": "Invalid or expired access token."
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_TOKEN",
                "message": "Token payload missing subject identifier."
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "USER_NOT_FOUND",
                "message": "Authenticated user not found."
            },
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check account lockout duration
    if user.is_locked:
        if user.last_failed_login_at:
            lockout_time = user.last_failed_login_at
            if lockout_time.tzinfo is not None:
                lockout_time = lockout_time.replace(tzinfo=None)
            lock_duration = timedelta(minutes=settings.ACCOUNT_LOCKOUT_DURATION_MINUTES)
            if datetime.utcnow() - lockout_time > lock_duration:
                # Lockout window has elapsed - auto-unlock
                user.is_locked = False
                user.failed_login_attempts = 0
                db.commit()
            else:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "ACCOUNT_LOCKED",
                        "message": "Account is temporarily locked due to multiple failed login attempts. Please try again later or contact administrator."
                    }
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ACCOUNT_LOCKED",
                    "message": "Account is locked. Please contact administrator."
                }
            )

    # Check active status
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "ACCOUNT_DISABLED",
                "message": "Account is deactivated. Please contact administrator."
            }
        )

    return user

def require_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """Dependency verifying an authenticated and active user."""
    return current_user

def require_role(*allowed_roles: str) -> Callable[[User], User]:
    """
    Dependency factory verifying that the user has at least one of the required roles.
    SUPER_ADMIN always passes.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_codes = {r.code for r in current_user.roles}
        if "SUPER_ADMIN" in user_role_codes:
            return current_user
        if not user_role_codes.intersection(allowed_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ROLE_NOT_ALLOWED",
                    "message": f"Action requires one of the following roles: {', '.join(allowed_roles)}"
                }
            )
        return current_user
    return role_checker

def require_permission(*required_permissions: str) -> Callable[[User], User]:
    """
    Dependency factory verifying that the user has all specified permissions.
    SUPER_ADMIN always passes.
    """
    def permission_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_codes = {r.code for r in current_user.roles}
        if "SUPER_ADMIN" in user_role_codes:
            return current_user
        user_perms = set(current_user.permissions)
        missing_perms = [p for p in required_permissions if p not in user_perms]
        if missing_perms:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "INSUFFICIENT_PERMISSION",
                    "message": f"Missing required permissions: {', '.join(missing_perms)}"
                }
            )
        return current_user
    return permission_checker

def require_department(*allowed_departments: str) -> Callable[[User], User]:
    """
    Dependency factory verifying department access boundaries.
    SUPER_ADMIN and CONTROL_OFFICER have organization-wide access.
    """
    def department_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role_codes = {r.code for r in current_user.roles}
        if "SUPER_ADMIN" in user_role_codes or "CONTROL_OFFICER" in user_role_codes:
            return current_user
        user_dept = current_user.department.code if current_user.department else ""
        if user_dept not in allowed_departments:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "DEPARTMENT_RESTRICTED",
                    "message": f"Access restricted to departments: {', '.join(allowed_departments)}"
                }
            )
        return current_user
    return department_checker
