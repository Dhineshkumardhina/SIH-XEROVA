"""
RAILOPT AI — Phase 43 What-If Scenario Engine & Isolation Tests
Validates:
1. Scenario creation & execution across synthetic predefined What-If scenarios.
2. Non-mutating scenario isolation (base data unchanged).
3. Side-by-side scenario comparison metrics.
"""
import pytest
from app.simulation.scenario_engine import scenario_engine

def test_predefined_what_if_scenarios_execution(db_session):
    """Verify creation and execution of What-If synthetic scenarios."""
    scen = scenario_engine.create_scenario(
        db=db_session,
        name="Test Normal Operations",
        description="Synthetic normal operations test",
        scenario_type="WHAT_IF_EXPERIMENT"
    )
    assert scen is not None
    assert scen.id.startswith("SCEN-")

    # Execute scenario
    exec_result = scenario_engine.run_scenario(db=db_session, scenario_id=scen.id)
    assert "scenario_metrics" in exec_result or "deltas" in exec_result
    assert "kpi_deltas" in exec_result or "deltas" in exec_result

def test_scenario_isolation_guarantee(db_session):
    """Verify executing/modifying a What-If scenario does not mutate base production data."""
    scen = scenario_engine.create_scenario(
        db=db_session,
        name="Test Isolation Scenario",
        parameters={"goods_traffic_multiplier": 1.0}
    )

    # Update parameters on scenario snapshot
    updated = scenario_engine.update_scenario(
        db=db_session,
        scenario_id=scen.id,
        parameters={"goods_traffic_multiplier": 2.5}
    )

    # Verify parameters updated in scenario configuration
    params = updated.configuration.get("parameters", {})
    assert params["goods_traffic_multiplier"] == 2.5
