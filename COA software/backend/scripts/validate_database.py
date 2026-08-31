"""
RAILOPT AI — Phase 3 CRDM Database Integrity Validation Script

Validates:
1. All 40 tables (including 8 specialized asset tables) exist in metadata/catalog
2. Foreign key constraints and relationships function properly
3. Unique constraints (business identifiers & composite external source+id)
4. Multi-department task bundling through BlockTask
5. Source traceability and specialized 1-to-1 asset extension integrity
"""
import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError
from app.database.session import engine, SessionLocal
from app.models import (
    Zone, Division, Station, Department, Corridor, Asset,
    TrackAsset, SignalAsset, TelecomAsset, OHEAsset, Feeder, Transformer, Substation, PointMachine,
    AssetHealth, AssetRiskPrediction, Inspection, MaintenanceTask, MaintenanceHistory,
    Defect, Train, TrainSchedule, TrainMovement, GoodsForecast,
    BlockRequest, BlockPlan, BlockTask, BlockConflict, BlockApproval,
    AIPrediction, AIRecommendation, OptimizationRun, OptimizationResult,
    SimulationScenario, SimulationRun, SimulationEvent,
    Notification, AuditLog, SystemSetting, User
)

EXPECTED_TABLES = [
    "zones", "divisions", "stations", "departments", "corridors",
    "assets", "track_assets", "signal_assets", "telecom_assets", "ohe_assets",
    "feeders", "transformers", "substations", "point_machines",
    "asset_health", "asset_risk_predictions", "inspections", "maintenance_tasks", "maintenance_history",
    "defects", "trains", "train_schedules", "train_movements", "goods_forecasts",
    "block_requests", "block_plans", "block_tasks", "block_conflicts", "block_approvals",
    "ai_predictions", "ai_recommendations", "optimization_runs", "optimization_results",
    "simulation_scenarios", "simulation_runs", "simulation_events",
    "notifications", "audit_logs", "system_settings", "users"
]

