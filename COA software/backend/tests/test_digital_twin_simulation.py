import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.simulation.engine import simulation_engine
from app.simulation.scenario_manager import scenario_manager

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_scenario_manager_listing_and_loading():
    """TEST 1: Scenario listing and synthetic network loading"""
    scenarios = scenario_manager.list_scenarios()
    assert len(scenarios) >= 5
    assert any(s["scenario_id"] == "SHARED_BLOCK_OPTIMIZATION" for s in scenarios)

    state = scenario_manager.load_scenario("SHARED_BLOCK_OPTIMIZATION", plan_mode="AI_OPTIMIZED")
    assert len(state.network_stations) == 5
    assert len(state.track_segments) == 4
    assert len(state.trains) >= 4
    assert len(state.blocks) >= 1
    assert state.plan_mode == "AI_OPTIMIZED"


def test_simulation_engine_stepping_and_events():
    """TEST 2: Simulation clock progression, train movement, and block activation events"""
    sim_state = simulation_engine.create_simulation(
        scenario_id="SHARED_BLOCK_OPTIMIZATION",
        plan_mode="AI_OPTIMIZED"
    )
    sim_id = sim_state.simulation_id
    assert sim_state.simulation_time_str == "00:00"

    # Step forward 30 minutes (00:30)
    state_30m = simulation_engine.step(sim_id, delta_minutes=30)
    assert state_30m.simulation_time_str == "00:30"
    assert state_30m.metrics.active_trains >= 1
    assert any(e.event_type == "TRAIN_DEPARTURE" for e in state_30m.events)

    # Step forward to 01:30 (during active block 01:00-03:00)
    state_90m = simulation_engine.step(sim_id, delta_minutes=60)
    assert state_90m.simulation_time_str == "01:30"
    assert state_90m.metrics.active_blocks >= 1
    assert any(e.event_type == "BLOCK_STARTED" for e in state_90m.events)
    assert any(e.event_type == "MAINTENANCE_STARTED" for e in state_90m.events)


def test_simulation_pause_speed_and_reset():
    """TEST 3: Pause, speed multipliers, and reset"""
    sim_state = simulation_engine.create_simulation()
    sim_id = sim_state.simulation_id

    # Step and then pause
    simulation_engine.step(sim_id, delta_minutes=15)
    paused = simulation_engine.pause(sim_id)
    assert paused.status == "PAUSED"

    # Speed multiplier
    speed_state = simulation_engine.set_speed(sim_id, 5.0)
    assert speed_state.speed_multiplier == 5.0

    # Reset
    reset_state = simulation_engine.reset(sim_id)
    assert reset_state.simulation_time_str == "00:00"
    assert reset_state.metrics.active_trains == 0


def test_digital_twin_rest_api_endpoints():
    """TEST 4: Digital Twin REST API endpoints"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # GET /api/v1/simulation/predefined
    pre_res = client.get("/api/v1/simulation/predefined", headers=headers)
    assert pre_res.status_code == 200
    assert len(pre_res.json()["data"]) >= 5

    # GET /api/v1/simulation/scenarios
    sc_res = client.get("/api/v1/simulation/scenarios", headers=headers)
    assert sc_res.status_code == 200
    sc_body = sc_res.json()
    assert sc_body["success"] is True
    assert len(sc_body["data"]) >= 1

    # POST /api/v1/simulation/run
    run_res = client.post("/api/v1/simulation/run", json={
        "scenario_id": "SHARED_BLOCK_OPTIMIZATION",
        "plan_mode": "AI_OPTIMIZED"
    }, headers=headers)
    assert run_res.status_code == 200
    run_body = run_res.json()
    assert run_body["success"] is True
    sim_id = run_body["data"]["simulation_id"]

    # POST /api/v1/simulation/{id}/step
    step_res = client.post(f"/api/v1/simulation/{sim_id}/step", json={
        "delta_minutes": 10
    }, headers=headers)
    assert step_res.status_code == 200
    assert step_res.json()["data"]["simulation_time_str"] == "00:10"

    # GET /api/v1/simulation/{id}/events
    evt_res = client.get(f"/api/v1/simulation/{sim_id}/events", headers=headers)
    assert evt_res.status_code == 200
    assert isinstance(evt_res.json()["data"], list)

    # GET /api/v1/simulation/{id}/metrics
    met_res = client.get(f"/api/v1/simulation/{sim_id}/metrics", headers=headers)
    assert met_res.status_code == 200
    assert "active_trains" in met_res.json()["data"]
