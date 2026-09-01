"""
RAILOPT AI — Automated Complete System Audit Script (Phase 29.2)
Inspects API routes, database schemas, foreign keys, relationships, OR-Tools constraints,
security settings, and data flows.
"""
import sys
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi.routing import APIRoute
from sqlalchemy import inspect as sa_inspect, text, select
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import engine, SessionLocal
from app.models import (
    User, Role, Permission, Department, Zone, Division, Station, Corridor,
    Asset, MaintenanceTask, Defect, BlockRequest, BlockPlan, BlockTask,
    BlockConflict, Train, TrainSchedule, GoodsForecast, AssetRiskPrediction,
    OptimizationRun, SimulationScenario, Report, AuditLog
)
from app.ai.block_planner import ai_block_planner
from app.services.block_conflict_service import block_conflict_service
from app.services.train_impact_service import train_impact_service
from app.services.report_service import report_service
from app.services.analytics_service import analytics_service
from app.core.config import settings

def run_audit():
    print("=" * 70)
    print("RAILOPT AI — AUTOMATED COMPREHENSIVE SYSTEM AUDIT")
    print(f"Timestamp: {datetime.utcnow().isoformat()}Z | Environment: {settings.ENVIRONMENT}")
    print("=" * 70)

    # 1. API AUDIT
    print("\n[SECTION 1] API ROUTE INVENTORY & METHODS")
    openapi = app.openapi()
    paths = openapi.get("paths", {})
    
    routes_by_tag = {}
    total_endpoints = 0
    for path, methods_dict in paths.items():
        for method, info in methods_dict.items():
            if method.lower() in ["get", "post", "put", "patch", "delete"]:
                total_endpoints += 1
                tag = info.get("tags", ["General"])[0]
                summary = info.get("summary", info.get("operation_id", ""))
                routes_by_tag.setdefault(tag, []).append((path, method.upper(), summary))

    print(f"Total OpenAPI Paths: {len(paths)} | Total Registered Endpoints: {total_endpoints}")
    
    for tag, r_list in sorted(routes_by_tag.items()):
        print(f"  * {tag} ({len(r_list)} routes):")
        for path, method, summary in r_list:
            print(f"      - [{method:6}] {path:45} -> {summary}")

    # 2. DATABASE SCHEMA & ORPHAN AUDIT
    print("\n[SECTION 2] DATABASE SCHEMA, RELATIONSHIPS & ORPHAN AUDIT")
    inspector = sa_inspect(engine)
    tables = inspector.get_table_names()
    print(f"Total Tables in Database: {len(tables)}")
    
    db: Session = SessionLocal()
    table_stats = {}
    for table_name in sorted(tables):
        fks = inspector.get_foreign_keys(table_name)
        indexes = inspector.get_indexes(table_name)
        count = db.execute(text(f'SELECT count(*) FROM "{table_name}"')).scalar()
        table_stats[table_name] = {"rows": count, "fks": len(fks), "indexes": len(indexes)}
        print(f"  * Table: {table_name:30} | Rows: {count:5} | FKs: {len(fks):2} | Indexes: {len(indexes):2}")

    # Referential orphan integrity checks
    print("\n[SECTION 3] REFERENTIAL INTEGRITY & ORPHAN CHECKS")
    orphan_checks = [
        ("Assets -> Corridor", "SELECT count(*) FROM assets WHERE corridor_id IS NOT NULL AND corridor_id NOT IN (SELECT id FROM corridors)"),
        ("Assets -> Department", "SELECT count(*) FROM assets WHERE department_id IS NOT NULL AND department_id NOT IN (SELECT id FROM departments)"),
        ("Maintenance Tasks -> Asset", "SELECT count(*) FROM maintenance_tasks WHERE asset_id NOT IN (SELECT id FROM assets)"),
        ("Defects -> Asset", "SELECT count(*) FROM defects WHERE asset_id NOT IN (SELECT id FROM assets)"),
        ("Block Requests -> Asset", "SELECT count(*) FROM block_requests WHERE asset_id NOT IN (SELECT id FROM assets)"),
        ("Block Requests -> Corridor", "SELECT count(*) FROM block_requests WHERE corridor_id NOT IN (SELECT id FROM corridors)"),
        ("Train Schedules -> Train", "SELECT count(*) FROM train_schedules WHERE train_id NOT IN (SELECT id FROM trains)"),
        ("Train Schedules -> Station", "SELECT count(*) FROM train_schedules WHERE station_id NOT IN (SELECT id FROM stations)"),
        ("Goods Forecasts -> Corridor", "SELECT count(*) FROM goods_forecasts WHERE corridor_id NOT IN (SELECT id FROM corridors)"),
        ("Reports -> Corridor", "SELECT count(*) FROM reports WHERE corridor_id IS NOT NULL AND corridor_id NOT IN (SELECT id FROM corridors)"),
    ]
    
    all_zero_orphans = True
    for label, query in orphan_checks:
        orphan_count = db.execute(text(query)).scalar()
        status_str = "PASS (0 orphans)" if orphan_count == 0 else f"FAIL ({orphan_count} orphans)"
        print(f"  * {label:35}: {status_str}")
        if orphan_count > 0:
            all_zero_orphans = False

    # 4. OPTIMIZATION & CONSTRAINT ENFORCEMENT AUDIT
    print("\n[SECTION 4] OR-TOOLS OPTIMIZATION & CONSTRAINT AUDIT")
    corridor = db.query(Corridor).first()
    if corridor:
        print(f"Testing OR-Tools CP-SAT Optimizer on Corridor: {corridor.code} ({corridor.name})")
        plan_res = ai_block_planner.generate_plan(
            db=db,
            planning_date=datetime.utcnow() + timedelta(days=1),
            horizon="DAILY",
            corridor_ids=[corridor.id],
            departments=["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
            max_block_duration_minutes=180,
            min_priority=20.0,
            include_overdue=True,
            include_critical=True,
            include_shared_blocks=True
        )
        print(f"  * Optimizer Run Status: {plan_res.get('status')}")
        print(f"  * Summary: {plan_res.get('summary')}")
        rec_blocks = plan_res.get("recommended_blocks", [])
        print(f"  * Recommended Blocks Generated: {len(rec_blocks)}")
        for b in rec_blocks:
            print(f"      - Block {b.get('block_id')}: {b.get('duration_minutes')} mins | Depts: {b.get('departments')} | Tasks: {b.get('task_count')} | Opt Score: {b.get('optimization_score')}")

    # 5. SECURITY & SECRETS AUDIT
    print("\n[SECTION 5] SECURITY & CONFIGURATION AUDIT")
    print(f"  * JWT Algorithm: {settings.JWT_ALGORITHM}")
    print(f"  * Access Token Expire Minutes: {settings.ACCESS_TOKEN_EXPIRE_MINUTES}")
    print(f"  * Refresh Token Expire Days: {settings.REFRESH_TOKEN_EXPIRE_DAYS}")
    print(f"  * CORS Whitelisted Origins: {settings.CORS_ORIGINS}")
    print(f"  * Demo Mode Active: {getattr(settings, 'DEMO_MODE', True)}")

    db.close()
    print("\n" + "=" * 70)
    print("SYSTEM AUDIT COMPLETED SUCCESSFULLY")
    print("=" * 70)

if __name__ == "__main__":
    run_audit()
