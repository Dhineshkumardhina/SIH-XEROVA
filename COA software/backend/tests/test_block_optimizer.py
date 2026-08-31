import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database.session import SessionLocal
from app.models.corridor import Corridor
from app.models.train import Train, TrainSchedule
from app.models.maintenance import MaintenanceTask
from app.models.department import Department
from app.optimization.block_optimizer import block_optimizer
from app.optimization.models import OptimizationConfig

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_multi_department_shared_block_optimization():
    """TEST 1 & 2: Multi-department bundling and baseline vs optimized savings"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        asset = corr.assets[0] if corr.assets else None
        assert asset is not None

        depts = db.query(Department).all()
        dept_eng = next((d for d in depts if "ENG" in d.code), depts[0])
        dept_sig = next((d for d in depts if "SIG" in d.code), depts[1])
        dept_trc = next((d for d in depts if "TRAC" in d.code), depts[2])

        suffix = uuid.uuid4().hex[:6]
        t_eng = MaintenanceTask(
            task_code=f"OPT-ENG-{suffix}",
            asset_id=asset.id,
            department_id=dept_eng.id,
            description="Track alignment inspection",
            duration_minutes=120,
            priority="HIGH",
            status="PLANNED"
        )
        t_sig = MaintenanceTask(
            task_code=f"OPT-SIG-{suffix}",
            asset_id=asset.id,
            department_id=dept_sig.id,
            description="Signal aspect testing",
            duration_minutes=60,
            priority="MEDIUM",
            status="PLANNED"
        )
        t_trc = MaintenanceTask(
            task_code=f"OPT-TRC-{suffix}",
            asset_id=asset.id,
            department_id=dept_trc.id,
            description="OHE mast clearance check",
            duration_minutes=90,
            priority="HIGH",
            status="PLANNED"
        )
        db.add_all([t_eng, t_sig, t_trc])
        db.commit()

        target_date = datetime(2026, 11, 1)

        outcome = block_optimizer.run_optimization(
            db=db,
            corridor_id=corr.id,
            planning_date=target_date,
            task_ids=[t_eng.id, t_sig.id, t_trc.id],
            config=OptimizationConfig(min_block_duration_minutes=60, max_block_duration_minutes=180)
        )

        assert outcome.status in ["OPTIMAL", "FEASIBLE"]
        assert len(outcome.blocks) >= 1
        
        shared_block = outcome.blocks[0]
        assert shared_block.is_shared_block is True
        assert len(shared_block.departments) >= 2
        assert shared_block.task_count >= 2

        # Check baseline vs optimized savings
        assert outcome.baseline_plan["total_baseline_minutes"] == 270
        assert outcome.plan_comparison["savings"]["time_saved_minutes"] > 0
        assert outcome.metrics["block_utilization"] > 50.0

        # Cleanup
        db.delete(t_eng)
        db.delete(t_sig)
        db.delete(t_trc)
        db.commit()
    finally:
        db.close()


def test_protected_train_constraint_avoidance():
    """TEST 3: Optimizer avoids windows blocked by protected high-priority trains"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        target_date = datetime(2026, 11, 2)
        suffix = uuid.uuid4().hex[:6]

        # Place protected train in 01:00 - 02:30 window
        prot_train = Train(
            train_number=f"EXP-{suffix}",
            train_name="Rajdhani Superfast Protected",
            train_type="SUPERFAST",
            priority=1,
            corridor_id=corr.id
        )
        db.add(prot_train)
        db.flush()

        sched = TrainSchedule(
            train_id=prot_train.id,
            corridor_id=corr.id,
            arrival_time=datetime(2026, 11, 2, 1, 0, 0),
            departure_time=datetime(2026, 11, 2, 2, 30, 0),
            direction="UP"
        )
        db.add(sched)
        db.commit()

        outcome = block_optimizer.run_optimization(
            db=db,
            corridor_id=corr.id,
            planning_date=target_date,
            config=OptimizationConfig(min_block_duration_minutes=60, max_block_duration_minutes=180)
        )

        if outcome.blocks:
            for b in outcome.blocks:
                is_overlap = (b.start_time < sched.departure_time) and (b.end_time > sched.arrival_time)
                assert not is_overlap, "Scheduled block must not overlap protected train"

        # Cleanup
        db.delete(sched)
        db.delete(prot_train)
        db.commit()
    finally:
        db.close()


def test_priority_and_overdue_weighting():
    """TEST 4 & 5: Critical & Overdue tasks receive stronger scheduling incentives"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        asset = corr.assets[0] if corr.assets else None
        assert asset is not None

        suffix = uuid.uuid4().hex[:6]
        overdue_crit_task = MaintenanceTask(
            task_code=f"CRIT-{suffix}",
            asset_id=asset.id,
            department_id=asset.department_id,
            description="Emergency track ultrasonic testing",
            duration_minutes=90,
            priority="CRITICAL",
            due_at=datetime(2026, 1, 1), # overdue
            status="PLANNED"
        )
        db.add(overdue_crit_task)
        db.commit()

        outcome = block_optimizer.run_optimization(
            db=db,
            corridor_id=corr.id,
            planning_date=datetime(2026, 11, 3),
            task_ids=[overdue_crit_task.id],
            config=OptimizationConfig(min_block_duration_minutes=60, max_block_duration_minutes=180)
        )

        assert outcome.status in ["OPTIMAL", "FEASIBLE"]
        assert outcome.metrics["critical_tasks_scheduled"] >= 1
        assert outcome.metrics["overdue_tasks_scheduled"] >= 1

        # Cleanup
        db.delete(overdue_crit_task)
        db.commit()
    finally:
        db.close()


def test_optimization_api_endpoints():
    """TEST 6: REST endpoints POST /api/v1/optimization/run and GET /api/v1/optimization/runs"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        corr_id = corr.id
    finally:
        db.close()

    # POST /api/v1/optimization/run
    res = client.post("/api/v1/optimization/run", json={
        "planning_date": (datetime.utcnow() + timedelta(days=40)).isoformat(),
        "corridor_id": corr_id,
        "planning_horizon": "DAILY",
        "minimum_block_duration_minutes": 60,
        "maximum_block_duration_minutes": 180
    }, headers=headers)

    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "optimization_run_id" in body["data"]
    assert "metrics" in body["data"]
    assert "plan_comparison" in body["data"]
    assert "alternatives" in body["data"]

    # GET /api/v1/optimization/runs
    list_res = client.get("/api/v1/optimization/runs", headers=headers)
    assert list_res.status_code == 200
    list_body = list_res.json()
    assert list_body["success"] is True
    assert isinstance(list_body["data"], list)
