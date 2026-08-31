from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.department import Department
from app.schemas.department import DepartmentCreate, DepartmentUpdate
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError
from app.services.audit_service import create_audit_log

def list_departments(db: Session) -> List[Department]:
    return db.query(Department).order_by(Department.code).all()

def get_department_by_id(db: Session, department_id: str) -> Department:
    dept = db.query(Department).filter(
        (Department.id == department_id) | (Department.code == department_id)
    ).first()
    if not dept:
        raise ResourceNotFoundError("Department", department_id)
    return dept

def create_department(db: Session, payload: DepartmentCreate, user_id: Optional[str] = None) -> Department:
    if db.query(Department).filter((Department.code == payload.code) | (Department.name == payload.name)).first():
        raise DuplicateResourceError("Department", payload.code)

    dept = Department(
        code=payload.code,
        name=payload.name,
        description=payload.description
    )
    db.add(dept)
    db.commit()
    db.refresh(dept)

    create_audit_log(
        db=db,
        action="DEPARTMENT_CREATED",
        entity_type="Department",
        entity_id=dept.id,
        user_id=user_id,
        new_value={"code": dept.code, "name": dept.name}
    )
    return dept

def update_department(db: Session, department_id: str, payload: DepartmentUpdate, user_id: Optional[str] = None) -> Department:
    dept = get_department_by_id(db, department_id)
    old_val = {"name": dept.name, "description": dept.description}

    if payload.name:
        dept.name = payload.name
    if payload.description is not None:
        dept.description = payload.description

    db.commit()
    db.refresh(dept)

    create_audit_log(
        db=db,
        action="DEPARTMENT_UPDATED",
        entity_type="Department",
        entity_id=dept.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"name": dept.name, "description": dept.description}
    )
    return dept
