import pytest
from datetime import datetime, timezone, timedelta
from jose import jwt
from fastapi.testclient import TestClient
from app.main import app
from app.core.config import settings
from app.core.security import hash_password, create_access_token

client = TestClient(app)

# Helper function to generate test tokens
def create_test_jwt(sub: str, email: str, roles: list[str], exp_delta: timedelta = None, secret: str = None, alg: str = "HS256") -> str:
    now = datetime.now(timezone.utc)
    exp = now + (exp_delta if exp_delta else timedelta(minutes=15))
    payload = {
        "sub": sub,
        "email": email,
        "roles": roles,
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(exp.timestamp())
    }
    return jwt.encode(payload, secret or settings.JWT_SECRET, algorithm=alg)


class TestAuthenticationSecurity:
    """Audit Phase 5: Authentication & JWT Security Verification"""

    def test_wrong_password_rejected(self):
        res = client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"identifier": "control", "password": "WrongPassword123!"}
        )
        assert res.status_code == 401
        assert "access_token" not in res.json()

    def test_empty_credentials_rejected(self):
        res = client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"identifier": "", "password": ""}
        )
        assert res.status_code in [400, 401, 422]

    def test_tampered_jwt_signature_rejected(self):
        tampered_token = create_test_jwt(
            sub="usr-control-01",
            email="control@railopt.gov.in",
            roles=["CONTROL_OFFICER"],
            secret="malicious_wrong_secret_key_9999"
        )
        res = client.get(
            f"{settings.API_V1_STR}/auth/me",
            headers={"Authorization": f"Bearer {tampered_token}"}
        )
        assert res.status_code == 401

    def test_expired_jwt_token_rejected(self):
        expired_token = create_test_jwt(
            sub="usr-control-01",
            email="control@railopt.gov.in",
            roles=["CONTROL_OFFICER"],
            exp_delta=timedelta(minutes=-30)
        )
        res = client.get(
            f"{settings.API_V1_STR}/auth/me",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert res.status_code == 401

    def test_malformed_authorization_header(self):
        for bad_header in ["Bearer", "Basic xyz", "Bearer invalid.token.value", "Token 123"]:
            res = client.get(
                f"{settings.API_V1_STR}/auth/me",
                headers={"Authorization": bad_header}
            )
            assert res.status_code == 401


class TestRBACPrivilegeEscalation:
    """Audit Phase 6: Server-Side RBAC Enforcement Verification"""

    def test_viewer_cannot_approve_blocks(self):
        viewer_token = create_test_jwt(
            sub="usr-viewer-01",
            email="viewer@railopt.gov.in",
            roles=["VIEWER"]
        )
        res = client.post(
            f"{settings.API_V1_STR}/blocks/requests/BLK-REQ-TEST-01/approve",
            headers={"Authorization": f"Bearer {viewer_token}"},
            json={"remarks": "Attempted unauthorized approval"}
        )
        assert res.status_code in [401, 403, 404]

    def test_block_planner_cannot_perform_controller_approval(self):
        planner_token = create_test_jwt(
            sub="usr-planner-01",
            email="planner@railopt.gov.in",
            roles=["BLOCK_PLANNER"]
        )
        res = client.post(
            f"{settings.API_V1_STR}/blocks/requests/BLK-REQ-TEST-01/approve",
            headers={"Authorization": f"Bearer {planner_token}"},
            json={"remarks": "Planner approval attempt"}
        )
        assert res.status_code in [401, 403, 404]

    def test_engineering_officer_cannot_access_user_management(self):
        eng_token = create_test_jwt(
            sub="usr-eng-01",
            email="eng@railopt.gov.in",
            roles=["ENGINEERING_OFFICER"]
        )
        res = client.post(
            f"{settings.API_V1_STR}/users",
            headers={"Authorization": f"Bearer {eng_token}"},
            json={"username": "hacker", "email": "hacker@test.com", "password": "Password123!"}
        )
        assert res.status_code in [401, 403]

    def test_unauthenticated_requests_blocked(self):
        protected_endpoints = [
            f"{settings.API_V1_STR}/auth/me",
            f"{settings.API_V1_STR}/users",
            f"{settings.API_V1_STR}/audit/logs",
            f"{settings.API_V1_STR}/blocks",
        ]
        for ep in protected_endpoints:
            res = client.get(ep)
            assert res.status_code == 401


class TestAPISecurityAndInjectionDefense:
    """Audit Phase 7, 8, 10, 11: SQLi, Path Traversal, and Injection Defense"""

    def test_sqli_payload_in_query_params_safely_handled(self):
        login_res = client.post(
            f"{settings.API_V1_STR}/auth/login",
            json={"username": "control", "password": "RailoptDemo@2026"}
        )
        res_data = login_res.json()
        token = res_data.get("data", {}).get("access_token") or res_data.get("access_token", "")
        sqli_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users; --",
            "1 UNION SELECT null, username, password FROM users --"
        ]
        for payload in sqli_payloads:
            res = client.get(
                f"{settings.API_V1_STR}/corridors?search={payload}",
                headers={"Authorization": f"Bearer {token}"} if token else {}
            )
            # Must return 200 (empty/filtered list) or 400/422, NEVER 500 database execution error
            assert res.status_code in [200, 400, 422]
            assert "syntax error" not in res.text.lower()
            assert "psycopg" not in res.text.lower()

    def test_path_traversal_payload_in_resource_id_safely_handled(self):
        traversal_payloads = [
            "../../etc/passwd",
            "..%2F..%2Fetc%2Fpasswd",
            "....//....//config.py"
        ]
        for payload in traversal_payloads:
            res = client.get(f"{settings.API_V1_STR}/assets/{payload}")
            assert res.status_code in [401, 404, 422]
            assert "root:" not in res.text


class TestHTTPSecurityHeaders:
    """Audit Phase 9: HTTP Security Headers Presence Verification"""

    def test_security_headers_present_on_all_responses(self):
        res = client.get("/health")
        assert res.status_code == 200
        assert res.headers.get("X-Content-Type-Options") == "nosniff"
        assert res.headers.get("X-Frame-Options") == "DENY"
        assert "strict-origin" in res.headers.get("Referrer-Policy", "")
        assert "X-Request-ID" in res.headers
