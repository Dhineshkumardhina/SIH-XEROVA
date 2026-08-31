import pytest
from app.ai.priority.factory import PriorityModelFactory
from app.models.maintenance import MaintenanceTask
from app.models.ai_priority import AIPriorityPrediction
from app.services.ai_priority_service import ai_priority_service
from datetime import datetime, timedelta

def test_rule_based_calculation():
    model = PriorityModelFactory.get_model("rule_based")
    
    context = {
        "asset_criticality": 95.0,
        "defect_severity": "CRITICAL",  # 100
        "urgency_score": 85.0,
        "overdue_days": 15,            # 100
        "safety_impact": "CRITICAL",   # 100
        "train_impact": "MEDIUM",      # 50
        "failure_probability": 0.8     # 80
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
    
    # 0.25*95 = 23.75
    # 0.20*100 = 20.0
    # 0.15*85 = 12.75
    # 0.15*100 = 15.0
    # 0.10*100 = 10.0
    # 0.05*50 = 2.5
    # 0.10*80 = 8.0
    # Total = 23.75 + 20.0 + 12.75 + 15.0 + 10.0 + 2.5 + 8.0 = 92.0
    
    score, level, breakdown, rec, exp = model.calculate(context, weights)
    
    assert level == "CRITICAL"
    assert "CRITICAL" in exp
    assert breakdown["asset_criticality"]["contribution"] == 23.75
    assert breakdown["defect_severity"]["contribution"] == 20.0
    assert breakdown["failure_probability"]["contribution"] == 8.0

def test_missing_factors_redistribution():
    model = PriorityModelFactory.get_model("rule_based")
    
    context = {
        "asset_criticality": 100.0,
    }
    
    weights = {
        "asset_criticality": 0.50,
        "defect_severity": 0.50,
    }
    
    score, level, breakdown, rec, exp = model.calculate(context, weights)
    
    # Asset criticality weight was 0.5, defect was 0.5.
    # Defect missing -> missing weight 0.5
    # Active sum = 0.5. redistributed to asset = 0.5. New asset weight = 1.0.
    # Score should be 100.0 * 1.0 = 100.0
    
    assert score == 100.0
    assert breakdown["asset_criticality"]["weight"] == 1.0

def test_safety_impact_override():
    model = PriorityModelFactory.get_model("rule_based")
    
    # Intentionally low scores to force level < 75 natively
    context = {
        "asset_criticality": 10.0,
        "safety_impact": "CRITICAL" # This should force CRITICAL level
    }
    
    weights = {
        "asset_criticality": 0.90,
        "safety_impact": 0.10
    }
    
    # Score natively = 10*0.9 (9) + 100*0.1 (10) = 19
    score, level, breakdown, rec, exp = model.calculate(context, weights)
    
    assert level == "CRITICAL"
    assert score == 75.0 # overridden max(19, 75.0)

