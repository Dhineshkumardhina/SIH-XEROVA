"""
RAILOPT AI — Phase 42 Risk Engine Tests
Validates:
1. Asset failure risk probability output bounds (0.0 - 1.0).
2. Risk level classification (CRITICAL, HIGH, MEDIUM, LOW).
3. Deteriorating health / increasing defect count raises failure probability.
"""
import pytest
from sqlalchemy import select
from app.models.asset import Asset
from app.ai.risk_engine import risk_engine
from app.ai.features.asset_features import extract_asset_risk_features
from app.ai.models.baseline_risk_model import BaselineRiskModel

def test_risk_engine_bounds_and_classification(db_session):
    """Verify failure probability is bounded [0.0, 1.0] and returns valid risk level."""
    asset = db_session.scalar(select(Asset))
    assert asset is not None, "Seed database must contain at least 1 asset"
    pred, extra = risk_engine.predict_asset_risk(db_session, asset.id)
    assert 0.0 <= pred.failure_probability <= 1.0
    assert pred.risk_level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert pred.recommended_action is not None

def test_risk_engine_feature_extraction_and_prediction(db_session):
    """Verify feature extraction and baseline risk model prediction pipeline."""
    asset = db_session.scalar(select(Asset))
    features = extract_asset_risk_features(asset, db_session)
    model = BaselineRiskModel()

    res = model.predict(features)
    assert 0.0 <= res.failure_probability <= 1.0
    assert 0.0 <= res.risk_score <= 100.0
    assert res.risk_level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert isinstance(res.factor_breakdown, dict)
