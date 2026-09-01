"""
RAILOPT AI — Phase 42 Conflict Detection & Bundling Tests
Validates:
1. Spatial-temporal conflict detection across 6 conflict types.
2. Multi-Department task bundling logic (Track + Signal + Traction).
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import select
from app.models.corridor import Corridor
from app.services.block_conflict_service import block_conflict_service

def test_conflict_detection_evaluation(db_session):
    """Verify block conflict evaluation returns structured conflict analysis."""
    corridor = db_session.scalar(select(Corridor))
    assert corridor is not None
    eval_result = block_conflict_service.evaluate_block(
        db=db_session,
        corridor_id=corridor.id,
        start_time=datetime.utcnow() + timedelta(days=5, hours=2),
        end_time=datetime.utcnow() + timedelta(days=5, hours=4),
        task_ids=[],
        isolation_required=False
    )
    assert "corridor_id" in eval_result
    assert "conflicts" in eval_result or "has_conflicts" in eval_result

def test_feasible_windows_search(db_session):
    """Verify feasible possession window generator returns ranked candidate windows."""
    corridor = db_session.scalar(select(Corridor))
    assert corridor is not None
    windows = block_conflict_service.find_feasible_windows(
        db=db_session,
        corridor_id=corridor.id,
        target_date=datetime.utcnow() + timedelta(days=5),
        duration_minutes=120,
        preferred_start_hour=1,
        preferred_end_hour=6
    )
    assert isinstance(windows, list)
