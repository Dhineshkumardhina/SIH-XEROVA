import pytest
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models import (
    Base,
    Zone, Division, Station, Department, Corridor, Asset,
    TrackAsset, SignalAsset, PointMachine, OHEAsset,
    MaintenanceTask, Defect, Train, TrainSchedule,
    BlockRequest, BlockPlan, BlockTask, BlockConflict,
    DepartmentType, AssetType, AssetStatus, MaintenanceStatus, PriorityLevel, DefectSeverity, BlockRequestStatus, ConflictType
)

client = TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

def test_database_connection(db_session):
    """Verify direct connection to database engine."""
    result = db_session.execute(text("SELECT 1")).scalar()
    assert result == 1

def test_database_health_endpoints():
    """Verify GET /health and GET /health/db endpoints."""
    # General health
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"

    # Database specific health
    res_db = client.get("/health/db")
    assert res_db.status_code == 200
    db_data = res_db.json()
    assert db_data["success"] is True
    assert db_data["data"]["database_status"] == "healthy"
    assert "latency_ms" in db_data["data"]
    assert "current_migration" in db_data["data"]

def test_ten_step_database_workflow(db_session):
    """
    Section 42: Comprehensive Workflow Test
    1. Create corridor
    2. Create asset (and specialized TrackAsset)
    3. Create maintenance task linked to asset
    4. Create defect linked to asset
    5. Create train
    6. Create train schedule
    7. Create block request
    8. Create block plan
    9. Attach maintenance task to block plan (BlockTask)
    10. Create block conflict
    """
    uid = uuid.uuid4().hex[:6]
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Setup parent department and stations
    dept = Department(code=f"DEPT_{uid}", name=f"Department {uid}")
    db_session.add(dept)
    db_session.commit()

    stn_start = Station(code=f"STA_{uid}", name=f"Start Stn {uid}")
    stn_end = Station(code=f"STB_{uid}", name=f"End Stn {uid}")
    db_session.add_all([stn_start, stn_end])
    db_session.commit()

    # Step 1: Create corridor
    corridor = Corridor(
        code=f"COR_{uid}",
        name=f"Corridor {uid}",
        start_station_id=stn_start.id,
        end_station_id=stn_end.id,
        distance_km=42.5,
        track_count=2,
        electrified=True
    )
    db_session.add(corridor)
    db_session.commit()
    assert corridor.id is not None

    # Step 2: Create asset and specialized TrackAsset
    asset = Asset(
        asset_code=f"TRK_{uid}",
        asset_type=AssetType.TRACK,
        department_id=dept.id,
        corridor_id=corridor.id,
        station_id=stn_start.id,
        name=f"Track Asset {uid}",
        criticality_score=75.0,
        health_score=80.0,
        status=AssetStatus.HEALTHY
    )
    db_session.add(asset)
    db_session.commit()
    assert asset.id is not None

    track_ext = TrackAsset(
        asset_id=asset.id,
        kilometer_from=10.0,
        kilometer_to=12.5,
        track_type="MAIN_LINE",
        condition="GOOD"
    )
    db_session.add(track_ext)
    db_session.commit()
    assert asset.track_details is not None
    assert asset.track_details.kilometer_to == 12.5

    # Step 3: Create maintenance task linked to asset
    task = MaintenanceTask(
        task_code=f"MT_{uid}",
        asset_id=asset.id,
        department_id=dept.id,
        task_type="PREVENTIVE",
        description="Fastener tightening",
        duration_minutes=60,
        priority=PriorityLevel.HIGH,
        status=MaintenanceStatus.PLANNED
    )
    db_session.add(task)
    db_session.commit()
    assert task.asset.id == asset.id

    # Step 4: Create defect linked to asset
    defect = Defect(
        defect_code=f"DEF_{uid}",
        asset_id=asset.id,
        department_id=dept.id,
        description="Minor track alignment divergence",
        severity=DefectSeverity.MEDIUM,
        risk_score=60.0,
        status="OPEN"
    )
    db_session.add(defect)
    db_session.commit()
    assert defect.asset.id == asset.id

    # Step 5: Create train
    train = Train(
        train_number=f"TRN_{uid}",
        train_name=f"Intercity Superfast {uid}",
        train_type="SUPERFAST",
        default_direction="UP",
        priority=1
    )
    db_session.add(train)
    db_session.commit()
    assert train.id is not None

    # Step 6: Create train schedule
    schedule = TrainSchedule(
        train_id=train.id,
        station_id=stn_start.id,
        corridor_id=corridor.id,
        scheduled_date=now,
        arrival_time=now + timedelta(hours=2),
        departure_time=now + timedelta(hours=2, minutes=10),
        sequence_number=1
    )
    db_session.add(schedule)
    db_session.commit()
    assert schedule.train.id == train.id
    assert schedule.corridor.id == corridor.id

    # Step 7: Create block request
    block_req = BlockRequest(
        request_code=f"BR_{uid}",
        department_id=dept.id,
        asset_id=asset.id,
        corridor_id=corridor.id,
        requested_date=now,
        preferred_start_at=now + timedelta(hours=3),
        preferred_end_at=now + timedelta(hours=5),
        duration_minutes=120,
        reason="Scheduled maintenance window",
        priority="HIGH",
        requested_by=f"OFFICER_{uid}",
        status=BlockRequestStatus.SUBMITTED
    )
    db_session.add(block_req)
    db_session.commit()
    assert block_req.corridor.id == corridor.id

    # Step 8: Create block plan
    block_plan = BlockPlan(
        plan_code=f"BP_{uid}",
        corridor_id=corridor.id,
        planned_start_at=now + timedelta(hours=3),
        planned_end_at=now + timedelta(hours=5),
        duration_minutes=120,
        status="APPROVED"
    )
    db_session.add(block_plan)
    db_session.commit()
    assert block_plan.id is not None

    # Step 9: Attach maintenance task to block plan (BlockTask)
    block_task = BlockTask(
        block_plan_id=block_plan.id,
        maintenance_task_id=task.id,
        sequence_order=1,
        planned_duration_minutes=60
    )
    db_session.add(block_task)
    db_session.commit()

    reloaded_plan = db_session.query(BlockPlan).filter_by(id=block_plan.id).first()
    assert len(reloaded_plan.block_tasks) == 1
    assert reloaded_plan.block_tasks[0].maintenance_task.id == task.id

    # Step 10: Create conflict
    conflict = BlockConflict(
        block_plan_id=block_plan.id,
        conflict_type=ConflictType.TRAIN_CONFLICT,
        severity="HIGH",
        description=f"Train {train.train_number} scheduled during block window",
        related_train_id=train.id,
        resolved=False
    )
    db_session.add(conflict)
    db_session.commit()
    assert conflict.block_plan.id == block_plan.id
    assert conflict.related_train.id == train.id

def test_check_constraints_and_validation(db_session):
    """Test CHECK constraint on criticality_score range (0-100)."""
    dept = db_session.query(Department).first()
    invalid_asset = Asset(
        asset_code=f"INV-{uuid.uuid4().hex[:6]}",
        asset_type=AssetType.TRACK,
        department_id=dept.id,
        name="Invalid Score Rail",
        criticality_score=150.0 # Exceeds 100
    )
    db_session.add(invalid_asset)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
