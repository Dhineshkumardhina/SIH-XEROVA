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
from app.models.audit import AuditLog
from app.ai.block_planner import ai_block_planner
from app.core.exceptions import ValidationError

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_objective_weights_validation():
    """TEST 1: Optimization objective weights must sum to 100%"""
    valid_weights = {"asset_availability": 40.0, "maintenance_priority": 25.0, "train_impact": 20.0, "block_utilization": 15.0}
    ai_block_planner.validate_objective_weights(valid_weights)

    invalid_weights = {"asset_availability": 50.0, "maintenance_priority": 25.0, "train_impact": 20.0, "block_utilization": 15.0}
    with pytest.raises(ValidationError):
        ai_block_planner.validate_objective_weights(invalid_weights)


def test_end_to_end_ai_plan_generation():
    """TEST 2: End-to-end multi-department AI Plan Generation, Confidence, Validation & Audit"""
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
        t1 = MaintenanceTask(
            task_code=f"PLN-ENG-{suffix}",
            asset_id=asset.id,
            department_id=dept_eng.id,
            description="Turnout geometric inspection",
            duration_minutes=120,
            priority="HIGH",
            status="PLANNED"
        )
        t2 = MaintenanceTask(
            task_code=f"PLN-SIG-{suffix}",
            asset_id=asset.id,
            department_id=dept_sig.id,
            description="Axle counter calibration",
            duration_minutes=60,
            priority="MEDIUM",
            status="PLANNED"
        )
        t3 = MaintenanceTask(
            task_code=f"PLN-TRC-{suffix}",
            asset_id=asset.id,
            department_id=dept_trc.id,
            description="OHE contact wire height measurement",
            duration_minutes=90,
            priority="HIGH",
            status="PLANNED"
        )
        db.add_all([t1, t2, t3])
        db.commit()

        target_date = datetime(2026, 12, 1)

        plan = ai_block_planner.generate_plan(
            db=db,
            planning_date=target_date,
            horizon="DAILY",
            corridor_ids=[corr.id],
            departments=["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
            max_block_duration_minutes=180,
            include_overdue=True,
            include_critical=True,
            include_shared_blocks=True
        )

        assert plan["status"] == "COMPLETED"
        assert len(plan["recommended_blocks"]) >= 1

        rec_block = plan["recommended_blocks"][0]
        assert rec_block["is_shared_block"] is True
        assert len(rec_block["departments"]) >= 2
        assert rec_block["confidence"] > 50.0

        # Summary KPIs
        summary = plan["summary"]
        assert summary["planning_confidence"] > 50.0
        assert summary["downtime_reduction_pct"] > 0.0
        assert summary["validation_status"] == "PASSED"

        # Check Audit Log was recorded
        audit = db.scalar(
            select(AuditLog).where(
                AuditLog.action == "AI_PLAN_GENERATED",
                AuditLog.entity_id == plan["planning_run_id"]
            )
        )
        assert audit is not None

        # Cleanup
        db.delete(t1)
        db.delete(t2)
        db.delete(t3)
        db.commit()
    finally:
        db.close()


def test_ai_planner_api_endpoints():
    """TEST 3: REST endpoint POST /api/v1/ai/planner/generate and GET /api/v1/ai/planner/runs"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        corr = db.query(Corridor).first()
        corr_id = corr.id
    finally:
        db.close()

    # POST /api/v1/ai/planner/generate
    res = client.post("/api/v1/ai/planner/generate", json={
        "planning_date": (datetime.utcnow() + timedelta(days=50)).isoformat(),
        "horizon": "DAILY",
        "corridor_ids": [corr_id],
        "departments": ["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
        "max_block_duration_minutes": 180,
        "optimization_objective": {
            "asset_availability": 40.0,
            "maintenance_priority": 25.0,
            "train_impact": 20.0,
            "block_utilization": 15.0
        }
    }, headers=headers)

    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "planning_run_id" in body["data"]
    assert "summary" in body["data"]
    assert "recommended_blocks" in body["data"]
    assert "explanation" in body["data"]

    # GET /api/v1/ai/planner/runs
    list_res = client.get("/api/v1/ai/planner/runs", headers=headers)
    assert list_res.status_code == 200
    list_body = list_res.json()
    assert list_body["success"] is True
    assert isinstance(list_body["data"], list)
