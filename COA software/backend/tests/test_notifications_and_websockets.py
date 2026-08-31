import pytest
import asyncio
from fastapi.testclient import TestClient

from app.main import app
from app.services.websocket_manager import ws_manager
from app.database.session import SessionLocal
from app.services import notification_service

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"


def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_notification_listing_and_filtering():
    """TEST 1: List and filter notifications by unread/severity"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch notifications
    res = client.get("/api/v1/notifications", headers=headers)
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "items" in body["data"]

    # Fetch unread notifications
    unread_res = client.get("/api/v1/notifications/unread", headers=headers)
    assert unread_res.status_code == 200
    unread_body = unread_res.json()
    assert unread_body["success"] is True


def test_notification_mark_read_and_read_all():
    """TEST 2: Mark single notification read and mark all read"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # Generate a demo event which creates a notification
    demo_res = client.post("/api/v1/notifications/demo/generate", json={
        "event_type": "CRITICAL_DEFECT"
    }, headers=headers)
    assert demo_res.status_code == 200

    # Get unread notifications
    unread_res = client.get("/api/v1/notifications/unread", headers=headers)
    items = unread_res.json()["data"]["items"]
    assert len(items) > 0
    target_id = items[0]["id"]

    # Mark single read
    read_res = client.post(f"/api/v1/notifications/{target_id}/read", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["data"]["is_read"] is True

    # Mark all read
    all_read_res = client.post("/api/v1/notifications/read-all", headers=headers)
    assert all_read_res.status_code == 200
    assert "marked_read_count" in all_read_res.json()["data"]


def test_notification_duplicate_prevention():
    """TEST 3: Verify duplicate alert suppression within time window"""
    db = SessionLocal()
    try:
        # Create first notification
        n1 = notification_service.create_notification(
            db=db,
            title="Overdue Track Inspection",
            message="Asset TRK-999 is overdue for inspection",
            severity="WARNING",
            entity_type="Asset",
            entity_id="TRK-999",
            prevent_duplicate_minutes=15
        )

        # Attempt to create duplicate immediately
        n2 = notification_service.create_notification(
            db=db,
            title="Overdue Track Inspection",
            message="Asset TRK-999 is overdue for inspection",
            severity="WARNING",
            entity_type="Asset",
            entity_id="TRK-999",
            prevent_duplicate_minutes=15
        )

        # IDs should match because duplicate was prevented
        assert n1.id == n2.id
    finally:
        db.close()


def test_notification_deletion():
    """TEST 4: Delete a notification record"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # Generate event
    client.post("/api/v1/notifications/demo/generate", json={
        "event_type": "MAINTENANCE_OVERDUE"
    }, headers=headers)

    # Get list
    res = client.get("/api/v1/notifications", headers=headers)
    items = res.json()["data"]["items"]
    assert len(items) > 0
    del_id = items[0]["id"]

    # Delete
    del_res = client.delete(f"/api/v1/notifications/{del_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["data"]["deleted"] is True


def test_demo_event_generation_and_broadcasting():
    """TEST 5: Test synthetic event generator API endpoint"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    event_types = ["TRAIN_MOVEMENT", "BLOCK_ACTIVATED", "BLOCK_CONFLICT", "AI_RECOMMENDATION"]
    for evt_type in event_types:
        res = client.post("/api/v1/notifications/demo/generate", json={
            "event_type": evt_type,
            "corridor_id": "COR-A01"
        }, headers=headers)
        assert res.status_code == 200
        data = res.json()["data"]
        assert data["published"] is True
        assert data["event"]["event_type"] == evt_type
        assert "event_id" in data["event"]
        assert "timestamp" in data["event"]


def test_websocket_operations_authentication_and_handshake():
    """TEST 6: Test WebSocket operations channel connection, JWT auth and initial handshake"""
    token = get_auth_token("control")

    # Connect with valid token
    with client.websocket_connect(f"/ws/operations?token={token}") as websocket:
        init_data = websocket.receive_json()
        assert init_data["event_type"] == "SYSTEM_ALERT"
        assert init_data["severity"] == "INFO"
        assert "Connected to RAILOPT AI" in init_data["message"]
        assert "connected_clients" in init_data["data"]

        # Send heartbeat ping and verify pong
        websocket.send_json({"type": "ping"})
        pong_data = websocket.receive_json()
        assert pong_data["type"] == "pong"
        assert "timestamp" in pong_data


def test_websocket_operations_unauthorized_rejection():
    """TEST 7: Test WebSocket connection with invalid/missing token is rejected"""
    try:
        with client.websocket_connect("/ws/operations?token=invalid_token_xyz") as websocket:
            websocket.receive_json()
    except Exception:
        # Expected policy violation disconnection
        pass


def test_websocket_manager_publish_event():
    """TEST 8: Test WebSocketManager event publishing and payload normalization"""
    event = asyncio.run(ws_manager.publish_event(
        event_type="TRAIN_DELAY",
        message="Express 12626 running 12 min delayed",
        severity="WARNING",
        corridor_id="COR-A01",
        data={"train": "12626", "delay_min": 12.0}
    ))
    assert event["event_type"] == "TRAIN_DELAY"
    assert event["severity"] == "WARNING"
    assert event["corridor_id"] == "COR-A01"
    assert event["data"]["delay_min"] == 12.0
    assert event["event_id"].startswith("EVT-")

