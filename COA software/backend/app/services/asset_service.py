from typing import Optional, List
from sqlalchemy.orm import Session, joinedload
from app.models.asset import Asset
from app.models.asset_health import AssetHealth
from app.models.defect import Defect
from app.models.maintenance import MaintenanceTask, MaintenanceHistory
from app.schemas.asset import (
    AssetCreate, AssetUpdate, AssetHealthResponse, AssetRiskResponse
)
from app.core.pagination import paginate_query
from app.core.exceptions import ResourceNotFoundError, DuplicateResourceError
from app.services.audit_service import create_audit_log

def list_assets(
    db: Session,
    page: int = 1,
    page_size: int = 25,
    department_id: Optional[str] = None,
    asset_type: Optional[str] = None,
    corridor_id: Optional[str] = None,
    station_id: Optional[str] = None,
    status: Optional[str] = None,
    criticality_min: Optional[float] = None,
    criticality_max: Optional[float] = None,
    health_min: Optional[float] = None,
    health_max: Optional[float] = None,
    search: Optional[str] = None
):
    query = db.query(Asset).options(joinedload(Asset.department))

    if department_id:
        from app.models.department import Department
        query = query.join(Department, Asset.department_id == Department.id, isouter=True)
        query = query.filter((Department.id == department_id) | (Department.code == department_id))
    if asset_type:
        query = query.filter(Asset.asset_type == asset_type.upper())
    if corridor_id:
        query = query.filter(Asset.corridor_id == corridor_id)
    if station_id:
        query = query.filter(Asset.station_id == station_id)
    if status:
        query = query.filter(Asset.status == status.upper())
    if criticality_min is not None:
        query = query.filter(Asset.criticality_score >= criticality_min)
    if criticality_max is not None:
        query = query.filter(Asset.criticality_score <= criticality_max)
    if health_min is not None:
        query = query.filter(Asset.health_score >= health_min)
    if health_max is not None:
        query = query.filter(Asset.health_score <= health_max)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Asset.asset_code.ilike(s)) | (Asset.name.ilike(s)) | (Asset.description.ilike(s))
        )

    allowed_sorts = {
        "asset_code": Asset.asset_code,
        "name": Asset.name,
        "criticality": Asset.criticality_score,
        "criticality_score": Asset.criticality_score,
        "health": Asset.health_score,
        "health_score": Asset.health_score,
        "status": Asset.status,
        "created_at": Asset.created_at
    }

    return paginate_query(
        query=query,
        page=page,
        page_size=page_size,
        allowed_sorts=allowed_sorts,
        default_sort=Asset.asset_code.asc()
    )

def get_asset_by_id(db: Session, asset_id: str) -> Asset:
    asset = db.query(Asset).options(joinedload(Asset.department)).filter(
        (Asset.id == asset_id) | (Asset.asset_code == asset_id)
    ).first()
    if not asset:
        raise ResourceNotFoundError("Asset", asset_id)
    return asset

def create_asset(db: Session, payload: AssetCreate, user_id: Optional[str] = None) -> Asset:
    if db.query(Asset).filter(Asset.asset_code == payload.asset_code).first():
        raise DuplicateResourceError("Asset", payload.asset_code)

    asset = Asset(
        asset_code=payload.asset_code,
        asset_type=payload.asset_type,
        department_id=payload.department_id,
        name=payload.name,
        description=payload.description,
        station_id=payload.station_id,
        corridor_id=payload.corridor_id,
        latitude=payload.latitude,
        longitude=payload.longitude,
        criticality_score=payload.criticality_score,
        health_score=payload.health_score,
        status=payload.status
    )
    db.add(asset)
    db.commit()
    db.refresh(asset)

    create_audit_log(
        db=db,
        action="ASSET_CREATED",
        entity_type="Asset",
        entity_id=asset.id,
        user_id=user_id,
        new_value={"asset_code": asset.asset_code, "name": asset.name}
    )
    return asset

