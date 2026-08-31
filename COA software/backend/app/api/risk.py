from typing import Optional, List
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.api.dependencies import require_authenticated_user, get_current_user
from app.models.user import User
from app.ai.risk_engine import risk_engine
from app.schemas.risk import (
    RiskPredictionRequest,
    BulkRiskPredictionRequest,
    RiskPredictionResponse,
    BulkRiskPredictionResponse,
    RiskHistoryItem,
    HighRiskAssetItem,
    RiskSummaryResponse,
    RiskSummaryData,
    RiskPredictionData
)
from app.schemas.common import ApiResponse, PaginatedResponse, PaginatedData
from app.core.exceptions import ResourceNotFoundError

router = APIRouter(prefix="/risk", tags=["AI Risk Engine"])

ALLOWED_PREDICT_ROLES = [
    "SUPER_ADMIN",
    "CONTROL_OFFICER",
    "BLOCK_PLANNER",
    "ENGINEERING_OFFICER",
    "SIGNAL_TELECOM_OFFICER",
    "TRACTION_OFFICER",
    "MAINTENANCE_SUPERVISOR",
    "ANALYST",
    "ADMIN"
]


def verify_predict_permission(current_user: User = Depends(get_current_user)) -> User:
    role_code = (current_user.role.code if current_user.role else "ANALYST").upper()
    if role_code not in ALLOWED_PREDICT_ROLES:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have permission to trigger AI Risk Predictions."
        )
    return current_user


@router.post("/predict", response_model=RiskPredictionResponse, summary="Generate AI asset risk prediction")
def predict_risk(
    payload: RiskPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_predict_permission)
):
    try:
        _, data_dict = risk_engine.predict_asset_risk(
            db=db,
            asset_id_or_code=payload.asset_id,
            horizon_days=payload.horizon_days,
            user_id=current_user.id
        )
        return RiskPredictionResponse(
            data=RiskPredictionData(**data_dict),
            message="Risk prediction generated successfully"
        )
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to generate prediction: {str(e)}")


@router.post("/predict/bulk", response_model=BulkRiskPredictionResponse, summary="Bulk AI asset risk calculation")
def predict_bulk_risk(
    payload: BulkRiskPredictionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(verify_predict_permission)
):
    try:
        result = risk_engine.predict_bulk_risk(
            db=db,
            asset_ids=payload.asset_ids,
            horizon_days=payload.horizon_days,
            user_id=current_user.id
        )
        return BulkRiskPredictionResponse(
            data=result,
            message="Bulk risk predictions generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Bulk prediction failed: {str(e)}")


@router.get("/summary", response_model=RiskSummaryResponse, summary="AI Risk KPIs and distribution summary")
def get_risk_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    summary_data = risk_engine.get_risk_summary(db)
    return RiskSummaryResponse(
        data=RiskSummaryData(**summary_data),
        message="Risk summary retrieved successfully"
    )


@router.get("/high-risk", summary="Get highest risk assets with filtering and pagination")
def get_high_risk_assets(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    department: Optional[str] = Query(None, description="Department code (e.g. ENG, SIG, TRAC)"),
    asset_type: Optional[str] = Query(None, description="Asset Type (TRACK, SIGNAL, OHE, etc.)"),
    corridor_id: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None, description="LOW, MEDIUM, HIGH, CRITICAL"),
    horizon_days: Optional[int] = Query(None, description="7, 30, 60, 90"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    items, total = risk_engine.get_high_risk_assets(
        db=db,
        limit=limit,
        page=page,
        department=department,
        asset_type=asset_type,
        corridor_id=corridor_id,
        risk_level=risk_level,
        horizon_days=horizon_days
    )

    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return {
        "success": True,
        "data": {
            "items": items,
            "pagination": {
                "page": page,
                "page_size": limit,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1
            }
        },
        "message": "High-risk assets retrieved successfully"
    }


@router.get("/{asset_id}/history", summary="Get previous risk predictions for asset")
def get_asset_risk_history(
    asset_id: str,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    try:
        records = risk_engine.get_risk_history(db=db, asset_id_or_code=asset_id, limit=limit)
        serialized = [
            {
                "id": r.id,
                "asset_id": r.asset_id,
                "prediction_date": r.prediction_date.isoformat() if r.prediction_date else None,
                "horizon_days": r.horizon_days,
                "risk_score": r.risk_score,
                "risk_level": r.risk_level,
                "failure_probability": r.failure_probability,
                "model_name": r.model_name,
                "model_version": r.model_version,
                "recommendation": r.recommendation,
                "explanation": r.explanation,
                "factors": r.features_snapshot.get("factors", []) if r.features_snapshot else []
            }
            for r in records
        ]
        return {
            "success": True,
            "data": serialized,
            "message": "Risk prediction history retrieved successfully"
        }
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{asset_id}", summary="Get latest risk prediction for asset")
def get_latest_asset_risk(
    asset_id: str,
    horizon_days: int = Query(30),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    try:
        latest = risk_engine.get_latest_prediction(db=db, asset_id_or_code=asset_id)
        if not latest:
            # Generate on demand if not existing
            latest, data_dict = risk_engine.predict_asset_risk(
                db=db,
                asset_id_or_code=asset_id,
                horizon_days=horizon_days,
                user_id=current_user.id
            )
            return {
                "success": True,
                "data": data_dict,
                "message": "Generated new asset risk prediction"
            }

        factors_list = []
        if latest.features_snapshot and "factors" in latest.features_snapshot:
            factors_list = latest.features_snapshot["factors"]

        return {
            "success": True,
            "data": {
                "id": latest.id,
                "asset_id": latest.asset_id,
                "asset_code": latest.asset.asset_code if latest.asset else "",
                "asset_name": latest.asset.name if latest.asset else "",
                "asset_type": latest.asset.asset_type if latest.asset else "",
                "department": latest.asset.department.code if latest.asset and latest.asset.department else "ENG",
                "horizon_days": latest.horizon_days,
                "risk_score": latest.risk_score,
                "risk_level": latest.risk_level,
                "failure_probability": latest.failure_probability,
                "model": latest.model_name,
                "model_version": latest.model_version,
                "recommendation": latest.recommendation,
                "explanation": latest.explanation,
                "factors": factors_list,
                "prediction_date": latest.prediction_date.isoformat() if latest.prediction_date else None
            },
            "message": "Latest risk prediction retrieved successfully"
        }
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
