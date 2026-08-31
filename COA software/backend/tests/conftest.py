"""
RAILOPT AI — Phase 25 Test Fixtures & Configuration
Standardized fixtures for Unit, Integration, Security, and System tests.
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal

@pytest.fixture(scope="session")
def client():
    """FastAPI test client instance."""
    return TestClient(app)

@pytest.fixture(scope="function")
def db_session():
    """Database session fixture with rollback."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="session")
def admin_token(client):
    """Obtain valid JWT for super admin."""
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "RailoptDemo@2026"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    return None

@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"} if admin_token else {}

@pytest.fixture(scope="session")
def control_token(client):
    """Obtain valid JWT for control officer."""
    res = client.post("/api/v1/auth/login", json={"username": "control", "password": "RailoptDemo@2026"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    return None

@pytest.fixture(scope="session")
def control_headers(control_token):
    return {"Authorization": f"Bearer {control_token}"} if control_token else {}

@pytest.fixture(scope="session")
def eng_token(client):
    """Obtain valid JWT for engineering officer."""
    res = client.post("/api/v1/auth/login", json={"username": "eng_officer", "password": "RailoptDemo@2026"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    return None

@pytest.fixture(scope="session")
def eng_headers(eng_token):
    return {"Authorization": f"Bearer {eng_token}"} if eng_token else {}

@pytest.fixture(scope="session")
def sig_token(client):
    """Obtain valid JWT for signal & telecom officer."""
    res = client.post("/api/v1/auth/login", json={"username": "sig_officer", "password": "RailoptDemo@2026"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    return None

@pytest.fixture(scope="session")
def sig_headers(sig_token):
    return {"Authorization": f"Bearer {sig_token}"} if sig_token else {}

@pytest.fixture(scope="session")
def trc_token(client):
    """Obtain valid JWT for traction officer."""
    res = client.post("/api/v1/auth/login", json={"username": "trc_officer", "password": "RailoptDemo@2026"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    return None

@pytest.fixture(scope="session")
def trc_headers(trc_token):
    return {"Authorization": f"Bearer {trc_token}"} if trc_token else {}

@pytest.fixture(scope="session")
def viewer_token(client):
    """Obtain valid JWT for viewer."""
    res = client.post("/api/v1/auth/login", json={"username": "viewer", "password": "RailoptDemo@2026"})
    if res.status_code == 200:
        return res.json()["data"]["access_token"]
    return None

@pytest.fixture(scope="session")
def viewer_headers(viewer_token):
    return {"Authorization": f"Bearer {viewer_token}"} if viewer_token else {}
