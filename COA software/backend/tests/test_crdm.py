import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy.exc import IntegrityError
from app.database.session import SessionLocal
from app.models.crdm import (
    Zone, Division, Station, Department, Corridor, Asset,
    MaintenanceTask, Defect, BlockRequest, BlockPlan, BlockTask,
    Train, TrainSchedule, Inspection, AssetHealth,
    DepartmentCodeEnum, AssetTypeEnum, AssetStatusEnum, PriorityEnum, DefectSeverityEnum, BlockStatusEnum
)

@pytest.fixture(scope="function")
def db_session():
    session = SessionLocal()
    yield session
    session.rollback()
    session.close()

def test_department_creation(db_session):
    dept_code = f"TEST_DEPT_{uuid.uuid4().hex[:6]}"
    dept = Department(code=dept_code, name=f"Test Department {uuid.uuid4().hex[:6]}")
    db_session.add(dept)
    db_session.commit()
    
    saved = db_session.query(Department).filter_by(code=dept_code).first()
    assert saved is not None
    assert saved.code == dept_code

def test_station_and_corridor_relationships(db_session):
    zone = Zone(code=f"Z-{uuid.uuid4().hex[:6]}", name="Test Zone")
    db_session.add(zone)
    db_session.commit()

    div = Division(zone_id=zone.id, code=f"D-{uuid.uuid4().hex[:6]}", name="Test Div")
    db_session.add(div)
    db_session.commit()

    stn_a = Station(division_id=div.id, code=f"STN-A-{uuid.uuid4().hex[:4]}", name="Station 1")
    stn_b = Station(division_id=div.id, code=f"STN-B-{uuid.uuid4().hex[:4]}", name="Station 2")
    db_session.add_all([stn_a, stn_b])
    db_session.commit()

    corridor = Corridor(
        code=f"COR-{uuid.uuid4().hex[:6]}",
        name="Test Corridor",
        start_station_id=stn_a.id,
        end_station_id=stn_b.id,
        distance_km=25.0
    )
    db_session.add(corridor)
    db_session.commit()

    assert corridor.start_station.code == stn_a.code
    assert corridor.end_station.code == stn_b.code

def test_asset_source_traceability_uniqueness(db_session):
    dept = db_session.query(Department).first()
    ext_id = f"EXT-{uuid.uuid4().hex[:8]}"
    
    asset1 = Asset(
        asset_code=f"A1-{uuid.uuid4().hex[:6]}",
        asset_type="TRACK",
        department_id=dept.id,
        name="Asset 1",
        external_source="TMS",
        external_id=ext_id
    )
    db_session.add(asset1)
    db_session.commit()

    # Duplicate external_source + external_id should fail
    asset2 = Asset(
        asset_code=f"A2-{uuid.uuid4().hex[:6]}",
        asset_type="TRACK",
        department_id=dept.id,
        name="Asset 2",
        external_source="TMS",
        external_id=ext_id
    )
    db_session.add(asset2)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

