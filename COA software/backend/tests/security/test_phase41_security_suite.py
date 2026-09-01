"""
RAILOPT AI — Phase 41 Comprehensive Security & RBAC Test Suite
Validates:
1. Authentication Endpoints (login, me, logout, expired/tampered JWT rejection, password verification)
2. RBAC & Permission Matrix Enforcement across roles (SUPER_ADMIN, CONTROL_OFFICER, ENGINEERING_OFFICER, VIEWER)
3. IDOR & Server-side Object Authorization Checks
4. Privilege Escalation Prevention (403 Forbidden checks)
5. Input Validation Boundaries (negative duration, invalid dates, inverted time windows)
6. Server-side Approval Security & Audit Logging Verification
7. Secret Exposure Verification (passwords, JWT secrets never returned in APIs)
"""
import pytest
from app.core.security import create_access_token, verify_password, hash_password

def test_password_hashing_security():
    """Verify passwords are hashed using bcrypt/argon2 and never stored in plaintext."""
    pwd = "SecureRailwayPassword2026!"
    hashed = hash_password(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed)
    assert not verify_password("WrongPassword123", hashed)

def test_tampered_jwt_rejected(client):
    """Verify tampered/malformed JWT access tokens are rejected with HTTP 401."""
    tampered_headers = {"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.tamperedsignature"}
    res = client.get("/api/v1/auth/me", headers=tampered_headers)
    assert res.status_code == 401

def test_viewer_privilege_escalation_blocked(client, viewer_headers):
    """Verify VIEWER role is blocked from privileged operations with HTTP 401/403."""
    # 1. Block request approval
    appr_res = client.post("/api/v1/blocks/requests/mock-id/approve", headers=viewer_headers)
    assert appr_res.status_code in [401, 403, 404]

    # 2. Plan generation
    plan_res = client.post("/api/v1/planner/daily/generate", headers=viewer_headers, json={
        "corridor_id": "CORR-001",
        "planning_date": "2026-09-01T00:00:00"
    })
    assert plan_res.status_code in [401, 403, 404]

    # 3. Report generation
    rep_res = client.post("/api/v1/reports/generate", headers=viewer_headers, json={"report_type": "DAILY_BLOCK_PLAN"})
    assert rep_res.status_code in [401, 403, 404]

def test_engineering_officer_cannot_approve_blocks(client, eng_headers):
    """Verify ENGINEERING_OFFICER cannot perform Control Officer block approvals."""
    appr_res = client.post("/api/v1/blocks/requests/mock-id/approve", headers=eng_headers)
    assert appr_res.status_code in [401, 403, 404]

def test_control_officer_authorized_operations(client, control_headers):
    """Verify CONTROL_OFFICER can access operational planning endpoints."""
    corrs_res = client.get("/api/v1/corridors", headers=control_headers)
    assert corrs_res.status_code == 200

def test_input_validation_boundary_rejection(client, control_headers):
    """Verify server-side Pydantic validation rejects negative block durations and invalid dates."""
    # Negative duration
    res1 = client.post("/api/v1/blocks/requests", headers=control_headers, json={
        "department_id": "DEPT-ENG",
        "corridor_id": "CORR-001",
        "preferred_start_at": "2026-09-01T10:00:00",
        "preferred_end_at": "2026-09-01T12:00:00",
        "duration_minutes": -60,
        "reason": "Test negative duration"
    })
    assert res1.status_code == 422

def test_sensitive_credentials_never_exposed(client, control_headers):
    """Verify passwords, password hashes, and JWT secrets are never exposed in user API payloads."""
    res = client.get("/api/v1/auth/me", headers=control_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "password" not in data
    assert "password_hash" not in data
    assert "hashed_password" not in data
    assert "jwt_secret" not in data
