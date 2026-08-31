"""
Integration Tests: REST API CRUD & Business Endpoints
Verifies response contracts:
  {"success": true, "data": ..., "message": ...}
  {"success": false, "error": ...}
"""
import pytest

def test_assets_api_crud_and_contract(client, control_headers):
    """GET /api/v1/assets?page=1 follows the unified contract."""
    res = client.get("/api/v1/assets?page=1", headers=control_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "data" in data
    assert "items" in data["data"]

def test_maintenance_api_crud_and_contract(client, control_headers):
    """GET /api/v1/maintenance/tasks returns paginated maintenance tasks."""
    res = client.get("/api/v1/maintenance/tasks", headers=control_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "items" in data["data"]

def test_defects_api_crud_and_contract(client, control_headers):
    """GET /api/v1/defects returns open flaws and ultrasonic reports."""
    res = client.get("/api/v1/defects", headers=control_headers)
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True

def test_trains_and_corridors_api(client, control_headers):
    """GET /api/v1/trains and GET /api/v1/corridors returns operational infrastructure."""
    res_t = client.get("/api/v1/trains", headers=control_headers)
    assert res_t.status_code == 200
    assert res_t.json()["success"] is True

    res_c = client.get("/api/v1/corridors", headers=control_headers)
    assert res_c.status_code == 200
    assert res_c.json()["success"] is True

def test_block_requests_and_conflicts_api(client, control_headers):
    """GET /api/v1/blocks/requests and POST /api/v1/ai/conflict/evaluate."""
    res_b = client.get("/api/v1/blocks/requests", headers=control_headers)
    assert res_b.status_code == 200
    assert res_b.json()["success"] is True

def test_analytics_and_reports_api(client, control_headers):
    """GET /api/v1/analytics/dashboard and GET /api/v1/reports."""
    res_a = client.get("/api/v1/analytics/dashboard", headers=control_headers)
    assert res_a.status_code == 200
    assert res_a.json()["success"] is True

    res_r = client.get("/api/v1/reports", headers=control_headers)
    assert res_r.status_code == 200
    assert res_r.json()["success"] is True
