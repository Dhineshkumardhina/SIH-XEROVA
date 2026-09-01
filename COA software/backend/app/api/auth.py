import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    verify_password, hash_password, create_access_token,
    generate_refresh_token, hash_token, validate_password_strength
)
from app.api.dependencies import get_db, get_current_user
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.models.audit import AuditLog
from app.schemas.auth import (
    LoginRequest, RefreshRequest, TokenResponse,
    UserResponse, PasswordChangeRequest, UserSummary, DepartmentSummary
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def create_audit_entry(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    entity_type: str = "USER",
    entity_id: Optional[str] = None,
    description: Optional[str] = None,
    ip_address: Optional[str] = None
) -> None:
    """Helper to record security audit logs without leaking credentials."""
    try:
        log = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id or user_id,
            description=description,
            ip_address=ip_address
        )
        db.add(log)
        db.commit()
    except Exception:
        db.rollback()

def build_user_summary(user: User) -> UserSummary:
    dept_summary = None
    if user.department:
        dept_summary = DepartmentSummary(
            id=user.department.id,
            code=user.department.code,
            name=user.department.name
        )
    return UserSummary(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        roles=[r.code for r in user.roles],
        permissions=user.permissions,
        department=dept_summary,
        is_active=user.is_active
    )

def build_user_response(user: User) -> UserResponse:
    dept_summary = None
    if user.department:
        dept_summary = DepartmentSummary(
            id=user.department.id,
            code=user.department.code,
            name=user.department.name
        )
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        full_name=user.full_name,
        roles=[r.code for r in user.roles],
        permissions=user.permissions,
        department=dept_summary,
        is_active=user.is_active,
        is_locked=user.is_locked,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.post("/login")
def login(request_data: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """
    Authenticate user using email or username and password.
    Enforces account lockout protection and issues access & refresh tokens.
    """
    identifier = request_data.get_login_identifier().strip()
    password = request_data.password

    client_ip = request.client.host if request.client else None

    # Generic error message to prevent enumeration
    generic_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_CREDENTIALS",
            "message": "Invalid username or password."
        },
        headers={"WWW-Authenticate": "Bearer"},
    )

    user = db.query(User).filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user:
        create_audit_entry(
            db, action="LOGIN_FAILED", description=f"Login attempt failed for identifier: {identifier[:3]}***", ip_address=client_ip
        )
        raise generic_error

    # Check lockout
    if user.is_locked:
        if user.last_failed_login_at:
            lockout_time = user.last_failed_login_at
            if lockout_time.tzinfo is not None:
                lockout_time = lockout_time.replace(tzinfo=None)
            from datetime import timedelta
            if datetime.utcnow() - lockout_time > timedelta(minutes=settings.ACCOUNT_LOCKOUT_DURATION_MINUTES):
                user.is_locked = False
                user.failed_login_attempts = 0
                db.commit()
            else:
                create_audit_entry(
                    db, action="LOGIN_FAILED", user_id=user.id, description="Login rejected: account is locked.", ip_address=client_ip
                )
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "code": "ACCOUNT_LOCKED",
                        "message": "Account is locked due to multiple failed login attempts. Please try again later."
                    }
                )
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"code": "ACCOUNT_LOCKED", "message": "Account is locked."}
            )

    # Check active status
    if not user.is_active:
        create_audit_entry(
            db, action="LOGIN_FAILED", user_id=user.id, description="Login rejected: account is inactive.", ip_address=client_ip
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_DISABLED", "message": "Account is inactive. Contact administrator."}
        )

    # Verify password
    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        user.last_failed_login_at = datetime.utcnow()
        if user.failed_login_attempts >= settings.ACCOUNT_LOCKOUT_MAX_ATTEMPTS:
            user.is_locked = True
            db.commit()
            create_audit_entry(
                db, action="ACCOUNT_LOCKED", user_id=user.id,
                description=f"Account locked after {user.failed_login_attempts} failed attempts.", ip_address=client_ip
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "ACCOUNT_LOCKED",
                    "message": "Account has been locked due to consecutive failed login attempts."
                }
            )
        db.commit()
        create_audit_entry(
            db, action="LOGIN_FAILED", user_id=user.id,
            description=f"Failed password attempt ({user.failed_login_attempts}/{settings.ACCOUNT_LOCKOUT_MAX_ATTEMPTS})", ip_address=client_ip
        )
        raise generic_error

    # Successful Login
    user.failed_login_attempts = 0
    user.last_login_at = datetime.utcnow()

    # Generate tokens
    roles = [r.code for r in user.roles]
    access_token = create_access_token(subject=user.id, email=user.email, roles=roles)
    raw_refresh, refresh_hash, expires_at = generate_refresh_token()

    # Store refresh token
    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=expires_at
    )
    db.add(refresh_record)
    db.commit()

    create_audit_entry(
        db, action="LOGIN_SUCCESS", user_id=user.id, description="Successful authentication.", ip_address=client_ip
    )

    user_summary = build_user_summary(user)

    return {
        "success": true_bool,
        "data": {
            "access_token": access_token,
            "refresh_token": raw_refresh,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user_summary.model_dump()
        },
        "message": "Login successful"
    }

