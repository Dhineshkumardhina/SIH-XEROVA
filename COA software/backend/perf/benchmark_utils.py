import os
from typing import List
from sqlalchemy.orm import Session
from app.database.session import SessionLocal
from app.models.asset import Asset
from app.models.task import MaintenanceTask
from app.models.maintenance import MaintenanceRecord

def bulk_insert(session: Session, model, records: List[dict]):
    """Insert a list of dict records into the DB using bulk_save_objects for speed."""
    objects = [model(**rec) for rec in records]
    session.bulk_save_objects(objects)
    session.commit()

def generate_assets(count: int) -> List[dict]:
    return [{
        "name": f"Asset {i}",
        "code": f"A{i:05d}",
        "department_id": 1,
        "status": "ACTIVE",
    } for i in range(1, count + 1)]

def generate_tasks(count: int) -> List[dict]:
    return [{
        "title": f"Task {i}",
        "description": "Benchmark task",
        "priority": "MEDIUM",
        "status": "PENDING",
        "scheduled_date": None,
    } for i in range(1, count + 1)]

def generate_maintenance_records(asset_count: int, per_asset: int = 5) -> List[dict]:
    records = []
    for i in range(1, asset_count + 1):
        for j in range(per_asset):
            records.append({
                "asset_id": i,
                "description": f"Maintenance record {j} for asset {i}",
                "date": None,
                "status": "COMPLETED",
            })
    return records

def reset_database():
    """Drop and recreate all tables using Alembic. Assumes alembic is configured."""
    os.system("alembic downgrade base && alembic upgrade head")

def populate_demo_data(asset_cnt: int, task_cnt: int, maint_per_asset: int = 5):
    db = SessionLocal()
    bulk_insert(db, Asset, generate_assets(asset_cnt))
    bulk_insert(db, MaintenanceTask, generate_tasks(task_cnt))
    bulk_insert(db, MaintenanceRecord, generate_maintenance_records(asset_cnt, per_asset=maint_per_asset))
    db.close()

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Populate benchmark data")
    parser.add_argument("--assets", type=int, default=1000, help="Number of assets to create")
    parser.add_argument("--tasks", type=int, default=500, help="Number of tasks to create")
    parser.add_argument("--maintenance-per-asset", type=int, default=5, help="Maintenance records per asset")
    args = parser.parse_args()
    reset_database()
    populate_demo_data(args.assets, args.tasks, args.maintenance_per_asset)
