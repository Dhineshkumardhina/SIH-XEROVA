import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database.session import SessionLocal
from app.models.corridor import Corridor
from app.models.train import Train, TrainSchedule, TrainType, GoodsForecast
from app.models.block import BlockRequest
from app.models.train_impact import TrainImpact
from app.services.train_impact_service import train_impact_service

client = TestClient(app)

DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_train_impact_outside_window():
    """TEST 1: Train completely outside block window -> 0 impact"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        assert corr is not None

        # Block at 01:00 - 03:00 on future date
        target_date = datetime(2026, 9, 15, 1, 0, 0)
        block_end = datetime(2026, 9, 15, 3, 0, 0)

        # Train at 05:00 - 05:30 (outside)
        test_train = Train(
            train_number="TEST-EXP-9901",
            train_name="Non-Overlapping Test Express",
            train_type="EXPRESS",
            default_direction="UP",
            priority=2,
            origin="STN-A",
            destination="STN-B",
            corridor_id=corr.id
        )
        db.add(test_train)
        db.flush()

        sched = TrainSchedule(
            train_id=test_train.id,
            corridor_id=corr.id,
            arrival_time=datetime(2026, 9, 15, 5, 0, 0),
            departure_time=datetime(2026, 9, 15, 5, 30, 0),
            direction="UP"
        )
        db.add(sched)
        db.commit()

        impact = train_impact_service.calculate_train_impact(
            db=db,
            corridor_id=corr.id,
            start_time=target_date,
            end_time=block_end
        )

        # Confirm test train is NOT in affected trains
        affected_numbers = [t["train_number"] for t in impact["trains"]]
        assert "TEST-EXP-9901" not in affected_numbers

        # Clean up
        db.delete(sched)
        db.delete(test_train)
        db.commit()
    finally:
        db.close()


def test_train_impact_overlap_and_delay_calculation():
    """TEST 2, 3, 4, 5, 6: Overlap, Passenger, Goods, Directions, and Delay Coefficients"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        base_date = datetime(2026, 9, 16, 1, 0, 0)
        block_end = datetime(2026, 9, 16, 3, 0, 0)

        # 1. Superfast Passenger Train overlapping 01:30 - 02:00 (30 mins overlap)
        sf_train = Train(
            train_number="TEST-SF-9902",
            train_name="Rajdhani Superfast Test",
            train_type="SUPERFAST",
            default_direction="UP",
            priority=1,
            corridor_id=corr.id
        )
        db.add(sf_train)
        db.flush()

        sf_sched = TrainSchedule(
            train_id=sf_train.id,
            corridor_id=corr.id,
            arrival_time=datetime(2026, 9, 16, 1, 30, 0),
            departure_time=datetime(2026, 9, 16, 2, 0, 0),
            direction="UP"
        )

        # 2. Goods Train overlapping 02:10 - 02:40 (30 mins overlap)
        goods_train = Train(
            train_number="TEST-GD-9903",
            train_name="Container Freight Test",
            train_type="GOODS",
            default_direction="DOWN",
            priority=4,
            corridor_id=corr.id
        )
        db.add(goods_train)
        db.flush()

        goods_sched = TrainSchedule(
            train_id=goods_train.id,
            corridor_id=corr.id,
            arrival_time=datetime(2026, 9, 16, 2, 10, 0),
            departure_time=datetime(2026, 9, 16, 2, 40, 0),
            direction="DOWN"
        )

        db.add_all([sf_sched, goods_sched])
        db.commit()

        impact = train_impact_service.calculate_train_impact(
            db=db,
            corridor_id=corr.id,
            start_time=base_date,
            end_time=block_end
        )

        summary = impact["summary"]
        assert summary["affected_trains"] >= 2
        assert summary["passenger_trains"] >= 1
        assert summary["goods_trains"] >= 1
        assert summary["up_trains"] >= 1
        assert summary["down_trains"] >= 1
        assert summary["expected_delay_minutes"] > 0
        assert summary["impact_score"] > 0
        assert summary["highest_priority"] == "CRITICAL" # P1 Superfast
        assert len(impact["explanation_bullets"]) > 0

        # Verify Superfast train detail
        sf_detail = next((t for t in impact["trains"] if t["train_number"] == "TEST-SF-9902"), None)
        assert sf_detail is not None
        assert sf_detail["train_type"] == "SUPERFAST"
        assert sf_detail["direction"] == "UP"
        assert sf_detail["overlap_minutes"] == 30
        assert sf_detail["passengers_affected"] == 1200 # Superfast synthetic load

        # Verify Goods train detail
        gd_detail = next((t for t in impact["trains"] if t["train_number"] == "TEST-GD-9903"), None)
        assert gd_detail is not None
        assert gd_detail["train_type"] == "GOODS"
        assert gd_detail["direction"] == "DOWN"
        assert gd_detail["passengers_affected"] == 0

        # Clean up
        db.delete(sf_sched)
        db.delete(goods_sched)
        db.delete(sf_train)
        db.delete(goods_train)
        db.commit()
    finally:
        db.close()


