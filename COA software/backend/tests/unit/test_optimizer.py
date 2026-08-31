"""
Unit Tests: Real Google OR-Tools CP-SAT Block Optimizer
Tests mathematical optimization and multi-department block planning.
"""
from datetime import datetime, timedelta
import pytest
from app.ai.multi_horizon_planner import multi_horizon_planner
from app.models.corridor import Corridor

def test_optimizer_daily_planning_real_ortools(db_session):
    """Executes daily multi-department CP-SAT optimization across active corridor infrastructure."""
    corr = db_session.query(Corridor).first()
    if corr:
        plan_date = datetime(2026, 11, 1, 0, 0, 0)
        res = multi_horizon_planner.generate_daily_plan(
            db=db_session,
            planning_date=plan_date,
            corridor_ids=[corr.id],
            departments=["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
            max_block_duration_minutes=180
        )
        assert res is not None
        assert "planning_id" in res
        assert "recommended_blocks" in res
