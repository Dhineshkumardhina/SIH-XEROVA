import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database.session import SessionLocal
from app.models.corridor import Corridor
from app.models.train import Train, TrainSchedule
from app.models.block import BlockRequest, BlockRequestStatus
from app.models.maintenance import MaintenanceTask
from app.services.block_conflict_service import block_conflict_service

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_clear_window_is_feasible():
    """TEST 1: No trains, no existing blocks, valid duration -> FEASIBLE (0 conflicts)"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        start = datetime(2026, 10, 1, 1, 0, 0)
        end = datetime(2026, 10, 1, 3, 0, 0)

        eval_res = block_conflict_service.evaluate_block(
            db=db,
            corridor_id=corr.id,
            start_time=start,
            end_time=end
        )

        assert eval_res["feasible"] is True
        assert eval_res["conflict_count"] == 0
        assert eval_res["severity"] == "INFO"
    finally:
        db.close()


def test_protected_train_conflict():
    """TEST 2: Protected high-priority train overlap -> CRITICAL TRAIN_CONFLICT"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        start = datetime(2026, 10, 2, 2, 0, 0)
        end = datetime(2026, 10, 2, 4, 0, 0)

        p1_train = Train(
            train_number="TEST-SF-9911",
            train_name="Vande Bharat Protected Express",
            train_type="SUPERFAST",
            priority=1,
            corridor_id=corr.id
        )
        db.add(p1_train)
        db.flush()

        sched = TrainSchedule(
            train_id=p1_train.id,
            corridor_id=corr.id,
            arrival_time=datetime(2026, 10, 2, 2, 30, 0),
            departure_time=datetime(2026, 10, 2, 3, 0, 0),
            direction="UP"
        )
        db.add(sched)
        db.commit()

        eval_res = block_conflict_service.evaluate_block(
            db=db,
            corridor_id=corr.id,
            start_time=start,
            end_time=end
        )

        assert eval_res["feasible"] is False
        assert eval_res["severity"] == "CRITICAL"
        assert eval_res["critical_conflicts_count"] >= 1
        
        train_confs = [c for c in eval_res["conflicts"] if c["conflict_type"] == "TRAIN_CONFLICT"]
        assert len(train_confs) >= 1
        assert train_confs[0]["severity"] == "CRITICAL"
        assert len(eval_res["resolution_suggestions"]) > 0

        # Cleanup
        db.delete(sched)
        db.delete(p1_train)
        db.commit()
    finally:
        db.close()


def test_existing_block_overlap():
    """TEST 3: Existing approved block overlap -> CRITICAL BLOCK_OVERLAP"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        dept_id = corr.block_requests[0].department_id if corr.block_requests else "dummy-dept"
        
        # Existing approved block
        existing_block = BlockRequest(
            request_code="TEST-BR-9912",
            department_id=dept_id,
            corridor_id=corr.id,
            preferred_start_at=datetime(2026, 10, 3, 1, 0, 0),
            preferred_end_at=datetime(2026, 10, 3, 3, 0, 0),
            duration_minutes=120,
            status=BlockRequestStatus.APPROVED,
            reason="Track renewal",
            priority="HIGH",
            requested_by="Officer"
        )
        db.add(existing_block)
        db.commit()

        # Proposed overlapping block (02:00 - 04:00)
        eval_res = block_conflict_service.evaluate_block(
            db=db,
            corridor_id=corr.id,
            start_time=datetime(2026, 10, 3, 2, 0, 0),
            end_time=datetime(2026, 10, 3, 4, 0, 0)
        )

        assert eval_res["feasible"] is False
        block_confs = [c for c in eval_res["conflicts"] if c["conflict_type"] == "BLOCK_OVERLAP"]
        assert len(block_confs) >= 1
        assert block_confs[0]["severity"] == "CRITICAL"

        # Cleanup
        db.delete(existing_block)
        db.commit()
    finally:
        db.close()


def test_maintenance_duration_conflict():
    """TEST 4: Block duration less than task duration -> CRITICAL MAINTENANCE_CONFLICT"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        asset = corr.assets[0] if corr.assets else None
        assert asset is not None

        # 180-minute task
        long_task = MaintenanceTask(
            task_code="TEST-MT-9913",
            asset_id=asset.id,
            department_id=asset.department_id,
            description="Deep rail ballast cleaning",
            duration_minutes=180,
            status="PLANNED"
        )
        db.add(long_task)
        db.commit()

        # Proposing only a 60-minute block
        eval_res = block_conflict_service.evaluate_block(
            db=db,
            corridor_id=corr.id,
            start_time=datetime(2026, 10, 4, 1, 0, 0),
            end_time=datetime(2026, 10, 4, 2, 0, 0),
            task_ids=[long_task.id]
        )

        assert eval_res["feasible"] is False
        maint_confs = [c for c in eval_res["conflicts"] if c["conflict_type"] == "MAINTENANCE_CONFLICT"]
        assert len(maint_confs) >= 1
        assert maint_confs[0]["severity"] == "CRITICAL"

        # Cleanup
        db.delete(long_task)
        db.commit()
    finally:
        db.close()