def update_asset(db: Session, asset_id: str, payload: AssetUpdate, user_id: Optional[str] = None) -> Asset:
    asset = get_asset_by_id(db, asset_id)
    old_val = {"name": asset.name, "health_score": asset.health_score, "status": asset.status}

    if payload.name:
        asset.name = payload.name
    if payload.description is not None:
        asset.description = payload.description
    if payload.department_id:
        asset.department_id = payload.department_id
    if payload.station_id is not None:
        asset.station_id = payload.station_id
    if payload.corridor_id is not None:
        asset.corridor_id = payload.corridor_id
    if payload.latitude is not None:
        asset.latitude = payload.latitude
    if payload.longitude is not None:
        asset.longitude = payload.longitude
    if payload.criticality_score is not None:
        asset.criticality_score = payload.criticality_score
    if payload.health_score is not None:
        asset.health_score = payload.health_score
    if payload.status:
        asset.status = payload.status

    db.commit()
    db.refresh(asset)

    create_audit_log(
        db=db,
        action="ASSET_UPDATED",
        entity_type="Asset",
        entity_id=asset.id,
        user_id=user_id,
        old_value=old_val,
        new_value={"name": asset.name, "health_score": asset.health_score, "status": asset.status}
    )
    return asset

def delete_asset(db: Session, asset_id: str, user_id: Optional[str] = None) -> None:
    asset = get_asset_by_id(db, asset_id)
    old_val = {"asset_code": asset.asset_code, "name": asset.name}
    db.delete(asset)
    db.commit()

    create_audit_log(
        db=db,
        action="ASSET_DELETED",
        entity_type="Asset",
        entity_id=asset_id,
        user_id=user_id,
        old_value=old_val
    )

def get_asset_defects(db: Session, asset_id: str, page: int = 1, page_size: int = 25):
    asset = get_asset_by_id(db, asset_id)
    query = db.query(Defect).filter(Defect.asset_id == asset.id)
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=Defect.detected_at.desc())

def get_asset_maintenance(db: Session, asset_id: str, page: int = 1, page_size: int = 25):
    asset = get_asset_by_id(db, asset_id)
    query = db.query(MaintenanceTask).filter(MaintenanceTask.asset_id == asset.id)
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceTask.created_at.desc())

def get_asset_history(db: Session, asset_id: str, page: int = 1, page_size: int = 25):
    asset = get_asset_by_id(db, asset_id)
    query = db.query(MaintenanceHistory).filter(MaintenanceHistory.asset_id == asset.id)
    return paginate_query(query=query, page=page, page_size=page_size, default_sort=MaintenanceHistory.completed_at.desc())

def get_asset_health(db: Session, asset_id: str) -> AssetHealthResponse:
    asset = get_asset_by_id(db, asset_id)
    record = db.query(AssetHealth).filter(AssetHealth.asset_id == asset.id).order_by(AssetHealth.recorded_at.desc()).first()
    if record:
        return AssetHealthResponse.model_validate(record)
    from datetime import datetime
    return AssetHealthResponse(
        id=f"synth-{asset.id[:8]}",
        asset_id=asset.id,
        health_score=asset.health_score,
        condition_score=asset.health_score,
        failure_count=0,
        defect_count=0,
        recorded_at=datetime.utcnow()
    )

def get_asset_risk(db: Session, asset_id: str) -> AssetRiskResponse:
    from app.ai.risk_engine import risk_engine
    asset = get_asset_by_id(db, asset_id)
    latest = risk_engine.get_latest_prediction(db, asset.id)
    if not latest:
        _, data_dict = risk_engine.predict_asset_risk(db, asset.id)
        risk_score = data_dict["risk_score"]
        tier = data_dict["risk_level"]
        action = data_dict["recommendation"]
    else:
        risk_score = latest.risk_score
        tier = latest.risk_level
        action = latest.recommendation or latest.recommended_action or "Routine monitoring"

    return AssetRiskResponse(
        asset_id=asset.id,
        asset_code=asset.asset_code,
        asset_name=asset.name,
        risk_score=risk_score,
        health_score=asset.health_score,
        criticality_score=asset.criticality_score,
        criticality_tier=tier,
        recommended_action=action
    )
