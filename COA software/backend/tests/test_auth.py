import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.models.role import Role
from app.models.permission import Permission
from app.models.block import BlockPlan
from app.models.refresh_token import RefreshToken
from app.models.audit import AuditLog
from app.core.security import hash_password

client = TestClient(app)

DEMO_PWD = "RailoptDemo@2026"

def login_user(username: str, password: str = DEMO_PWD):
    return client.post("/api/v1/auth/login", json={
        "username": username,
        "password": password
    })

def test_case_1_valid_control_officer_login():
    """CASE 1: Valid control officer login returns 200, access token, refresh token, user data."""
    res = login_user("control")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    assert data["data"]["token_type"] == "bearer"
    assert data["data"]["expires_in"] == 15 * 60

    user_info = data["data"]["user"]
    assert user_info["username"] == "control"
    assert "CONTROL_OFFICER" in user_info["roles"]
    assert user_info["is_active"] is True
    assert "password_hash" not in user_info
    assert "password" not in user_info

def test_case_2_invalid_password():
    """CASE 2: Invalid password returns 401 with generic error."""
    res = login_user("control", "WrongPassword!999")
    assert res.status_code == 401
    data = res.json()
    assert data["detail"]["code"] == "INVALID_CREDENTIALS"

def test_case_3_viewer_attempts_block_approval():
    """CASE 3: Viewer attempts block approval and is rejected with 403 INSUFFICIENT_PERMISSION."""
    # Login as viewer
    login_res = login_user("viewer")
    viewer_token = login_res.json()["data"]["access_token"]

    # Fetch a block plan
    plan_res = client.get(
        "/api/v1/blocks",
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    plans = plan_res.json()
    if isinstance(plans, dict) and "data" in plans:
        plans = plans["data"]
    assert len(plans) > 0
    plan_id = plans[0]["id"]

    # Attempt approve with viewer token
    approve_res = client.patch(
        f"/api/v1/blocks/{plan_id}/approve",
        headers={"Authorization": f"Bearer {viewer_token}"}
    )
    assert approve_res.status_code == 403
    assert approve_res.json()["detail"]["code"] == "INSUFFICIENT_PERMISSION"

def test_case_4_engineering_officer_accesses_data():
    """CASE 4: Engineering officer accesses dashboard and asset endpoints."""
    login_res = login_user("engineering")
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]

    res = client.get("/api/v1/assets", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_case_5_engineering_officer_attempts_restricted_admin_endpoint():
    """CASE 5: Engineering officer attempts admin user listing without USER_VIEW."""
    login_res = login_user("engineering")
    token = login_res.json()["data"]["access_token"]

    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403
    assert res.json()["detail"]["code"] == "INSUFFICIENT_PERMISSION"

def test_case_6_inactive_user_login():
    """CASE 6: Inactive user login is rejected with 403 ACCOUNT_DISABLED."""
    db = SessionLocal()
    try:
        inactive_uid = f"inactive_{uuid.uuid4().hex[:6]}"
        user = User(
            username=inactive_uid,
            email=f"{inactive_uid}@railopt.demo",
            full_name="Inactive User",
            password_hash=hash_password(DEMO_PWD),
            is_active=False
        )
        db.add(user)
        db.commit()
    finally:
        db.close()

    res = login_user(inactive_uid)
    assert res.status_code == 403
    assert res.json()["detail"]["code"] == "ACCOUNT_DISABLED"

def test_case_7_account_lockout_after_five_failed_logins():
    """CASE 7: Five consecutive failed logins triggers account lockout (403)."""
    db = SessionLocal()
    try:
        lock_uid = f"lockuser_{uuid.uuid4().hex[:6]}"
        user = User(
            username=lock_uid,
            email=f"{lock_uid}@railopt.demo",
            full_name="Lockout Test User",
            password_hash=hash_password(DEMO_PWD),
            is_active=True,
            is_locked=False,
            failed_login_attempts=0
        )
        db.add(user)
        db.commit()
    finally:
        db.close()

    # Attempt 4 failed logins -> each returns 401
    for _ in range(4):
        res = login_user(lock_uid, "BadPassword")
        assert res.status_code == 401

    # 5th attempt locks the account -> returns 403 ACCOUNT_LOCKED
    res_5 = login_user(lock_uid, "BadPassword")
    assert res_5.status_code == 403
    assert res_5.json()["detail"]["code"] == "ACCOUNT_LOCKED"

    # Even with correct password, login is blocked while locked
    res_locked = login_user(lock_uid, DEMO_PWD)
    assert res_locked.status_code == 403
    assert res_locked.json()["detail"]["code"] == "ACCOUNT_LOCKED"

def test_case_8_valid_refresh_token_rotation():
    """CASE 8: Valid refresh token issues new access token & rotates refresh token."""
    login_res = login_user("planner")
    assert login_res.status_code == 200
    old_refresh = login_res.json()["data"]["refresh_token"]

    # Refresh
    refresh_res = client.post("/api/v1/auth/refresh", json={"refresh_token": old_refresh})
    assert refresh_res.status_code == 200
    data = refresh_res.json()
    assert data["success"] is True
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]
    new_refresh = data["data"]["refresh_token"]
    assert new_refresh != old_refresh