true_bool = True

@router.post("/refresh")
def refresh_token_endpoint(request_data: RefreshRequest, request: Request, db: Session = Depends(get_db)):
    """
    Validates the refresh token and rotates it, returning a new access token
    and new refresh token.
    """
    raw_token = request_data.refresh_token.strip()
    token_hash = hash_token(raw_token)

    token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
    if not token_record or not token_record.is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_REFRESH_TOKEN",
                "message": "Invalid, expired, or revoked refresh token."
            }
        )

    user = token_record.user
    if not user or not user.is_active or user.is_locked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "USER_INACTIVE",
                "message": "Associated account is inactive or locked."
            }
        )

    # Token rotation: revoke previous token
    token_record.revoked_at = datetime.utcnow()
    token_record.last_used_at = datetime.utcnow()

    # Generate new tokens
    roles = [r.code for r in user.roles]
    new_access_token = create_access_token(subject=user.id, email=user.email, roles=roles)
    new_raw_refresh, new_refresh_hash, new_expires_at = generate_refresh_token()

    new_token_record = RefreshToken(
        user_id=user.id,
        token_hash=new_refresh_hash,
        expires_at=new_expires_at
    )
    db.add(new_token_record)
    db.commit()

    client_ip = request.client.host if request.client else None
    create_audit_entry(
        db, action="TOKEN_REFRESH", user_id=user.id, description="Refresh token rotated.", ip_address=client_ip
    )

    user_summary = build_user_summary(user)

    return {
        "success": True,
        "data": {
            "access_token": new_access_token,
            "refresh_token": new_raw_refresh,
            "token_type": "bearer",
            "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            "user": user_summary.model_dump()
        },
        "message": "Token refreshed successfully"
    }

@router.post("/logout")
def logout(
    request_data: Optional[RefreshRequest] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes the active refresh token, terminating the session.
    """
    if request_data and request_data.refresh_token:
        token_hash = hash_token(request_data.refresh_token.strip())
        token_record = db.query(RefreshToken).filter(RefreshToken.token_hash == token_hash).first()
        if token_record:
            token_record.revoked_at = datetime.utcnow()
            db.commit()

    user_id = current_user.id if current_user else None
    if user_id:
        create_audit_entry(db, action="LOGOUT", user_id=user_id, description="User logged out.")

    return {
        "success": True,
        "data": {},
        "message": "Logout successful"
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns authenticated user profile, roles, permissions, and department.
    """
    resp = build_user_response(current_user)
    return {
        "success": True,
        "data": resp.model_dump(),
        "message": "Current user profile retrieved"
    }

@router.post("/change-password")
def change_password(
    request_data: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Changes the authenticated user's password and revokes all active refresh tokens.
    """
    if not verify_password(request_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_CURRENT_PASSWORD",
                "message": "Current password does not match."
            }
        )

    valid, err_msg = validate_password_strength(request_data.new_password)
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "WEAK_PASSWORD",
                "message": err_msg
            }
        )

    current_user.password_hash = hash_password(request_data.new_password)

    # Invalidate all active refresh tokens for this user
    db.query(RefreshToken).filter(
        RefreshToken.user_id == current_user.id,
        RefreshToken.revoked_at.is_(None)
    ).update({"revoked_at": datetime.utcnow()}, synchronize_session=False)

    db.commit()

    create_audit_entry(
        db, action="PASSWORD_CHANGED", user_id=current_user.id,
        description="User updated password. Active refresh tokens revoked."
    )

    return {
        "success": True,
        "data": {},
        "message": "Password changed successfully. All active sessions have been revoked."
    }
