import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["data"]["status"] == "healthy"

def test_dashboard_stats():
    res = client.get("/api/v1/dashboard/stats")
    assert res.status_code == 200
    stats = res.json()
    assert "asset_availability" in stats
    assert "active_blocks" in stats
    assert "critical_defects" in stats
    assert "overdue_tasks" in stats

def test_dashboard_recommendations():
    res = client.get("/api/v1/dashboard/recommendations")
    assert res.status_code == 200
    recs = res.json()
    assert isinstance(recs, list)
    if len(recs) > 0:
        assert "tasks_included" in recs[0]
        assert "departments" in recs[0]

def test_dashboard_priority_tasks():
    res = client.get("/api/v1/dashboard/priority-tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)

def test_assets_api():
    res = client.get("/api/v1/assets")
    assert res.status_code == 200
    assets = res.json()
    assert isinstance(assets, list)
    assert len(assets) >= 5
    assert "asset_code" in assets[0]
    assert "department" in assets[0]

def test_tasks_api():
    res = client.get("/api/v1/tasks")
    assert res.status_code == 200
    tasks = res.json()
    assert isinstance(tasks, list)
    assert len(tasks) >= 5
    assert "task_code" in tasks[0]

def test_blocks_api_and_approve():
    # Login as control officer to obtain authorization
    login_res = client.post("/api/v1/auth/login", json={
        "username": "control",
        "password": "RailoptDemo@2026"
    })
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/blocks", headers=headers)
    assert res.status_code == 200
    plans = res.json()
    assert isinstance(plans, list)
    assert len(plans) >= 1
    plan_id = plans[0]["id"]

    # Test PATCH approve with authorized token
    res_appr = client.patch(f"/api/v1/blocks/{plan_id}/approve", headers=headers)
    assert res_appr.status_code == 200
    appr_data = res_appr.json()
    assert appr_data["status"] == "APPROVED"