def run_validation():
    print("=" * 65)
    print("RAILOPT AI: Validating Phase 3 Database & Specialized Tables...")
    print("=" * 65)

    inspector = inspect(engine)
    existing_tables = set(inspector.get_table_names())

    # 1. Table Existence Check
    print(f"\n[1/6] Checking table existence ({len(EXPECTED_TABLES)} expected)...")
    missing = [t for t in EXPECTED_TABLES if t not in existing_tables]
    if missing:
        print(f"FAILED: Missing tables: {missing}")
        sys.exit(1)
    print(f"SUCCESS: All {len(EXPECTED_TABLES)} CRDM tables (including specialized extensions) exist.")

    db = SessionLocal()

    try:
        # 2. Check Seed Data Counts
        print("\n[2/6] Verifying seeded relational entities...")
        dept_count = db.query(Department).count()
        zone_count = db.query(Zone).count()
        station_count = db.query(Station).count()
        corridor_count = db.query(Corridor).count()
        asset_count = db.query(Asset).count()
        task_count = db.query(MaintenanceTask).count()
        defect_count = db.query(Defect).count()
        train_count = db.query(Train).count()
        plan_count = db.query(BlockPlan).count()
        block_task_count = db.query(BlockTask).count()

        print(f"  - Departments: {dept_count} (Expected >= 3)")
        print(f"  - Zones: {zone_count} (Expected >= 1)")
        print(f"  - Stations: {station_count} (Expected >= 3)")
        print(f"  - Corridors: {corridor_count} (Expected >= 2)")
        print(f"  - Assets: {asset_count} (Expected >= 5)")
        print(f"  - Maintenance Tasks: {task_count} (Expected >= 5)")
        print(f"  - Defects: {defect_count} (Expected >= 3)")
        print(f"  - Trains: {train_count} (Expected >= 3)")
        print(f"  - Block Plans: {plan_count} (Expected >= 1)")
        print(f"  - Bundled Block Tasks: {block_task_count} (Expected >= 3)")

        assert dept_count >= 3, "Insufficient departments"
        assert asset_count >= 5, "Insufficient assets"
        assert task_count >= 5, "Insufficient maintenance tasks"
        assert defect_count >= 3, "Insufficient defects"
        assert plan_count >= 1, "Insufficient block plans"
        assert block_task_count >= 3, "Insufficient bundled block tasks"
        print("SUCCESS: Core seed data counts validated.")

        # 3. Specialized 1-to-1 Asset Extension Check
        print("\n[3/6] Validating specialized asset tables (Section 14)...")
        track_count = db.query(TrackAsset).count()
        signal_count = db.query(SignalAsset).count()
        point_count = db.query(PointMachine).count()
        ohe_count = db.query(OHEAsset).count()
        print(f"  - Track Assets: {track_count}")
        print(f"  - Signal Assets: {signal_count}")
        print(f"  - Point Machines: {point_count}")
        print(f"  - OHE Assets: {ohe_count}")

        # Check 1-to-1 relationship navigation
        track1 = db.query(Asset).filter_by(asset_code="TRK-1001").first()
        assert track1.track_details is not None, "TrackAsset relationship not navigating"
        assert track1.track_details.kilometer_from == 12.0

        sig1 = db.query(Asset).filter_by(asset_code="SIG-2001").first()
        assert sig1.signal_details is not None, "SignalAsset relationship not navigating"
        print("SUCCESS: Specialized 1-to-1 asset extension tables verified.")

        # 4. Relationship Traversal Validation
        print("\n[4/6] Validating deep relational traversal...")
        zone = db.query(Zone).first()
        assert len(zone.divisions) > 0, "Zone has no divisions"
        division = zone.divisions[0]
        assert len(division.stations) > 0, "Division has no stations"
        station = division.stations[0]
        print(f"  Traversed: Zone ({zone.code}) -> Division ({division.code}) -> Station ({station.code})")

        bp = db.query(BlockPlan).first()
        assert len(bp.block_tasks) >= 3, "Block plan missing bundled block tasks"
        bundled_departments = set()
        for bt in bp.block_tasks:
            task = bt.maintenance_task
            assert task is not None, "BlockTask has no associated MaintenanceTask"
            assert task.department is not None, "Task has no associated Department"
            bundled_departments.add(task.department.code)

        print(f"  Block Plan {bp.plan_code} successfully bundled {len(bp.block_tasks)} tasks across departments: {bundled_departments}")
        assert len(bundled_departments) >= 2, "Bundling must span multiple departments"
        print("SUCCESS: Relational integrity and multi-department bundling validated.")

        # 5. Unique Business Code Constraint Validation
        print("\n[5/6] Testing unique business code constraints...")
        duplicate_asset = Asset(
            asset_code="TRK-1001",
            asset_type="TRACK",
            department_id=db.query(Department).first().id,
            name="Duplicate Test Rail"
        )
        db.add(duplicate_asset)
        try:
            db.commit()
            print("FAILED: Unique asset_code constraint did not trigger!")
            sys.exit(1)
        except IntegrityError:
            db.rollback()
            print("SUCCESS: Duplicate asset_code correctly rejected by database constraint.")

        # 6. External Source Traceability Uniqueness Validation
        print("\n[6/6] Testing composite uniqueness (external_source + external_id)...")
        dup_external = Asset(
            asset_code=f"TRK-TEST-{uuid.uuid4().hex[:6]}",
            asset_type="TRACK",
            department_id=db.query(Department).first().id,
            name="Duplicate External ID Test",
            external_source="TMS",
            external_id="TMS-TRK-1001"
        )
        db.add(dup_external)
        try:
            db.commit()
            print("FAILED: Composite unique (external_source + external_id) constraint did not trigger!")
            sys.exit(1)
        except IntegrityError:
            db.rollback()
            print("SUCCESS: Duplicate external_source + external_id correctly rejected.")

    finally:
        db.close()

    print("\n" + "=" * 65)
    print("ALL PHASE 3 DATABASE INTEGRITY VALIDATIONS PASSED (100%)")
    print("=" * 65)

if __name__ == "__main__":
    run_validation()
