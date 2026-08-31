import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, desc, func

from app.models.asset import Asset
from app.models.ai import AssetRiskPrediction
from app.ai.features.asset_features import extract_asset_risk_features
from app.ai.models.factory import RiskModelFactory
from app.ai.explainability import format_risk_factor_breakdown, generate_risk_narrative
from app.services.audit_service import create_audit_log
from app.core.exceptions import ResourceNotFoundError


class AIRiskEngine:
    """
    Core AI Risk Prediction Engine for railway infrastructure assets.
    Coordinates feature engineering, baseline risk modeling, persistence, and explainability.
    """

    @classmethod
    def predict_asset_risk(
        cls,
        db: Session,
        asset_id_or_code: str,
        horizon_days: int = 30,
        custom_weights: Optional[Dict[str, float]] = None,
        user_id: Optional[str] = None
    ) -> Tuple[AssetRiskPrediction, Dict[str, Any]]:
        # 1. Fetch Asset
        asset = db.scalar(
            select(Asset)
            .options(joinedload(Asset.department), joinedload(Asset.corridor))
            .where(
                (Asset.id == asset_id_or_code) | (Asset.asset_code == asset_id_or_code)
            )
        )
        if not asset:
            raise ResourceNotFoundError("Asset", asset_id_or_code)

        # 2. Extract Features
        features = extract_asset_risk_features(asset, db, horizon_days=horizon_days)

        # 3. Model Inference
        model = RiskModelFactory.get_model("baseline")
        result = model.predict(features, horizon_days=horizon_days, custom_weights=custom_weights)

        # 4. Format Factors & Narrative
        factors_list = format_risk_factor_breakdown(result.factor_breakdown)
        narrative = generate_risk_narrative(
            asset_code=asset.asset_code,
            asset_type=asset.asset_type,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            failure_probability=result.failure_probability,
            factors=factors_list,
            horizon_days=horizon_days
        )

        # 5. Persist Prediction
        features_snapshot_dict = {
            "features": features.to_dict(),
            "factors": factors_list,
            "horizon_days": horizon_days,
            "generated_at": datetime.utcnow().isoformat()
        }

        prediction = AssetRiskPrediction(
            asset_id=asset.id,
            horizon_days=horizon_days,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            failure_probability=result.failure_probability,
            model_name=result.model_name,
            model_version=result.model_version,
            features_snapshot=features_snapshot_dict,
            recommendation=result.recommendation,
            explanation=narrative,
            recommended_action=result.recommendation,
            prediction_date=datetime.utcnow()
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        # 6. Audit Log
        create_audit_log(
            db=db,
            action="AI_RISK_PREDICTION_GENERATED",
            entity_type="Asset",
            entity_id=asset.id,
            user_id=user_id,
            new_value={
                "asset_code": asset.asset_code,
                "risk_score": result.risk_score,
                "risk_level": result.risk_level,
                "failure_probability": result.failure_probability,
                "horizon_days": horizon_days,
                "model": f"{result.model_name}:{result.model_version}"
            }
        )

        return prediction, {
            "asset_id": asset.id,
            "asset_code": asset.asset_code,
            "asset_name": asset.name,
            "asset_type": asset.asset_type,
            "department": asset.department.code if asset.department else "ENG",
            "corridor_id": asset.corridor_id,
            "horizon_days": horizon_days,
            "risk_score": result.risk_score,
            "risk_level": result.risk_level,
            "failure_probability": result.failure_probability,
            "model": result.model_name,
            "model_version": result.model_version,
            "recommendation": result.recommendation,
            "explanation": narrative,
            "factors": factors_list,
            "prediction_date": prediction.prediction_date.isoformat() if prediction.prediction_date else None
        }

    @classmethod
    def predict_bulk_risk(
        cls,
        db: Session,
        asset_ids: List[str],
        horizon_days: int = 30,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        successful_predictions = []
        failed_predictions = []

        for aid in asset_ids:
            try:
                _, payload = cls.predict_asset_risk(
                    db=db,
                    asset_id_or_code=aid,
                    horizon_days=horizon_days,
                    user_id=user_id
                )
                successful_predictions.append(payload)
            except Exception as e:
                failed_predictions.append({
                    "asset_id": aid,
                    "error": str(e)
                })

        duration_ms = round((time.time() - start_time) * 1000, 2)

        return {
            "total_requested": len(asset_ids),
            "generated_count": len(successful_predictions),
            "failed_count": len(failed_predictions),
            "processing_time_ms": duration_ms,
            "predictions": successful_predictions,
            "failed_predictions": failed_predictions
        }

    @classmethod
    def get_latest_prediction(cls, db: Session, asset_id_or_code: str) -> Optional[AssetRiskPrediction]:
        asset = db.scalar(
            select(Asset).where(
                (Asset.id == asset_id_or_code) | (Asset.asset_code == asset_id_or_code)
            )
        )
        if not asset:
            return None

        return db.scalar(
            select(AssetRiskPrediction)
            .where(AssetRiskPrediction.asset_id == asset.id)
            .order_by(AssetRiskPrediction.prediction_date.desc())
        )

    @classmethod
    def get_risk_history(cls, db: Session, asset_id_or_code: str, limit: int = 20) -> List[AssetRiskPrediction]:
        asset = db.scalar(
            select(Asset).where(
                (Asset.id == asset_id_or_code) | (Asset.asset_code == asset_id_or_code)
            )
        )
        if not asset:
            raise ResourceNotFoundError("Asset", asset_id_or_code)

        return list(db.scalars(
            select(AssetRiskPrediction)
            .where(AssetRiskPrediction.asset_id == asset.id)
            .order_by(AssetRiskPrediction.prediction_date.desc())
            .limit(limit)
        ))

    @classmethod
    def get_high_risk_assets(
        cls,
        db: Session,
        limit: int = 20,
        page: int = 1,
        department: Optional[str] = None,
        asset_type: Optional[str] = None,
        corridor_id: Optional[str] = None,
        risk_level: Optional[str] = None,
        horizon_days: Optional[int] = None
    ) -> Tuple[List[Dict[str, Any]], int]:
        # Subquery for latest prediction per asset
        subq = (
            select(
                AssetRiskPrediction.asset_id,
                func.max(AssetRiskPrediction.prediction_date).label("max_date")
            )
            .group_by(AssetRiskPrediction.asset_id)
            .subquery()
        )

        query = (
            select(AssetRiskPrediction, Asset)
            .join(Asset, AssetRiskPrediction.asset_id == Asset.id)
            .join(
                subq,
                (AssetRiskPrediction.asset_id == subq.c.asset_id) &
                (AssetRiskPrediction.prediction_date == subq.c.max_date)
            )
            .options(joinedload(Asset.department), joinedload(Asset.corridor))
        )

        if department:
            from app.models.department import Department
            query = query.join(Department, Asset.department_id == Department.id, isouter=True)
            query = query.filter((Department.code == department.upper()) | (Department.id == department))
        if asset_type:
            query = query.filter(Asset.asset_type == asset_type.upper())
        if corridor_id:
            query = query.filter(Asset.corridor_id == corridor_id)
        if risk_level:
            query = query.filter(AssetRiskPrediction.risk_level == risk_level.upper())
        if horizon_days:
            query = query.filter(AssetRiskPrediction.horizon_days == horizon_days)

        # Count total
        count_stmt = select(func.count()).select_from(query.subquery())
        total = db.scalar(count_stmt) or 0

        # Sort descending by risk score
        query = query.order_by(desc(AssetRiskPrediction.risk_score))
        offset = (page - 1) * limit
        results = db.execute(query.offset(offset).limit(limit)).all()

        items = []
        for pred, asset in results:
            factors_list = []
            if pred.features_snapshot and "factors" in pred.features_snapshot:
                factors_list = pred.features_snapshot["factors"]

            items.append({
                "id": pred.id,
                "asset_id": asset.id,
                "asset_code": asset.asset_code,
                "asset_name": asset.name,
                "asset_type": asset.asset_type,
                "department": asset.department.code if asset.department else "ENG",
                "corridor_id": asset.corridor_id,
                "health_score": asset.health_score,
                "criticality_score": asset.criticality_score,
                "risk_score": pred.risk_score,
                "risk_level": pred.risk_level,
                "failure_probability": pred.failure_probability,
                "horizon_days": pred.horizon_days,
                "recommendation": pred.recommendation,
                "explanation": pred.explanation,
                "factors": factors_list,
                "prediction_date": pred.prediction_date.isoformat() if pred.prediction_date else None
            })

        return items, total

    @classmethod
    def get_risk_summary(cls, db: Session) -> Dict[str, Any]:
        # Subquery for latest prediction per asset
        subq = (
            select(
                AssetRiskPrediction.asset_id,
                func.max(AssetRiskPrediction.prediction_date).label("max_date")
            )
            .group_by(AssetRiskPrediction.asset_id)
            .subquery()
        )

        query = (
            select(AssetRiskPrediction, Asset)
            .join(Asset, AssetRiskPrediction.asset_id == Asset.id)
            .join(
                subq,
                (AssetRiskPrediction.asset_id == subq.c.asset_id) &
                (AssetRiskPrediction.prediction_date == subq.c.max_date)
            )
            .options(joinedload(Asset.department))
        )

        records = db.execute(query).all()

        critical = 0
        high = 0
        medium = 0
        low = 0
        score_sum = 0.0

        dept_dist: Dict[str, Dict[str, int]] = {
            "ENGINEERING": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "SIGNAL & TELECOM": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
            "TRACTION": {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0},
        }

        for pred, asset in records:
            lvl = pred.risk_level.upper()
            score_sum += pred.risk_score
            if lvl == "CRITICAL":
                critical += 1
            elif lvl == "HIGH":
                high += 1
            elif lvl == "MEDIUM":
                medium += 1
            else:
                low += 1

            dept_code = (asset.department.code if asset.department else "ENG").upper()
            dept_key = "ENGINEERING" if "ENG" in dept_code else "SIGNAL & TELECOM" if ("SIG" in dept_code or "TEL" in dept_code) else "TRACTION" if ("TRAC" in dept_code or "OHE" in dept_code or "ELEC" in dept_code) else "ENGINEERING"
            if dept_key in dept_dist and lvl in dept_dist[dept_key]:
                dept_dist[dept_key][lvl] += 1

        total_monitored = len(records)
        avg_score = round(score_sum / total_monitored, 1) if total_monitored > 0 else 0.0

        # Total total assets in DB
        total_assets_db = db.scalar(select(func.count(Asset.id))) or 0

        return {
            "critical_risk_count": critical,
            "high_risk_count": high,
            "medium_risk_count": medium,
            "low_risk_count": low,
            "total_predictions_monitored": total_monitored,
            "total_assets_count": total_assets_db,
            "average_risk_score": avg_score,
            "department_distribution": dept_dist,
            "risk_distribution": {
                "CRITICAL": critical,
                "HIGH": high,
                "MEDIUM": medium,
                "LOW": low
            }
        }


risk_engine = AIRiskEngine()
