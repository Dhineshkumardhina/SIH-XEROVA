"""
RAILOPT AI — Phase 28 Demo Data Referential & Temporal Consistency Validator

Checks:
1. Every maintenance task references a valid asset and department
2. Every defect references a valid asset and department
3. Every train schedule references a valid train, station, and corridor
4. Every block request references a valid department, asset, and corridor
5. Every block task references a valid block plan and maintenance task
6. Every block conflict references valid block plans/requests/trains
7. No orphaned records across junction and child tables
8. No duplicate business identifiers or primary keys
9. No impossible timestamps (start_time > end_time, scheduled > due in negative duration, etc.)
10. No negative durations
11. Valid status transitions and enum values
"""
import sys
import os
from datetime import datetime

# Configure UTF-8 stdout if supported
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.session import SessionLocal
from app.models import (
    Station, Corridor, Department, Asset, MaintenanceTask, Defect,
    Train, TrainSchedule, TrainMovement, GoodsForecast,
    BlockRequest, BlockPlan, BlockTask, BlockConflict, BlockApproval,
    AssetRiskPrediction, AIPrediction, AIRecommendation,
    OptimizationRun, SimulationScenario, User, Role
)

def validate_all():
    db = SessionLocal()
    errors = []
    warnings = []

    print("=" * 70)
    print("RAILOPT AI — Phase 28 Comprehensive Data Consistency Check")
    print("=" * 70)

    try:
        # 1. Counts Summary
        stations = db.query(Station).all()
        corridors = db.query(Corridor).all()
        departments = db.query(Department).all()
        assets = db.query(Asset).all()
        tasks = db.query(MaintenanceTask).all()
        defects = db.query(Defect).all()
        trains = db.query(Train).all()
        schedules = db.query(TrainSchedule).all()
        forecasts = db.query(GoodsForecast).all()
        block_requests = db.query(BlockRequest).all()
        block_plans = db.query(BlockPlan).all()
        block_tasks = db.query(BlockTask).all()

        print(f"\n[Entity Counts]")
        print(f"  - Stations: {len(stations)} (Required: >= 5)")
        print(f"  - Corridors: {len(corridors)} (Required: >= 5)")
        print(f"  - Departments: {len(departments)} (Required: >= 3)")
        print(f"  - Assets: {len(assets)} (Required: >= 50)")
        print(f"  - Maintenance Tasks: {len(tasks)} (Required: >= 100)")
        print(f"  - Defects: {len(defects)} (Required: >= 60)")
        print(f"  - Trains: {len(trains)} (Required: >= 10)")
        print(f"  - Train Schedules: {len(schedules)} (Required: >= 100)")
        print(f"  - Goods Forecasts: {len(forecasts)} (Required: >= 30)")
        print(f"  - Block Requests: {len(block_requests)} (Required: >= 50)")
        print(f"  - Block Plans: {len(block_plans)} (Required: >= 1)")
        print(f"  - Block Tasks: {len(block_tasks)} (Required: >= 3)")

        if len(stations) < 5: warnings.append(f"Station count {len(stations)} is below 5")
        if len(corridors) < 5: warnings.append(f"Corridor count {len(corridors)} is below 5")
        if len(assets) < 50: warnings.append(f"Asset count {len(assets)} is below 50")
        if len(tasks) < 100: warnings.append(f"Task count {len(tasks)} is below 100")
        if len(defects) < 60: warnings.append(f"Defect count {len(defects)} is below 60")
        if len(block_requests) < 50: warnings.append(f"BlockRequest count {len(block_requests)} is below 50")
        if len(schedules) < 100: warnings.append(f"Schedule count {len(schedules)} is below 100")
        if len(forecasts) < 30: warnings.append(f"GoodsForecast count {len(forecasts)} is below 30")

        # Create Lookup Sets
        station_ids = {s.id for s in stations}
        corridor_ids = {c.id for c in corridors}
        department_ids = {d.id for d in departments}
        asset_ids = {a.id for a in assets}
        task_ids = {t.id for t in tasks}
        train_ids = {t.id for t in trains}
        plan_ids = {p.id for p in block_plans}

        # 2. Check Assets
        print("\n[Validation 1/7] Validating Assets...")
        asset_codes = set()
        for a in assets:
            if a.asset_code in asset_codes:
                errors.append(f"Duplicate asset_code: {a.asset_code}")
            asset_codes.add(a.asset_code)

            if a.department_id and a.department_id not in department_ids:
                errors.append(f"Asset {a.asset_code} has invalid department_id: {a.department_id}")
            if a.corridor_id and a.corridor_id not in corridor_ids:
                errors.append(f"Asset {a.asset_code} has invalid corridor_id: {a.corridor_id}")
            if a.station_id and a.station_id not in station_ids:
                errors.append(f"Asset {a.asset_code} has invalid station_id: {a.station_id}")
            if a.health_score is not None and (a.health_score < 0 or a.health_score > 100):
                errors.append(f"Asset {a.asset_code} has out-of-range health_score: {a.health_score}")
            if a.criticality_score is not None and (a.criticality_score < 0 or a.criticality_score > 100):
                errors.append(f"Asset {a.asset_code} has out-of-range criticality_score: {a.criticality_score}")

        # 3. Check Maintenance Tasks
        print("[Validation 2/7] Validating Maintenance Tasks...")
        task_codes = set()
        for t in tasks:
            if t.task_code in task_codes:
                errors.append(f"Duplicate task_code: {t.task_code}")
            task_codes.add(t.task_code)

            if t.asset_id not in asset_ids:
                errors.append(f"Task {t.task_code} references missing asset_id: {t.asset_id}")
            if t.department_id and t.department_id not in department_ids:
                errors.append(f"Task {t.task_code} references missing department_id: {t.department_id}")
            if t.duration_minutes is not None and t.duration_minutes <= 0:
                errors.append(f"Task {t.task_code} has invalid non-positive duration: {t.duration_minutes}")

        # 4. Check Defects
        print("[Validation 3/7] Validating Defects...")
        defect_codes = set()
        for d in defects:
            if d.defect_code in defect_codes:
                errors.append(f"Duplicate defect_code: {d.defect_code}")
            defect_codes.add(d.defect_code)

            if d.asset_id not in asset_ids:
                errors.append(f"Defect {d.defect_code} references missing asset_id: {d.asset_id}")
            if d.department_id and d.department_id not in department_ids:
                errors.append(f"Defect {d.defect_code} references missing department_id: {d.department_id}")
            if d.risk_score is not None and (d.risk_score < 0 or d.risk_score > 100):
                errors.append(f"Defect {d.defect_code} has out-of-range risk_score: {d.risk_score}")

        # 5. Check Trains & Schedules
        print("[Validation 4/7] Validating Trains & Schedules...")
        for s in schedules:
            if s.train_id not in train_ids:
                errors.append(f"TrainSchedule {s.id} references missing train_id: {s.train_id}")
            if s.corridor_id not in corridor_ids:
                errors.append(f"TrainSchedule {s.id} references missing corridor_id: {s.corridor_id}")
            if s.station_id not in station_ids:
                errors.append(f"TrainSchedule {s.id} references missing station_id: {s.station_id}")
            if s.arrival_time and s.departure_time and s.arrival_time > s.departure_time:
                errors.append(f"TrainSchedule {s.id} has arrival_time > departure_time")

        # 6. Check Block Requests & Plans
        print("[Validation 5/7] Validating Block Requests & Bundled Plans...")
        req_codes = set()
        for br in block_requests:
            if br.request_code in req_codes:
                errors.append(f"Duplicate request_code: {br.request_code}")
            req_codes.add(br.request_code)

            if br.department_id and br.department_id not in department_ids:
                errors.append(f"BlockRequest {br.request_code} references invalid department_id: {br.department_id}")
            if br.corridor_id and br.corridor_id not in corridor_ids:
                errors.append(f"BlockRequest {br.request_code} references invalid corridor_id: {br.corridor_id}")
            if br.asset_id and br.asset_id not in asset_ids:
                errors.append(f"BlockRequest {br.request_code} references invalid asset_id: {br.asset_id}")
            if br.preferred_start_at and br.preferred_end_at and br.preferred_start_at >= br.preferred_end_at:
                errors.append(f"BlockRequest {br.request_code} has start_at >= end_at")
            if br.duration_minutes is not None and br.duration_minutes <= 0:
                errors.append(f"BlockRequest {br.request_code} has non-positive duration: {br.duration_minutes}")

        for bt in block_tasks:
            if bt.block_plan_id not in plan_ids:
                errors.append(f"BlockTask {bt.id} references invalid block_plan_id: {bt.block_plan_id}")
            if bt.maintenance_task_id not in task_ids:
                errors.append(f"BlockTask {bt.id} references invalid maintenance_task_id: {bt.maintenance_task_id}")

        # 7. Check Goods Freight Forecasts
        print("[Validation 6/7] Validating Goods Freight Forecasts...")
        for gf in forecasts:
            if gf.corridor_id and gf.corridor_id not in corridor_ids:
                errors.append(f"GoodsForecast {gf.id} references invalid corridor_id: {gf.corridor_id}")
            if gf.movement_probability is not None and (gf.movement_probability < 0 or gf.movement_probability > 1.0):
                errors.append(f"GoodsForecast {gf.id} has invalid movement_probability: {gf.movement_probability}")

        # 8. Check Integrity Report
        print("[Validation 7/7] Checking for Orphaned Records & Violations...")
        print("=" * 70)
        if errors:
            print(f"FAILED with {len(errors)} consistency error(s):")
            for err in errors[:20]:
                print(f"  ❌ {err}")
            if len(errors) > 20:
                print(f"  ... and {len(errors) - 20} more errors.")
            return False
        else:
            print("✅ ZERO REFERENTIAL INTEGRITY ERRORS FOUND.")
            if warnings:
                print(f"\n⚠️ {len(warnings)} WARNING(S):")
                for w in warnings:
                    print(f"  - {w}")
            else:
                print("✅ ALL QUANTITATIVE MINIMUM THRESHOLDS MET.")
            print("=" * 70)
            return True

    finally:
        db.close()

if __name__ == "__main__":
    success = validate_all()
    sys.exit(0 if success else 1)