def test_full_crdm_integration_and_bundling(db_session):
    """
    Section 42: Data Integrity Test
    Create:
    - ENGINEERING department
    - COR-A01 corridor
    - TRK-1001 asset
    - Maintenance task: MT-0001
    - Defect: DEF-0001
    - Block request: BR-0001
    - Block plan: BP-0001
    - Attach MT-0001 to BP-0001
    - Verify all relationships
    """
    uid = uuid.uuid4().hex[:6]
    now = datetime.utcnow()

    # 1. Department
    dept = Department(
        code=f"ENG_{uid}",
        name=f"Engineering Dept Integration Test {uid}"
    )
    db_session.add(dept)
    db_session.commit()

    # 2. Stations & Corridor
    stn_start = Station(code=f"STA_{uid}", name="Start Station")
    stn_end = Station(code=f"STB_{uid}", name="End Station")
    db_session.add_all([stn_start, stn_end])
    db_session.commit()

    corridor = Corridor(
        code=f"COR_{uid}",
        name="Main Trunk Corridor",
        start_station_id=stn_start.id,
        end_station_id=stn_end.id,
        distance_km=50.0
    )
    db_session.add(corridor)
    db_session.commit()

    # 3. Asset TRK-1001
    asset = Asset(
        asset_code=f"TRK_{uid}",
        asset_type=AssetTypeEnum.TRACK,
        department_id=dept.id,
        name="Test Track Section",
        station_id=stn_start.id,
        corridor_id=corridor.id,
        criticality_score=90.0,
        health_score=65.0,
        status=AssetStatusEnum.MONITOR,
        external_source="TMS",
        external_id=f"TMS_{uid}"
    )
    db_session.add(asset)
    db_session.commit()

    # 4. Maintenance Task MT-0001
    task = MaintenanceTask(
        task_code=f"MT_{uid}",
        asset_id=asset.id,
        department_id=dept.id,
        task_type="CORRECTIVE",
        description="Rail grinding and alignment",
        scheduled_start_at=now + timedelta(hours=4),
        due_at=now + timedelta(days=2),
        duration_minutes=120,
        priority=PriorityEnum.HIGH,
        status="PLANNED"
    )
    db_session.add(task)
    db_session.commit()

    # 5. Defect DEF-0001
    defect = Defect(
        defect_code=f"DEF_{uid}",
        asset_id=asset.id,
        department_id=dept.id,
        description="Rail surface micro-crack detected",
        severity=DefectSeverityEnum.HIGH,
        detected_at=now,
        risk_score=75.0,
        status="OPEN"
    )
    db_session.add(defect)
    db_session.commit()

    # 6. Block Request BR-0001
    block_req = BlockRequest(
        request_code=f"BR_{uid}",
        department_id=dept.id,
        asset_id=asset.id,
        corridor_id=corridor.id,
        requested_date=now,
        preferred_start_at=now + timedelta(hours=4),
        preferred_end_at=now + timedelta(hours=6),
        duration_minutes=120,
        reason="Scheduled rail grinding block demand",
        priority=PriorityEnum.HIGH,
        requested_by_reference=f"OFFICER_{uid}",
        status=BlockStatusEnum.SUBMITTED
    )
    db_session.add(block_req)
    db_session.commit()

    # 7. Block Plan BP-0001
    block_plan = BlockPlan(
        plan_code=f"BP_{uid}",
        corridor_id=corridor.id,
        planned_start_at=now + timedelta(hours=4),
        planned_end_at=now + timedelta(hours=6),
        duration_minutes=120,
        status=BlockStatusEnum.APPROVED,
        planning_horizon="DAILY",
        optimization_score=95.0,
        created_by="CONTROLLER"
    )
    db_session.add(block_plan)
    db_session.commit()

    # 8. Attach MT-0001 to BP-0001 via BlockTask join table
    block_task = BlockTask(
        block_plan_id=block_plan.id,
        maintenance_task_id=task.id,
        sequence_order=1,
        planned_duration_minutes=120
    )
    db_session.add(block_task)
    db_session.commit()

    # 9. Verify All Relationships
    reloaded_plan = db_session.query(BlockPlan).filter_by(id=block_plan.id).first()
    assert len(reloaded_plan.block_tasks) == 1
    assert reloaded_plan.block_tasks[0].maintenance_task.id == task.id
    assert reloaded_plan.block_tasks[0].maintenance_task.asset.id == asset.id
    assert reloaded_plan.block_tasks[0].maintenance_task.asset.corridor.id == corridor.id
    assert reloaded_plan.block_tasks[0].maintenance_task.department.id == dept.id
    assert len(asset.defects) == 1
    assert asset.defects[0].id == defect.id
    assert len(corridor.block_requests) == 1
    assert corridor.block_requests[0].id == block_req.id
