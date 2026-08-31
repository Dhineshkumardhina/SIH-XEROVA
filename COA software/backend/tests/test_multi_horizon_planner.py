import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database.session import SessionLocal
from app.models.corridor import Corridor
from app.models.maintenance import MaintenanceTask
from app.models.department import Department
from app.models.block import BlockPlan
from app.ai.multi_horizon_planner import multi_horizon_planner

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_daily_planner_generation_and_timeline():
    """TEST 1: Daily 24-hour planner generation, corridor timeline rows, and block persistence"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        assert corr is not None

        target_date = datetime(2026, 11, 15)
        daily_res = multi_horizon_planner.generate_daily_plan(
            db=db,
            planning_date=target_date,
            corridor_ids=[corr.id],
            max_block_duration_minutes=180
        )

        assert "planning_id" in daily_res
        assert daily_res["status"] == "AI_GENERATED"
        assert "timeline" in daily_res
        assert len(daily_res["timeline"]["hours"]) == 25
        assert len(daily_res["timeline"]["corridors"]) >= 1

        # Check KPIs
        summary = daily_res["summary"]
        assert summary["blocks_generated"] >= 1
        assert summary["planning_confidence"] > 50.0

        # Check BlockPlan was persisted
        plan = db.scalar(select(BlockPlan).where(BlockPlan.corridor_id == corr.id))
        assert plan is not None
        assert plan.version >= 1
    finally:
        db.close()


def test_weekly_planner_workload_distribution():
    """TEST 2: Weekly 7-day workload distribution across Monday through Sunday"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        start_date = datetime(2026, 11, 16) # Monday

        weekly_res = multi_horizon_planner.generate_weekly_plan(
            db=db,
            start_date=start_date,
            corridor_ids=[corr.id]
        )

        assert weekly_res["status"] == "AI_GENERATED"
        assert len(weekly_res["days"]) == 7
        assert weekly_res["days"][0]["day_name"] == "Monday"
        assert weekly_res["days"][6]["day_name"] == "Sunday"

        summary = weekly_res["summary"]
        assert summary["total_tasks_scheduled"] > 0
        assert summary["total_blocks_planned"] > 0
        assert summary["optimization_score"] > 80.0
    finally:
        db.close()


def test_monthly_planner_capacity_and_deadlines():
    """TEST 3: Monthly 30-day capacity planning and department workload distribution"""
    db = SessionLocal()
    try:
        monthly_res = multi_horizon_planner.generate_monthly_plan(
            db=db,
            year=2026,
            month=11
        )

        assert monthly_res["status"] == "AI_GENERATED"
        assert len(monthly_res["weeks"]) == 4
        assert len(monthly_res["department_workload"]) == 3

        summary = monthly_res["summary"]
        assert summary["total_tasks_scheduled"] > 0
        assert summary["expected_asset_availability_pct"] > 90.0
    finally:
        db.close()


def test_block_modification_and_versioning():
    """TEST 4: Rescheduling block window, conflict re-evaluation, and version increment"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        plan = BlockPlan(
            plan_code=f"BP-TEST-{uuid.uuid4().hex[:6]}",
            corridor_id=corr.id,
            planning_date=datetime(2026, 11, 20),
            planned_start_at=datetime(2026, 11, 20, 1, 0),
            planned_end_at=datetime(2026, 11, 20, 3, 0),
            duration_minutes=120,
            status="AI_GENERATED",
            version=1
        )
        db.add(plan)
        db.commit()
        db.refresh(plan)

        new_start = datetime(2026, 11, 20, 2, 0)
        new_end = datetime(2026, 11, 20, 4, 0)

        mod_res = multi_horizon_planner.modify_daily_block(
            db=db,
            plan_id=plan.id,
            new_start_time=new_start,
            new_end_time=new_end,
            change_reason="Shifted to clear evening freight buffer"
        )

        assert mod_res["is_valid"] is True
        assert mod_res["version"] == 2
        assert mod_res["status"] == "MODIFIED"

        # Cleanup
        db.delete(plan)
        db.commit()
    finally:
        db.close()


def test_multi_horizon_planner_api_endpoints():
    """TEST 5: Multi-horizon planner REST API endpoints"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        corr_id = corr.id
    finally:
        db.close()

    # POST /api/v1/planner/daily/generate
    daily_res = client.post("/api/v1/planner/daily/generate", json={
        "planning_date": (datetime.utcnow() + timedelta(days=60)).isoformat(),
        "corridor_ids": [corr_id]
    }, headers=headers)
    assert daily_res.status_code == 200
    assert daily_res.json()["success"] is True

    # POST /api/v1/planner/weekly/generate
    weekly_res = client.post("/api/v1/planner/weekly/generate", json={
        "start_date": (datetime.utcnow() + timedelta(days=60)).isoformat(),
        "corridor_ids": [corr_id]
    }, headers=headers)
    assert weekly_res.status_code == 200
    assert weekly_res.json()["success"] is True

    # POST /api/v1/planner/monthly/generate
    monthly_res = client.post("/api/v1/planner/monthly/generate", json={
        "year": 2026,
        "month": 11,
        "corridor_ids": [corr_id]
    }, headers=headers)
    assert monthly_res.status_code == 200
    assert monthly_res.json()["success"] is True
