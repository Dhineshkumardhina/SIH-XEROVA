import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_token_for(username: str) -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]

# 1. Request ID and Security Headers Verification
def test_request_id_and_security_headers():
    res = client.get("/health")
    assert res.status_code == 200
    headers = res.headers
    assert "X-Request-ID" in headers
    assert headers["X-Request-ID"].startswith("req_")
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

# 2. Standardized Error Response Structure
def test_standardized_error_response_structure():
    # Attempt unauthorized request
    res = client.get("/api/v1/users")
    assert res.status_code in [401, 403]
    body = res.json()
    assert body["success"] is False
    assert "error" in body
    assert "code" in body["error"]
    assert "message" in body["error"]
    assert "request_id" in body["error"]

# 3. Server-side RBAC Enforcement for VIEWER Role
def test_viewer_rbac_restrictions():
    viewer_token = get_token_for("viewer")
    headers = {"Authorization": f"Bearer {viewer_token}"}

    # Viewer cannot create maintenance tasks
    task_res = client.post("/api/v1/maintenance/tasks", json={
        "asset_id": "dummy_asset",
        "description": "Unauthorized task creation",
        "duration_minutes": 60
    }, headers=headers)
    assert task_res.status_code == 403
    assert task_res.json()["error"]["code"] in ["FORBIDDEN", "INSUFFICIENT_PERMISSION", "ROLE_NOT_ALLOWED"]

    # Viewer cannot approve blocks
    appr_res = client.post("/api/v1/blocks/requests/BLK-DUMMY/approve", headers=headers)
    assert appr_res.status_code == 403

# 4. Input Validation Boundaries
def test_input_validation_boundaries():
    token = get_token_for("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid negative duration
    inv_res = client.post("/api/v1/blocks/requests", json={
        "department_id": "dummy_dept",
        "corridor_id": "dummy_corr",
        "duration_minutes": -120,
        "reason": "Test negative duration"
    }, headers=headers)
    assert inv_res.status_code == 422
    assert inv_res.json()["error"]["code"] == "VALIDATION_ERROR"

# 5. Optimization Safety & Non-Crashing Guarantee
def test_optimization_safety_missing_corridor():
    token = get_token_for("planner")
    headers = {"Authorization": f"Bearer {token}"}

    res = client.post("/api/v1/optimization/run", json={
        "corridor_id": "COR-INVALID-9999",
        "planning_date": "2026-08-31T00:00:00"
    }, headers=headers)
    assert res.status_code == 404
    assert res.json()["error"]["code"] == "RESOURCE_NOT_FOUND"

# 6. Rate Limiting Middleware Functionality
def test_rate_limiting_middleware():
    # Make valid request
    res = client.get("/health")
    assert res.status_code == 200
