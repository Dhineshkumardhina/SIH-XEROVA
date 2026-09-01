import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.api.dependencies import get_current_user
from app.models.asset import Asset
from app.models.corridor import Corridor
from app.models.department import Department
from app.models.maintenance import MaintenanceTask
from app.models.train import Train, TrainSchedule

router = APIRouter(prefix="/demo", tags=["Demo"])

_logger = logging.getLogger(__name__)

def _clear_demo_data(db: Session):
    """Delete any existing demo rows without affecting production data.
    Only tables used in the demo are cleared.
    """
    db.query(TrainSchedule).delete()
    db.query(Train).delete()
    db.query(MaintenanceTask).delete()
    db.query(Asset).delete()
    db.query(Corridor).delete()
    db.query(Department).delete()
    db.commit()

def _load_synthetic_scenario(db: Session):
    """Insert a deterministic synthetic scenario used for the SIH demo.
    All timestamps are fixed to guarantee repeatable simulation results.
    """
    # Department
    dept = Department(code="ENG", name="Engineering")
    db.add(dept)
    db.flush()
    # Corridor
    corridor = Corridor(
        code="COR-A01",
        name="Main Corridor",
        start_station_id="STN-001",
        end_station_id="STN-002",
        distance_km=30.0,
        capacity=2,
    )
    db.add(corridor)
    db.flush()
    # Asset
    asset = Asset(
        asset_code="ASSET-001",
        department_id=dept.id,
        corridor_id=corridor.id,
        status="ACTIVE",
    )
    db.add(asset)
    db.flush()
    # Critical Maintenance Task
    maint = MaintenanceTask(
        task_code="MT-CRIT-001",
        asset_id=asset.id,
        priority="CRITICAL",
        duration_minutes=180,
        required_window_start="2026-09-01T08:00:00Z",
        required_window_end="2026-09-01T20:00:00Z",
    )
    db.add(maint)
    # Trains (two overlapping schedules)
    train1 = Train(train_code="TR-001", type="PASSENGER")
    db.add(train1)
    db.flush()
    sched1 = TrainSchedule(
        train_id=train1.id,
        corridor_id=corridor.id,
        start_time="2026-09-01T09:00:00Z",
        end_time="2026-09-01T10:00:00Z",
    )
    db.add(sched1)
    train2 = Train(train_code="TR-002", type="PASSENGER")
    db.add(train2)
    db.flush()
    sched2 = TrainSchedule(
        train_id=train2.id,
        corridor_id=corridor.id,
        start_time="2026-09-01T09:30:00Z",
        end_time="2026-09-01T10:30:00Z",
    )
    db.add(sched2)
    db.commit()

@router.post("/start", response_model=dict)
def start_demo(current_user=Depends(get_current_user)):
    """Reset backend to a known deterministic state for the SIH demo.
    The endpoint is protected – only authenticated users can trigger it.
    """
    db: Session = SessionLocal()
    try:
        _clear_demo_data(db)
        _load_synthetic_scenario(db)
    except Exception as exc:
        db.rollback()
        _logger.exception("Failed to initialise demo data")
        raise HTTPException(status_code=500, detail="Demo initialization failed")
    finally:
        db.close()
    return {"success": True, "message": "Demo data loaded"}
