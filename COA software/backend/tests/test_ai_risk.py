import pytest
from datetime import datetime, timedelta
from sqlalchemy import select
from app.database.session import SessionLocal
from app.models.asset import Asset
from app.models.defect import Defect, DefectSeverity, DefectStatus
from app.models.maintenance import MaintenanceTask, MaintenanceStatus
from app.models.ai import AssetRiskPrediction
from app.ai.features.asset_features import extract_asset_risk_features
from app.ai.models.factory import RiskModelFactory
from app.ai.risk_engine import risk_engine


def test_risk_model_factory():
    model = RiskModelFactory.get_model("baseline")
    assert model.model_name == "baseline-risk-v1"
    assert model.model_version == "1.0.0"

    with pytest.raises(NotImplementedError):
        ml_model = RiskModelFactory.get_model("xgboost")
        ml_model.predict(None)


def test_baseline_risk_calculation():
    db = SessionLocal()
    try:
        # Create a synthetic high-risk asset for testing
        test_asset = Asset(
            asset_code="TEST-TRK-9901",
            asset_type="TRACK",
            department_id=(db.query(Asset).first().department_id if db.query(Asset).first() else "dummy-dept"),
            name="Critical Main Line Test Section",
            criticality_score=95.0,
            health_score=54.0,
            status="DEGRADED"
        )
        db.add(test_asset)
        db.flush()

        # Add 3 defects: 1 CRITICAL, 2 HIGH
        d1 = Defect(
            defect_code="DEF-TEST-991",
            asset_id=test_asset.id,
            department_id=test_asset.department_id,
            description="Severe rail head fissure",
            severity="CRITICAL",
            status="OPEN"
        )
        d2 = Defect(
            defect_code="DEF-TEST-992",
            asset_id=test_asset.id,
            department_id=test_asset.department_id,
            description="Fastener displacement",
            severity="HIGH",
            status="OPEN"
        )
        db.add_all([d1, d2])

        # Add overdue maintenance
        m1 = MaintenanceTask(
            task_code="MT-TEST-991",
            asset_id=test_asset.id,
            department_id=test_asset.department_id,
            description="Ultrasonic flaw detection",
            due_at=datetime.utcnow() - timedelta(days=12),
            status=MaintenanceStatus.OVERDUE,
            priority="CRITICAL"
        )
        db.add(m1)
        db.commit()

        # 1. Test Feature Extraction
        features = extract_asset_risk_features(test_asset, db, horizon_days=30)
        assert features.health_score == 54.0
        assert features.health_risk == 46.0
        assert features.criticality == 95.0
        assert features.defect_count >= 2
        assert features.defect_risk >= 75.0
        assert features.overdue_days >= 12
        assert features.overdue_risk >= 75.0

        # 2. Test Model Inference
        model = RiskModelFactory.get_model("baseline")
        result = model.predict(features, horizon_days=30)

        assert result.risk_score >= 50.0  # High or Critical
        assert result.risk_level in ["HIGH", "CRITICAL"]
        assert 0.0 <= result.failure_probability <= 1.0
        assert "asset_age" in result.factor_breakdown
        assert "health" in result.factor_breakdown
        assert "defects" in result.factor_breakdown
        assert result.recommendation != ""

        # 3. Test Horizon Scaling (90 days should produce equal or higher risk than 7 days)
        res_7d = model.predict(features, horizon_days=7)
        res_90d = model.predict(features, horizon_days=90)
        assert res_90d.risk_score >= res_7d.risk_score

        # 4. Test Risk Engine Execution & Persistence
        pred, payload = risk_engine.predict_asset_risk(db, test_asset.id, horizon_days=30)
        assert pred.id is not None
        assert pred.risk_score == result.risk_score
        assert payload["asset_code"] == "TEST-TRK-9901"

        # 5. Test History Retrieval
        history = risk_engine.get_risk_history(db, test_asset.id)
        assert len(history) >= 1
        assert history[0].risk_score == pred.risk_score

        # Cleanup
        db.delete(pred)
        db.delete(m1)
        db.delete(d1)
        db.delete(d2)
        db.delete(test_asset)
        db.commit()
    finally:
        db.close()


def test_risk_summary_aggregation():
    db = SessionLocal()
    try:
        summary = risk_engine.get_risk_summary(db)
        assert "critical_risk_count" in summary
        assert "high_risk_count" in summary
        assert "medium_risk_count" in summary
        assert "low_risk_count" in summary
        assert "average_risk_score" in summary
        assert "department_distribution" in summary
    finally:
        db.close()
