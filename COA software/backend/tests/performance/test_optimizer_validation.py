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

@pytest.fixture(scope="function")
def populate_scenario(db_session: Session, scenario: dict):
    """Create DB objects for a given scenario and yield the corridor id.
    The fixture cleans up by rolling back the transaction after the test.
    """
    # Create corridor(s)
    corridors = {}
    for c in scenario.get("corridors", []):
        corridor = Corridor(
            id=c.get("id"),
            code=f"COR-{c.get('id')}",
            name=f"Corridor {c.get('id')}",
            capacity=c.get("capacity", 1),
        )
        db_session.add(corridor)
        corridors[c["id"]] = corridor
    db_session.flush()

    # Create assets linked to corridors if provided
    assets = {}
    for a in scenario.get("assets", []):
        asset = Asset(
            id=a.get("id"),
            asset_code=f"ASSET-{a.get('id')}",
            department_id=a.get("department_id"),
            corridor_id=a.get("corridor_id"),
            status=a.get("status", "ACTIVE"),
        )
        db_session.add(asset)
        assets[a["id"]] = asset
    db_session.flush()

    # Create maintenance tasks
    for t in scenario.get("tasks", []):
        task = MaintenanceTask(
            id=t.get("id"),
            asset_id=t.get("asset_id"),
            priority=t.get("priority", "MEDIUM"),
            duration_minutes=t.get("duration_minutes", 60),
            required_window_start=t.get("required_window_start"),
            required_window_end=t.get("required_window_end"),
            isolation_required=t.get("isolation_required", False),
            due_at=t.get("due_at"),
        )
        db_session.add(task)
    db_session.flush()

    # Create trains and schedules
    for tr in scenario.get("trains", []):
        train = Train(
            id=tr.get("id"),
            type=tr.get("type", "PASSENGER"),
        )
        db_session.add(train)
        db_session.flush()
        for sched in tr.get("schedule", []):
            ts = TrainSchedule(
                train_id=train.id,
                corridor_id=sched.get("corridor_id"),
                start_time=sched.get("start"),
                end_time=sched.get("end"),
            )
            db_session.add(ts)
    db_session.flush()

    # Return first corridor id for the optimizer
    first_corridor_id = next(iter(corridors))
    yield first_corridor_id
    # Cleanup via rollback handled by the calling fixture

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
    for corridor_id in populate_scenario(db_session, scenario):
        pass  # fixture yields once
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

    # Otherwise, we have a feasible plan – run hard‑constraint checks
    assert outcome.blocks, "Optimizer returned feasible status but no blocks were produced"
    # Flatten block list for assertions
    assert_no_prohibited_train_conflicts(outcome.blocks, db_session)
    assert_isolation_rules(outcome.blocks)
    assert_within_allowed_windows(outcome.blocks, scenario)
    assert_minimum_block_duration(outcome.blocks, scenario)
    assert_department_bundle_compatibility(outcome.blocks)
    assert_corridor_capacity(outcome.blocks, scenario)
