import time
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import create_access_token
from app.simulation.engine import SimulationEngine

@pytest.fixture(scope="module")
def auth_headers():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        roles = [r.code for r in user.roles] if hasattr(user, "roles") and user.roles else ["SUPER_ADMIN"]
        token = create_access_token(subject=user.id, email=user.email, roles=roles)
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_dashboard_performance_threshold(client, auth_headers):
    """Verify dashboard loads in <2.0 seconds."""
    t0 = time.perf_counter()
    res = client.get("/api/v1/analytics/dashboard", headers=auth_headers)
    t1 = time.perf_counter()
    duration_ms = (t1 - t0) * 1000.0

    assert res.status_code == 200
    assert duration_ms < 2000.0, f"Dashboard load took {duration_ms:.2f}ms (> 2000ms target)"

def test_crud_api_performance_threshold(client, auth_headers):
    """Verify standard CRUD APIs load in <500ms under standard demo load."""
    crud_endpoints = [
        "/api/v1/assets",
        "/api/v1/maintenance/tasks",
        "/api/v1/defects",
        "/api/v1/trains",
        "/api/v1/corridors",
        "/api/v1/blocks/requests"
    ]

    for url in crud_endpoints:
        t0 = time.perf_counter()
        res = client.get(url, headers=auth_headers)
        t1 = time.perf_counter()
        duration_ms = (t1 - t0) * 1000.0

        assert res.status_code == 200, f"Failed on {url}"
        assert duration_ms < 500.0, f"CRUD endpoint {url} took {duration_ms:.2f}ms (> 500ms target)"

def get_items(res_json):
    if isinstance(res_json, list): return res_json
    if not isinstance(res_json, dict): return []
    data = res_json.get("data", [])
    if isinstance(data, list): return data
    if isinstance(data, dict): return data.get("items", [])
    return []

def test_optimization_performance_threshold(client, auth_headers):
    """Verify OR-Tools CP-SAT optimization solves in <5.0 seconds for standard SIH scenario."""
    corrs_res = client.get("/api/v1/corridors", headers=auth_headers).json()
    items = get_items(corrs_res)
    corridor_id = items[0]["id"] if items else "CORR-001"

    t0 = time.perf_counter()
    res = client.post("/api/v1/optimization/run", headers=auth_headers, json={
        "corridor_id": corridor_id,
        "planning_date": "2026-09-01T00:00:00",
        "time_horizon_hours": 24,
        "max_block_duration_minutes": 240,
        "allow_department_bundling": True
    })
    t1 = time.perf_counter()
    duration_ms = (t1 - t0) * 1000.0

    assert res.status_code in [200, 201]
    assert duration_ms < 5000.0, f"Optimization took {duration_ms:.2f}ms (> 5000ms target)"

def test_simulation_tick_performance_threshold():
    """Verify Digital Twin simulation ticks execute in <100ms."""
    engine = SimulationEngine()
    sim_state = engine.create_simulation()

    t0 = time.perf_counter()
    updated_state = engine.step(sim_state.simulation_id, delta_minutes=15)
    t1 = time.perf_counter()
    duration_ms = (t1 - t0) * 1000.0

    assert updated_state.status in ["RUNNING", "COMPLETED"]
    assert duration_ms < 100.0, f"Simulation tick took {duration_ms:.2f}ms (> 100ms target)"