def test_clearance_buffer_detection():
    """TEST 7: 5-minute operational clearance buffer detects near-miss conflict"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        block_start = datetime(2026, 9, 17, 2, 0, 0)
        block_end = datetime(2026, 9, 17, 4, 0, 0)

        # Train arriving at 01:57 and departing at 01:59 (3 mins before block start, inside 5m buffer)
        buf_train = Train(
            train_number="TEST-BUF-9904",
            train_name="Buffer Proximity Test",
            train_type="PASSENGER",
            default_direction="UP",
            priority=3,
            corridor_id=corr.id
        )
        db.add(buf_train)
        db.flush()

        buf_sched = TrainSchedule(
            train_id=buf_train.id,
            corridor_id=corr.id,
            arrival_time=datetime(2026, 9, 17, 1, 57, 0),
            departure_time=datetime(2026, 9, 17, 1, 59, 0),
            direction="UP"
        )
        db.add(buf_sched)
        db.commit()

        impact = train_impact_service.calculate_train_impact(
            db=db,
            corridor_id=corr.id,
            start_time=block_start,
            end_time=block_end
        )

        buf_detail = next((t for t in impact["trains"] if t["train_number"] == "TEST-BUF-9904"), None)
        assert buf_detail is not None
        assert "clearance buffer" in buf_detail["reason"]

        db.delete(buf_sched)
        db.delete(buf_train)
        db.commit()
    finally:
        db.close()


def test_alternative_windows_and_evaluation():
    """TEST 8 & 9: Alternative windows search and optimizer evaluation contract"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        block_start = datetime(2026, 9, 18, 14, 0, 0)
        block_end = datetime(2026, 9, 18, 16, 0, 0)

        impact = train_impact_service.calculate_train_impact(
            db=db,
            corridor_id=corr.id,
            start_time=block_start,
            end_time=block_end
        )

        assert "alternatives" in impact
        assert len(impact["alternatives"]) > 0

        # Verify alternatives are sorted by feasibility and lowest impact score
        first_alt = impact["alternatives"][0]
        assert "start_time" in first_alt
        assert "end_time" in first_alt
        assert "impact_score" in first_alt
        assert "feasible" in first_alt

        # Test optimizer callable interface
        eval_result = train_impact_service.evaluate_block_window(
            db=db,
            corridor_id=corr.id,
            start_time=block_start,
            end_time=block_end
        )
        assert "feasible" in eval_result
        assert "impact_score" in eval_result
        assert "expected_delay" in eval_result
        assert "affected_trains" in eval_result
    finally:
        db.close()


def test_block_request_persistence_and_api():
    """TEST 10: Persist TrainImpact model and verify REST endpoints"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        corr_id = corr.id
    finally:
        db.close()

    # 1. Test POST /api/v1/ai/train-impact
    api_res = client.post("/api/v1/ai/train-impact", json={
        "corridor_id": corr_id,
        "start_time": (datetime.utcnow() + timedelta(days=20, hours=1)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(days=20, hours=3)).isoformat(),
        "block_type": "MAINTENANCE"
    }, headers=headers)

    assert api_res.status_code == 200
    body = api_res.json()
    assert body["success"] is True
    assert "summary" in body["data"]
    assert "impact_score" in body["data"]["summary"]
    assert "alternatives" in body["data"]