def test_safety_duration_limits():
    """TEST 5: Block shorter than 30 mins violates safety constraints"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        # 15-minute block
        eval_res = block_conflict_service.evaluate_block(
            db=db,
            corridor_id=corr.id,
            start_time=datetime(2026, 10, 5, 1, 0, 0),
            end_time=datetime(2026, 10, 5, 1, 15, 0)
        )

        assert eval_res["feasible"] is False
        safety_confs = [c for c in eval_res["conflicts"] if c["conflict_type"] == "SAFETY_CONFLICT"]
        assert len(safety_confs) >= 1
        assert safety_confs[0]["severity"] == "CRITICAL"
    finally:
        db.close()


def test_feasible_windows_search_and_optimizer_contract():
    """TEST 6 & 7: Feasible window search and Phase 17 Optimizer evaluation contract"""
    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        target_date = datetime(2026, 10, 6)

        # 1. Feasible windows search
        windows = block_conflict_service.find_feasible_windows(
            db=db,
            corridor_id=corr.id,
            target_date=target_date,
            duration_minutes=120,
            preferred_start_hour=0,
            preferred_end_hour=12
        )
        assert isinstance(windows, list)

        # 2. Phase 17 Optimizer contract
        opt_res = block_conflict_service.evaluate_candidate_block(
            db=db,
            corridor_id=corr.id,
            start_time=datetime(2026, 10, 6, 1, 0, 0),
            end_time=datetime(2026, 10, 6, 3, 0, 0)
        )
        assert "feasible" in opt_res
        assert "conflict_score" in opt_res
        assert "train_impact_score" in opt_res
        assert "maintenance_coverage" in opt_res
        assert "shared_block_bonus" in opt_res
    finally:
        db.close()


def test_conflict_api_endpoints():
    """TEST 8: REST endpoints POST /api/v1/blocks/evaluate and POST /api/v1/blocks/feasible-windows"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        corr_id = corr.id
    finally:
        db.close()

    # 1. POST /api/v1/blocks/evaluate
    eval_res = client.post("/api/v1/blocks/evaluate", json={
        "corridor_id": corr_id,
        "start_time": (datetime.utcnow() + timedelta(days=30, hours=1)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(days=30, hours=3)).isoformat()
    }, headers=headers)

    assert eval_res.status_code == 200
    body = eval_res.json()
    assert body["success"] is True
    assert "feasible" in body["data"]
    assert "conflicts" in body["data"]

    # 2. POST /api/v1/blocks/feasible-windows
    win_res = client.post("/api/v1/blocks/feasible-windows", json={
        "corridor_id": corr_id,
        "date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
        "duration_minutes": 120
    }, headers=headers)

    assert win_res.status_code == 200
    win_body = win_res.json()
    assert win_body["success"] is True
    assert isinstance(win_body["data"], list)
