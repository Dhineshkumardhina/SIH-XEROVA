from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.role import Role
from app.schemas.auth import UserCreate, UserUpdate
from app.core.security import hash_password, validate_password_strength
from app.core.pagination import paginate_query, PaginationMeta
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError, ForbiddenError, ValidationError
from app.services.audit_service import create_audit_log

def list_users(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    role: Optional[str] = None,
    department: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    query = db.query(User)

    if role:
        query = query.filter(User.roles.any(Role.code == role))
    if department:
        from app.models.department import Department
        query = query.join(Department, User.department_id == Department.id, isouter=True)
        query = query.filter((Department.code == department) | (Department.name == department))
    if status:
        if status.upper() in ["ACTIVE", "TRUE", "1"]:
            query = query.filter(User.is_active == True)
        elif status.upper() in ["INACTIVE", "FALSE", "0"]:
            query = query.filter(User.is_active == False)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (User.username.ilike(s)) | (User.email.ilike(s)) | (User.full_name.ilike(s))
        )

    allowed_sorts = {
        "username": User.username,
        "email": User.email,
        "full_name": User.full_name,
        "created_at": User.created_at
    }

    items, meta = paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=User.created_at.desc()
    )
    return items, meta

def get_user_by_id(db: Session, user_id: str) -> User:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise ResourceNotFoundError("User", user_id)
    return user

def create_user(db: Session, payload: UserCreate, current_user: User) -> User:
    # Check unique username and email
    if db.query(User).filter(User.username == payload.username).first():
        raise DuplicateResourceError("User", payload.username)
    if db.query(User).filter(User.email == payload.email).first():
        raise DuplicateResourceError("User", payload.email)

    # Restrict SUPER_ADMIN role assignment
    if "SUPER_ADMIN" in payload.role_codes and not any(r.code == "SUPER_ADMIN" for r in current_user.roles):
        raise ForbiddenError("Only Super Administrators can create or assign the SUPER_ADMIN role")

    # Validate password
    validate_password_strength(payload.password)

    roles = db.query(Role).filter(Role.code.in_(payload.role_codes)).all()

    new_user = User(
        email=payload.email,
        username=payload.username,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        department_id=payload.department_id,
        is_active=True,
        roles=roles
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="USER_CREATED",
        entity_type="User",
        entity_id=new_user.id,
        new_value={"username": new_user.username, "roles": [r.code for r in new_user.roles]}
    )

    return new_user

def update_user(db: Session, user_id: str, payload: UserUpdate, current_user: User) -> User:
    user = get_user_by_id(db, user_id)

    old_val = {"email": user.email, "full_name": user.full_name, "department_id": user.department_id}

    if payload.email:
        existing = db.query(User).filter(User.email == payload.email, User.id != user_id).first()
        if existing:
            raise DuplicateResourceError("User email", payload.email)
        user.email = payload.email

    if payload.full_name:
        user.full_name = payload.full_name

    if payload.department_id is not None:
        user.department_id = payload.department_id

    if payload.role_codes is not None:
        if "SUPER_ADMIN" in payload.role_codes and not any(r.code == "SUPER_ADMIN" for r in current_user.roles):
            raise ForbiddenError("Only Super Administrators can assign the SUPER_ADMIN role")
        roles = db.query(Role).filter(Role.code.in_(payload.role_codes)).all()
        user.roles = roles

    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="USER_UPDATED",
        entity_type="User",
        entity_id=user.id,
        old_value=old_val,
        new_value={"email": user.email, "full_name": user.full_name}
    )

    return user

def delete_user(db: Session, user_id: str, current_user: User) -> None:
    if user_id == current_user.id:
        raise ForbiddenError("You cannot delete your own user account")

    user = get_user_by_id(db, user_id)
    old_data = {"username": user.username, "email": user.email}

    db.delete(user)
    db.commit()

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="USER_DELETED",
        entity_type="User",
        entity_id=user_id,
        old_value=old_data
    )

def set_user_active_status(db: Session, user_id: str, is_active: bool, current_user: User) -> User:
    if user_id == current_user.id and not is_active:
        raise ForbiddenError("You cannot deactivate your own account")

    user = get_user_by_id(db, user_id)
    user.is_active = is_active
    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="USER_ACTIVATED" if is_active else "USER_DEACTIVATED",
        entity_type="User",
        entity_id=user.id
    )

    return user

def unlock_user_account(db: Session, user_id: str, current_user: User) -> User:
    user = get_user_by_id(db, user_id)
    user.is_locked = False
    user.failed_login_attempts = 0
    db.commit()
    db.refresh(user)

    create_audit_log(
        db=db,
        user_id=current_user.id,
        action="ACCOUNT_UNLOCKED",
        entity_type="User",
        entity_id=user.id
    )

    return user
