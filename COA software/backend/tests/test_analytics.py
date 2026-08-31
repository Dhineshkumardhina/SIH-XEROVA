import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.corridor import Corridor

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_dashboard_analytics_api():
    """TEST 1: Executive Dashboard Analytics API and Dynamic KPI calculations"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/analytics/dashboard", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    data = body["data"]

    # Asset Availability
    assert "asset_availability" in data
    assert "availability_pct" in data["asset_availability"]
    assert 0.0 <= data["asset_availability"]["availability_pct"] <= 100.0

    # Block Utilization
    assert "block_utilization" in data
    assert "utilization_pct" in data["block_utilization"]

    # Maintenance
    assert "maintenance" in data
    assert "total_tasks" in data["maintenance"]
    assert "completion_rate_pct" in data["maintenance"]

    # Shared blocks
    assert "shared_blocks" in data
    assert data["shared_blocks"]["total_shared_blocks"] >= 0

    # AI Insights
    assert "insights" in data
    assert isinstance(data["insights"], list)


def test_asset_analytics_api_and_filters():
    """TEST 2: Asset Reliability & Degradation Analytics with Department Filtering"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # Unfiltered
    res = client.get("/api/v1/analytics/assets", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert "kpis" in data
    assert data["kpis"]["total_assets"] > 0
    assert "health_distribution" in data
    assert len(data["health_distribution"]) == 5
    assert "department_analytics" in data
    assert len(data["department_analytics"]) >= 3
    assert "critical_assets" in data

    # Filtered by department ENG
    res_eng = client.get("/api/v1/analytics/assets?department=ENG", headers=headers)
    assert res_eng.status_code == 200
    assert res_eng.json()["success"] is True


def test_maintenance_analytics_and_overdue_table():
    """TEST 3: Maintenance Workload Analytics & Overdue Intelligence Table"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/analytics/maintenance", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert "kpis" in data
    assert data["kpis"]["total_tasks"] > 0
    assert "status_distribution" in data
    assert "priority_distribution" in data
    assert "workload_by_department" in data
    assert "overdue_table" in data


def test_block_and_shared_coordination_analytics():
    """TEST 4: Block Utilization, Duration Analysis & Shared Multi-Dept Coordination"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/v1/analytics/blocks", headers=headers)
    assert res.status_code == 200
    data = res.json()["data"]

    assert "kpis" in data
    assert "duration_analysis" in data
    assert data["duration_analysis"]["avg_duration_minutes"] > 0
    assert "shared_blocks_summary" in data
    assert data["shared_blocks_summary"]["downtime_reduction_pct"] > 0
    assert "before_vs_after" in data
    assert "savings" in data["before_vs_after"]


def test_train_impact_and_corridor_risk_analytics():
    """TEST 5: Train Impact Delay Breakdown & Corridor Risk Ranking Formula"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # Train Impact
    t_res = client.get("/api/v1/analytics/train-impact", headers=headers)
    assert t_res.status_code == 200
    t_data = t_res.json()["data"]
    assert "kpis" in t_data
    assert "impact_by_type" in t_data
    assert len(t_data["impact_by_type"]) >= 3

    # Corridor Performance & Risk Ranking
    c_res = client.get("/api/v1/analytics/corridors", headers=headers)
    assert c_res.status_code == 200
    c_data = c_res.json()["data"]
    assert "formula" in c_data
    assert "corridors" in c_data
    assert len(c_data["corridors"]) >= 1

    # Trends
    tr_res = client.get("/api/v1/analytics/trends?metric=availability&days=7", headers=headers)
    assert tr_res.status_code == 200
    assert len(tr_res.json()["data"]["data"]) == 8
