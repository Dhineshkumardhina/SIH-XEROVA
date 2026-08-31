"""
Unit Tests: Block Conflict & Safety Collision Engine
Validates conflict evaluation and non-overlap detection.
"""
from datetime import datetime, timedelta
import pytest
from app.services.block_conflict_service import block_conflict_service
from app.models.corridor import Corridor

def test_conflict_engine_clear_window(db_session):
    """Empty operating window has 0 conflicts and is feasible."""
    corr = db_session.query(Corridor).first()
    if corr:
        start = datetime(2026, 11, 1, 1, 0, 0)
        end = datetime(2026, 11, 1, 3, 0, 0)
        eval_res = block_conflict_service.evaluate_block(
            db=db_session,
            corridor_id=corr.id,
            start_time=start,
            end_time=end
        )
        assert eval_res["feasible"] is True
        assert eval_res["conflict_count"] == 0
        assert eval_res["severity"] == "INFO"
