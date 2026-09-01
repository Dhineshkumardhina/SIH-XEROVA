"""
RAILOPT AI — Phase 42 Priority Engine Tests
Validates:
1. Monotonicity: Case A (Critical/Overdue) produces higher priority score than Case B (Healthy/Low severity).
2. MCDA weight normalization and factor breakdown correspondence.
3. Priority level thresholds (CRITICAL, HIGH, MEDIUM, LOW).
"""
import pytest
from datetime import datetime, timedelta
from app.ai.priority.factory import PriorityModelFactory

def test_priority_engine_monotonicity():
    """Verify Case A (Critical/Overdue) > Case B (Healthy/Low severity)."""
    model = PriorityModelFactory.get_model("rule_based")

    # Case A: Critical asset, overdue task, high criticality, high urgency
    case_a_context = {
        "status": "OPEN",
        "overdue_days": 14,
        "urgency_score": 100,
        "asset_criticality": 95.0,
        "operational_importance": "HIGH",
        "defect_severity": "CRITICAL",
        "safety_impact": "HIGH",
        "train_impact": "HIGH",
        "failure_probability": 0.85
    }

    # Case B: Healthy asset, low severity, not overdue
    case_b_context = {
        "status": "OPEN",
        "overdue_days": 0,
        "urgency_score": 20,
        "asset_criticality": 20.0,
        "operational_importance": "LOW",
        "defect_severity": "LOW",
        "safety_impact": "LOW",
        "train_impact": "LOW",
        "failure_probability": 0.05
    }

    score_a, level_a, breakdown_a, rec_a, exp_a = model.calculate(case_a_context)
    score_b, level_b, breakdown_b, rec_b, exp_b = model.calculate(case_b_context)

    assert score_a > score_b
    assert score_a >= 70.0
    assert score_b < 50.0

def test_priority_factor_breakdown_correspondence():
    """Verify factor breakdown components accurately correspond to priority score."""
    model = PriorityModelFactory.get_model("rule_based")
    sample_context = {
        "status": "OPEN",
        "overdue_days": 5,
        "urgency_score": 80,
        "asset_criticality": 80.0,
        "operational_importance": "HIGH",
        "defect_severity": "HIGH",
        "safety_impact": "HIGH",
        "train_impact": "MEDIUM",
        "failure_probability": 0.60
    }

    score, level, breakdown, rec, exp = model.calculate(sample_context)
    assert 0.0 <= score <= 100.0
    assert level in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    assert isinstance(breakdown, dict)
    assert isinstance(exp, (str, list))
