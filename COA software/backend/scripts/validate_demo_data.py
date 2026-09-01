import sys
import os
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import SessionLocal
from app.models.station import Station
from app.models.corridor import Corridor
from app.models.asset import Asset
from app.models.maintenance import MaintenanceTask
from app.models.defect import Defect
from app.models.train import Train, TrainSchedule, GoodsForecast
from app.models.block import BlockRequest, BlockPlan

def validate_demo_data():
    """
    Validates synthetic demonstration dataset parameters, referential integrity,
    and temporal consistency.
    """
    print("=================================================================")
    print("RAILOPT AI — SIH Demonstration Dataset & Integrity Validation")
    print("=================================================================")

    db = SessionLocal()
    ref_errors = 0
    temp_errors = 0

    try:
        stations = list(db.scalars(select(Station)))
        corridors = list(db.scalars(select(Corridor)))
        assets = list(db.scalars(select(Asset)))
        tasks = list(db.scalars(select(MaintenanceTask)))
        defects = list(db.scalars(select(Defect)))
        trains = list(db.scalars(select(Train)))
        schedules = list(db.scalars(select(TrainSchedule)))
        block_reqs = list(db.scalars(select(BlockRequest)))
        forecasts = list(db.scalars(select(GoodsForecast)))

        print(f"\n[1/4] Counting Demonstration Dataset Records:")
        print(f"  - Stations: {len(stations)}")
        print(f"  - Corridors: {len(corridors)}")
        print(f"  - Assets: {len(assets)}")
        print(f"  - Maintenance Tasks: {len(tasks)}")
        print(f"  - Defects: {len(defects)}")
        print(f"  - Trains: {len(trains)}")
        print(f"  - Train Schedules: {len(schedules)}")
        print(f"  - Block Requests: {len(block_reqs)}")
        print(f"  - Goods Forecasts: {len(forecasts)}")

        # 2. Check Referential Integrity
        print(f"\n[2/4] Verifying Referential Integrity Constraints:")
        for a in assets:
            if a.corridor_id and not any(c.id == a.corridor_id for c in corridors):
                print(f"  - ERROR: Asset {a.asset_code} points to missing corridor {a.corridor_id}")
                ref_errors += 1

        for t in tasks:
            if not t.asset_id or not any(a.id == t.asset_id for a in assets):
                print(f"  - ERROR: Task {t.task_code} points to missing asset {t.asset_id}")
                ref_errors += 1

        for b in block_reqs:
            if not b.corridor_id or not any(c.id == b.corridor_id for c in corridors):
                print(f"  - ERROR: Block Request {b.request_code} points to missing corridor {b.corridor_id}")
                ref_errors += 1

        print(f"  Referential Integrity Errors: {ref_errors}")

        # 3. Check Temporal Consistency
        print(f"\n[3/4] Verifying Temporal Consistency:")
        for t in tasks:
            if t.preferred_start_at and t.preferred_end_at:
                if t.preferred_start_at >= t.preferred_end_at:
                    print(f"  - ERROR: Task {t.task_code} start ({t.preferred_start_at}) >= end ({t.preferred_end_at})")
                    temp_errors += 1

        for b in block_reqs:
            if b.preferred_start_at and b.preferred_end_at:
                if b.preferred_start_at >= b.preferred_end_at:
                    print(f"  - ERROR: Block Request {b.request_code} start ({b.preferred_start_at}) >= end ({b.preferred_end_at})")
                    temp_errors += 1

        print(f"  Temporal Consistency Errors: {temp_errors}")

        # 4. Summary Output
        print(f"\n[4/4] Validation Summary:")
        if ref_errors == 0 and temp_errors == 0:
            print("=================================================================")
            print("DEMONSTRATION DATASET VALIDATION PASSED (0 ERRORS)")
            print("=================================================================")
            return True
        else:
            print("=================================================================")
            print(f"DEMONSTRATION DATASET VALIDATION FAILED ({ref_errors + temp_errors} ERRORS)")
            print("=================================================================")
            sys.exit(1)

    finally:
        db.close()

if __name__ == "__main__":
    validate_demo_data()
