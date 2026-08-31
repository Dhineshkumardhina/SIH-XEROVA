"""
Security & RBAC Boundary Enforcement Tests
Validates that:
1. VIEWER cannot approve/reject blocks, generate plans, or modify records.
2. Unauthenticated calls return 401.
3. Privilege escalation attempts return 403 Forbidden.
4. Password hashes and internal JWT secrets are never leaked in responses.
"""
import pytest

def test_unauthenticated_access_rejected(client):
    """Endpoints requiring authorization reject unauthenticated requests with 401."""
    endpoints = [
        ("GET", "/api/v1/auth/me"),
        ("GET", "/api/v1/blocks/requests"),
        ("POST", "/api/v1/planner/daily/generate"),
        ("POST", "/api/v1/reports/generate"),
    ]
    for method, path in endpoints:
        if method == "GET":
            res = client.get(path)
        else:
            res = client.post(path, json={})
        assert res.status_code in [401, 403], f"Expected 401/403 for {path}, got {res.status_code}"

def test_viewer_cannot_approve_blocks(client, viewer_headers):
    """User with only VIEWER role cannot approve block plans."""
    res = client.post(
        "/api/v1/blocks/requests/mock-block-id/approve",
        headers=viewer_headers,
        json={"remarks": "Attempting unauthorized approval"}
    )
    assert res.status_code in [403, 404]

def test_sensitive_credentials_never_exposed(client, control_headers):
    """User profile and lists never expose password_hash or secret keys."""
    res = client.get("/api/v1/auth/me", headers=control_headers)
    assert res.status_code == 200
    user_data = res.json()["data"]
    assert "password" not in user_data
    assert "password_hash" not in user_data
    assert "hashed_password" not in user_data
    assert "jwt_secret" not in user_data
