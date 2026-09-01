import json
import os
from datetime import datetime
import pytest
from sqlalchemy.orm import Session

from app.optimization.block_optimizer import BlockOptimizer, OptimizationConfig
from app.models.corridor import Corridor
from app.models.asset import Asset
from app.models.maintenance import MaintenanceTask
from app.models.train import Train, TrainSchedule

# Import assertion utilities
from optimizer_assertions import (
    assert_no_prohibited_train_conflicts,
    assert_isolation_rules,
    assert_within_allowed_windows,
    assert_minimum_block_duration,
    assert_department_bundle_compatibility,
    assert_corridor_capacity,
)








# Directory containing scenario JSON files
SCENARIO_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "tests", "optimizer_scenarios")

def load_scenario(file_name: str) -> dict:
    with open(os.path.join(SCENARIO_DIR, file_name), "r", encoding="utf-8") as f:
        return json.load(f)

from app.models.station import Station
from app.models.department import Department

def populate_scenario(db_session: Session, scenario: dict, scenario_file: str = "scen") -> str:
    """Create DB objects for a given scenario and return the corridor id."""
    idx = SCENARIO_FILES.index(scenario_file) if scenario_file in SCENARIO_FILES else 0
    pfx = f"s{idx:02d}"

    # Ensure default stations and departments exist
    st1 = Station(id=f"st-{pfx}-01", code=f"S{idx:02d}A", name=f"Station {idx}A")
    st2 = Station(id=f"st-{pfx}-02", code=f"S{idx:02d}B", name=f"Station {idx}B")
    db_session.merge(st1)
    db_session.merge(st2)

    for i in range(1, 10):
        dep = Department(id=str(i), code=f"DEP-{i}", name=f"Department {i}")
        db_session.merge(dep)
    db_session.flush()

    # Create corridor(s)
    corridors = {}
    for c in scenario.get("corridors", []):
        cid = f"cor-{pfx}-{c.get('id')}"
        corridor = Corridor(
            id=cid,
            code=f"C{idx:02d}-{c.get('id')}",
            name=f"Corridor {c.get('id')}",
            start_station_id=st1.id,
            end_station_id=st2.id,
            track_count=c.get("capacity", 2),
        )
        db_session.merge(corridor)
        corridors[str(c["id"])] = cid
    db_session.flush()

    # Create assets linked to corridors if provided
    assets = {}
    for a in scenario.get("assets", []):
        aid = f"ast-{pfx}-{a.get('id')}"
        asset = Asset(
            id=aid,
            asset_code=f"A{idx:02d}-{a.get('id')}",
            name=f"Asset {a.get('id')}",
            asset_type=a.get("type", "TRACK"),
            department_id=str(a.get("department_id")) if a.get("department_id") else None,
            corridor_id=corridors.get(str(a.get("corridor_id"))),
            status=a.get("status", "ACTIVE"),
        )
        db_session.merge(asset)
        assets[str(a["id"])] = asset
    db_session.flush()

    # Create maintenance tasks
    for t in scenario.get("tasks", []):
        raw_aid = str(t.get("asset_id"))
        aid = f"ast-{pfx}-{raw_aid}" if raw_aid in assets else None
        dep_id = str(assets[raw_aid].department_id) if raw_aid in assets and assets[raw_aid].department_id else "1"
        task = MaintenanceTask(
            id=f"tsk-{pfx}-{t.get('id')}",
            task_code=f"T{idx:02d}-{t.get('id')}",
            description=f"Maintenance Task {t.get('id')}",
            asset_id=aid,
            department_id=dep_id,
            priority=t.get("priority", "MEDIUM"),
            duration_minutes=t.get("duration_minutes", 60),
            preferred_start_at=t.get("required_window_start"),
            preferred_end_at=t.get("required_window_end"),
            isolation_required=t.get("isolation_required", False),
            due_at=t.get("due_at"),
            status="PLANNED",
        )
        db_session.merge(task)
    db_session.flush()

    # Create trains and schedules
    for tr in scenario.get("trains", []):
        tr_id = f"trn-{pfx}-{tr.get('id')}"
        ttype = (tr.get("type") or "PASSENGER").upper()
        if ttype not in ["PASSENGER", "EXPRESS", "SUPERFAST", "GOODS", "SPECIAL", "MAINTENANCE"]:
            ttype = "PASSENGER"
        train = Train(
            id=tr_id,
            train_number=f"TR{idx:02d}-{tr.get('id')}",
            train_name=f"Train {tr.get('id')}",
            train_type=ttype,
        )
        db_session.merge(train)
        db_session.flush()
        for sidx, sched in enumerate(tr.get("schedule", [])):
            ts = TrainSchedule(
                id=f"sch-{pfx}-{tr.get('id')}-{sidx}",
                train_id=tr_id,
                corridor_id=corridors.get(str(sched.get("corridor_id"))),
                arrival_time=sched.get("start"),
                departure_time=sched.get("end"),
            )
            db_session.merge(ts)
    db_session.flush()

    # Return first corridor id for the optimizer
    first_corridor_id = next(iter(corridors.values()))
    return first_corridor_id

# List of scenario file names (ordered as per implementation plan)
SCENARIO_FILES = [
    "scenario_01_shared_maintenance.json",
    "scenario_02_train_conflict.json",
    "scenario_03_multi_dept.json",
    "scenario_04_high_goods_traffic.json",
    "scenario_05_no_window.json",
    "scenario_06_multiple_corridors.json",
    "scenario_07_overdue_critical.json",
    "scenario_08_isolation_conflict.json",
    "scenario_09_max_block_duration.json",
    "scenario_10_competing_high_priority.json",
]

@pytest.mark.parametrize("scenario_file", SCENARIO_FILES)
def test_optimizer_validation(db_session: Session, scenario_file: str):
    scenario = load_scenario(scenario_file)
    # Populate DB and obtain corridor id
    corridor_id = populate_scenario(db_session, scenario, scenario_file)
    # Planning date – use window start if provided, else today
    planning_date_str = scenario.get("parameters", {}).get("window_start")
    planning_date = datetime.fromisoformat(planning_date_str) if planning_date_str else datetime.utcnow()

    # Run optimizer – using default config
    outcome = BlockOptimizer.run_optimization(
        db=db_session,
        corridor_id=str(corridor_id),
        planning_date=planning_date,
        config=OptimizationConfig(),
        user_id="test_user",
    )

    # Determine expected feasibility
    if outcome.status in ("INFEASIBLE", "NO_FEASIBLE_PLAN"):
        # Expect that no blocks were generated and unscheduled contains all tasks
        assert len(outcome.blocks) == 0
        assert len(outcome.unscheduled_tasks) == len(scenario.get("tasks", []))
        return

    # Otherwise, we have a feasible or optimal plan – run hard‑constraint checks if blocks are scheduled
    if outcome.blocks:
        assert_no_prohibited_train_conflicts(outcome.blocks, db_session)
        assert_isolation_rules(outcome.blocks)
        assert_within_allowed_windows(outcome.blocks, scenario)
        assert_minimum_block_duration(outcome.blocks, scenario)
        assert_department_bundle_compatibility(outcome.blocks)
        assert_corridor_capacity(outcome.blocks, scenario)
    else:
        assert outcome.status in ("OPTIMAL", "FEASIBLE", "INFEASIBLE", "NO_FEASIBLE_PLAN")
