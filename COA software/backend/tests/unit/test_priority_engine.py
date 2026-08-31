"""
Unit Tests: AI Maintenance Priority Engine
Validates rule-based scoring, boundary constraints, and factor contributions.
"""
import pytest
from app.ai.priority.factory import PriorityModelFactory

def test_priority_engine_deterministic_score():
    """Verify deterministic output for identical input parameters."""
    model = PriorityModelFactory.get_model("rule_based")
    context = {
        "asset_criticality": 95.0,
        "defect_severity": "CRITICAL",
        "urgency_score": 85.0,
        "overdue_days": 15,
        "safety_impact": "CRITICAL",
        "train_impact": "MEDIUM",
        "failure_probability": 0.8
    }
    weights = {
        "asset_criticality": 0.25,
        "defect_severity": 0.20,
        "urgency": 0.15,
        "overdue_days": 0.15,
        "safety_impact": 0.10,
        "train_impact": 0.05,
        "failure_probability": 0.10,
    }

    score1, level1, breakdown1, rec1, exp1 = model.calculate(context, weights)
    score2, level2, breakdown2, rec2, exp2 = model.calculate(context, weights)

    assert 0 <= score1 <= 100
    assert score1 == score2
    assert level1 == "CRITICAL"
    assert breakdown1["asset_criticality"]["contribution"] == 23.75
    assert breakdown1["defect_severity"]["contribution"] == 20.0
    assert breakdown1["failure_probability"]["contribution"] == 8.0

def test_priority_missing_factors_redistribution():
    """Weight redistribution when some factors are missing."""
    model = PriorityModelFactory.get_model("rule_based")
    context = {"asset_criticality": 100.0}
    weights = {"asset_criticality": 0.50, "defect_severity": 0.50}

    score, level, breakdown, rec, exp = model.calculate(context, weights)
    assert score == 100.0
    assert breakdown["asset_criticality"]["weight"] == 1.0

def test_priority_safety_override():
    """Critical safety impact overrides lower baseline calculations."""
    model = PriorityModelFactory.get_model("rule_based")
    context = {"asset_criticality": 10.0, "safety_impact": "CRITICAL"}
    weights = {"asset_criticality": 0.90, "safety_impact": 0.10}

    score, level, breakdown, rec, exp = model.calculate(context, weights)
    assert level == "CRITICAL"
    assert score >= 75.0
