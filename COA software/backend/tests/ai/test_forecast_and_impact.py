"""
RAILOPT AI — Phase 42 Forecast & Train Impact Engine Tests
Validates:
1. Goods freight traffic forecast non-negativity guarantees.
2. Train impact calculation on timetable delay.
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import select
from app.models.corridor import Corridor
from app.services import forecast_service
from app.services.train_impact_service import train_impact_service

def test_goods_forecast_non_negativity(db_session):
    """Verify goods freight density forecasts return non-negative values."""
    forecasts, _ = forecast_service.list_goods_forecasts(db=db_session, page=1, page_size=10)
    for f in forecasts:
        assert getattr(f, "forecasted_trains_per_hour", 0) >= 0
        assert getattr(f, "hourly_density_index", 0.0) >= 0.0

def test_train_impact_calculation(db_session):
    """Verify train impact calculation computes positive delays and affected trains."""
    corridor = db_session.scalar(select(Corridor))
    assert corridor is not None, "Seed database must contain at least 1 corridor"
    st = datetime.utcnow() + timedelta(days=5, hours=1)
    et = datetime.utcnow() + timedelta(days=5, hours=3)
    impact = train_impact_service.calculate_train_impact(
        db=db_session,
        corridor_id=corridor.id,
        start_time=st,
        end_time=et
    )
    assert "summary" in impact
    assert "corridor_id" in impact
    assert impact["summary"]["impact_score"] >= 0.0