def test_case_9_revoked_refresh_token_rejected():
    """CASE 9: Revoked (already rotated) refresh token is rejected with 401."""
    login_res = login_user("supervisor")
    assert login_res.status_code == 200
    refresh_tok = login_res.json()["data"]["refresh_token"]

    # First rotation succeeds
    client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})

    # Second attempt with same token fails because it was revoked
    res_reuse = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert res_reuse.status_code == 401
    assert res_reuse.json()["detail"]["code"] == "INVALID_REFRESH_TOKEN"

def test_case_10_password_change_revokes_refresh_tokens():
    """CASE 10: Password change revokes all active refresh tokens for the user."""
    db = SessionLocal()
    try:
        pw_uid = f"pwuser_{uuid.uuid4().hex[:6]}"
        user = User(
            username=pw_uid,
            email=f"{pw_uid}@railopt.demo",
            full_name="Password Change Test User",
            password_hash=hash_password("InitialPwd@123"),
            is_active=True
        )
        db.add(user)
        db.commit()
    finally:
        db.close()

    # Login to obtain tokens
    login_res = client.post("/api/v1/auth/login", json={
        "username": pw_uid,
        "password": "InitialPwd@123"
    })
    access_tok = login_res.json()["data"]["access_token"]
    refresh_tok = login_res.json()["data"]["refresh_token"]

    # Change password
    change_res = client.post(
        "/api/v1/auth/change-password",
        json={
            "current_password": "InitialPwd@123",
            "new_password": "NewSecretPwd@456"
        },
        headers={"Authorization": f"Bearer {access_tok}"}
    )
    assert change_res.status_code == 200

    # Old refresh token must be revoked
    rev_res = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_tok})
    assert rev_res.status_code == 401

    # Login with new password succeeds
    login_new = client.post("/api/v1/auth/login", json={
        "username": pw_uid,
        "password": "NewSecretPwd@456"
    })
    assert login_new.status_code == 200

def test_auth_me_endpoint():
    """Verify GET /api/v1/auth/me returns permissions, roles, and user details."""
    login_res = login_user("control")
    token = login_res.json()["data"]["access_token"]

    me_res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    user_data = me_res.json()["data"]
    assert user_data["username"] == "control"
    assert "CONTROL_OFFICER" in user_data["roles"]
    assert "BLOCK_APPROVE" in user_data["permissions"]
    assert "password_hash" not in user_data

def test_admin_user_management_and_unlock():
    """Verify Super Admin can list users, create a user, and unlock a locked account."""
    admin_login = login_user("admin")
    admin_token = admin_login.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # List users
    users_res = client.get("/api/v1/users", headers=headers)
    assert users_res.status_code == 200
    assert len(users_res.json()["data"]) >= 9

    # Create new user
    new_username = f"test_{uuid.uuid4().hex[:6]}"
    create_res = client.post("/api/v1/users", json={
        "username": new_username,
        "email": f"{new_username}@railopt.demo",
        "full_name": "Test Inspector",
        "password": "RailoptDemo@2026",
        "role_codes": ["VIEWER"]
    }, headers=headers)
    assert create_res.status_code == 201
    created_id = create_res.json()["data"]["id"]

    # Deactivate and unlock
    deact_res = client.post(f"/api/v1/users/{created_id}/deactivate", headers=headers)
    assert deact_res.status_code == 200
    assert deact_res.json()["data"]["is_active"] is False

    act_res = client.post(f"/api/v1/users/{created_id}/activate", headers=headers)
    assert act_res.status_code == 200
    assert act_res.json()["data"]["is_active"] is True

    unlock_res = client.post(f"/api/v1/users/{created_id}/unlock", headers=headers)
    assert unlock_res.status_code == 200
    assert unlock_res.json()["data"]["is_locked"] is False
