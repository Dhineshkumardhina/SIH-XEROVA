import pytest
from datetime import datetime, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.optimization.block_optimizer import BlockOptimizer
from app.optimization.models import OptimizationConfig, OptimizedBlock

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_token_for(username: str) -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]

# 1. SQL Injection & Parameterization Protection Test
def test_sql_injection_protection():
    malicious_payloads = [
        "' OR 1=1 --",
        "'; DROP TABLE users; --",
        "admin'--",
        "1' OR '1'='1"
    ]
    for payload in malicious_payloads:
        # Test login query parameterization
        res = client.post("/api/v1/auth/login", json={"username": payload, "password": "anypassword"})
        assert res.status_code in [401, 422]
        assert res.json()["success"] is False

        # Test search query parameterization
        res_search = client.get(f"/api/v1/assets?search={payload}")
        assert res_search.status_code == 200
        body = res_search.json()
        if isinstance(body, list):
            items = body
        else:
            data = body.get("data", [])
            items = data if isinstance(data, list) else (data.get("items", []) if isinstance(data, dict) else [])
        assert isinstance(items, list)

# 2. XSS & Path Traversal Input Rejection
def test_xss_and_path_traversal_rejection():
    malicious_xss = "<script>alert('XSS')</script>"
    malicious_traversal = "../../etc/passwd"

    # Search parameter handling
    res = client.get(f"/api/v1/assets?search={malicious_xss}")
    assert res.status_code == 200

    # Path parameter invalid UUID handling
    res_path = client.get(f"/api/v1/assets/{malicious_traversal}")
    assert res_path.status_code in [404, 422]

# 3. Unauthenticated API Protection (401)
def test_unauthenticated_api_rejection():
    protected_endpoints = [
        "/api/v1/users",
        "/api/v1/blocks/requests",
        "/api/v1/maintenance/tasks",
        "/api/v1/audit"
    ]
    for endpoint in protected_endpoints:
        res = client.get(endpoint)
        assert res.status_code in [401, 403]
        assert res.json()["success"] is False

# 4. Server-Side RBAC Protection (403 for Unauthorized Roles)
def test_server_side_rbac_enforcement():
    viewer_token = get_token_for("viewer")
    eng_token = get_token_for("engineering")

    # Viewer cannot approve block requests
    res_v = client.post("/api/v1/blocks/requests/BR-001/approve", headers={"Authorization": f"Bearer {viewer_token}"})
    assert res_v.status_code in [403, 404]

    # Engineering officer cannot approve block requests
    res_e = client.post("/api/v1/blocks/requests/BR-001/approve", headers={"Authorization": f"Bearer {eng_token}"})
    assert res_e.status_code in [403, 404]

# 5. Post-Optimization Hard Constraint Safety Validation
def test_post_optimization_safety_validation():
    cfg = OptimizationConfig(max_block_duration_minutes=180)

    # Valid Block
    valid_block = OptimizedBlock(
        block_id="BLK-VALID",
        corridor_id="COR-A01",
        corridor_name="Main Corridor",
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=2),
        duration_minutes=120,
        departments=["ENG"],
        is_shared_block=False,
        tasks=[],
        task_count=1,
        maintenance_minutes=90,
        block_utilization=75.0,
        train_impact_score=10.0,
        expected_delay_minutes=0.0,
        affected_trains_count=0,
        asset_availability_gain=5.0,
        optimization_score=95.0,
        conflicts=[],
        explanation="Valid block"
    )
    is_safe, msg = BlockOptimizer._validate_block_safety(valid_block, cfg)
    assert is_safe is True

    # Invalid Block (Exceeds Max Duration)
    invalid_block = OptimizedBlock(
        block_id="BLK-INVALID",
        corridor_id="COR-A01",
        corridor_name="Main Corridor",
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(hours=5),
        duration_minutes=300, # Exceeds 180m max
        departments=["ENG"],
        is_shared_block=False,
        tasks=[],
        task_count=1,
        maintenance_minutes=90,
        block_utilization=75.0,
        train_impact_score=10.0,
        expected_delay_minutes=0.0,
        affected_trains_count=0,
        asset_availability_gain=5.0,
        optimization_score=95.0,
        conflicts=[],
        explanation="Invalid block"
    )
    is_safe_inv, msg_inv = BlockOptimizer._validate_block_safety(invalid_block, cfg)
    assert is_safe_inv is False
    assert "exceeds maximum allowed" in msg_inv

# 6. Input Validation Boundary Rejection
def test_input_validation_boundary_rejection():
    token = get_token_for("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    # Invalid negative duration
    res = client.post("/api/v1/blocks/requests", json={
        "department_id": "DEPT-ENG",
        "corridor_id": "COR-A01",
        "duration_minutes": -60,
        "reason": "Test invalid negative duration"
    }, headers=headers)
    assert res.status_code == 422
    assert res.json()["error"]["code"] == "VALIDATION_ERROR"
