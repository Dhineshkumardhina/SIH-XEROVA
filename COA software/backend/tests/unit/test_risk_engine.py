"""
Unit Tests: Asset Failure Risk Prediction Engine
Validates failure probability estimation, risk scoring, and categorization.
"""
import pytest
from app.ai.models.factory import RiskModelFactory
from app.ai.risk_engine import risk_engine
from app.database.session import SessionLocal
from app.models.asset import Asset

def test_risk_model_factory():
    """Verify factory model retrieval."""
    model = RiskModelFactory.get_model("baseline")
    assert model.model_name == "baseline-risk-v1"
    assert model.model_version == "1.0.0"

def test_risk_engine_calculation(db_session):
    """Verify predictive risk computation on active assets."""
    asset = db_session.query(Asset).first()
    if asset:
        prediction, factors = risk_engine.predict_asset_risk(db=db_session, asset_id_or_code=asset.id, horizon_days=30)
        assert 0 <= prediction.risk_score <= 100
        assert prediction.risk_level in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
        assert 0.0 <= prediction.failure_probability <= 1.0
        assert isinstance(factors, dict)
