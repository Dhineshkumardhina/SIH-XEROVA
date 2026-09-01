import pytest
import uuid
from datetime import datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.database.session import SessionLocal
from app.models.department import Department
from app.models.corridor import Corridor
from app.models.station import Station
from app.models.asset import Asset
from app.models.maintenance import MaintenanceTask
from app.models.defect import Defect
from app.models.block import BlockRequest
from app.models.audit import AuditLog

client = TestClient(app)

DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]

# 1. Login
def test_1_valid_login():
    res = client.post("/api/v1/auth/login", json={"username": "control", "password": DEMO_PWD})
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "access_token" in body["data"]
    assert "refresh_token" in body["data"]

# 2. Invalid login
def test_2_invalid_login():
    res = client.post("/api/v1/auth/login", json={"username": "control", "password": "WrongPassword123"})
    assert res.status_code == 401
    body = res.json()
    assert body["success"] is False
    assert body["error"]["code"] == "INVALID_CREDENTIALS"

# 3. Current user
def test_3_current_user_me():
    token = get_auth_token("control")
    res = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["username"] == "control"
    assert "CONTROL_OFFICER" in data["roles"]

# 4. RBAC forbidden endpoint
def test_4_rbac_forbidden_endpoint():
    viewer_token = get_auth_token("viewer")
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {viewer_token}"})
    assert res.status_code == 403
    assert res.json()["error"]["code"] == "INSUFFICIENT_PERMISSION"

# 5. Asset list with pagination
def test_5_asset_list_pagination():
    res = client.get("/api/v1/assets?page=1&page_size=5")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert "items" in body["data"]
    assert "pagination" in body["data"]
    assert body["data"]["pagination"]["page"] == 1
    assert body["data"]["pagination"]["page_size"] == 5
    assert len(body["data"]["items"]) <= 5

# 6. Asset detail and sub-resources
def test_6_asset_detail_and_subresources():
    res = client.get("/api/v1/assets?page=1&page_size=1")
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert len(items) > 0
    asset_id = items[0]["id"]

    # Asset detail
    detail_res = client.get(f"/api/v1/assets/{asset_id}")
    assert detail_res.status_code == 200
    assert detail_res.json()["data"]["id"] == asset_id

    # Sub-resources
    health_res = client.get(f"/api/v1/assets/{asset_id}/health")
    assert health_res.status_code == 200
    assert "health_score" in health_res.json()["data"]

    risk_res = client.get(f"/api/v1/assets/{asset_id}/risk")
    assert risk_res.status_code == 200
    assert "risk_score" in risk_res.json()["data"]

# 7. Asset filtering and search
def test_7_asset_filtering_and_search():
    res = client.get("/api/v1/assets?page=1&department=ENGINEERING&search=Track")
    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert isinstance(body["data"]["items"], list)

# 8. Maintenance CRUD
def test_8_maintenance_crud():
    token = get_auth_token("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    # Get an asset and department
    asset_res = client.get("/api/v1/assets?page=1&page_size=1")
    asset = asset_res.json()["data"]["items"][0]

    # CREATE
    create_res = client.post("/api/v1/maintenance/tasks", json={
        "asset_id": asset["id"],
        "department_id": asset["department_id"],
        "task_type": "PREVENTIVE",
        "description": "Integration test lubrication task",
        "duration_minutes": 90,
        "priority": "MEDIUM",
        "block_required": True,
        "status": "PENDING"
    }, headers=headers)
    assert create_res.status_code == 201
    task_id = create_res.json()["data"]["id"]

    # READ
    read_res = client.get(f"/api/v1/maintenance/tasks/{task_id}", headers=headers)
    assert read_res.status_code == 200
    assert read_res.json()["data"]["description"] == "Integration test lubrication task"

    # UPDATE
    update_res = client.put(f"/api/v1/maintenance/tasks/{task_id}", json={
        "description": "Updated lubrication task details",
        "priority": "HIGH"
    }, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["data"]["priority"] == "HIGH"

    # DELETE
    del_res = client.delete(f"/api/v1/maintenance/tasks/{task_id}", headers=headers)
    assert del_res.status_code == 204

# 9. Overdue maintenance dynamic calculation
def test_9_overdue_maintenance_dynamic():
    token = get_auth_token("supervisor")
    headers = {"Authorization": f"Bearer {token}"}

    # Seed an overdue task directly
    db = SessionLocal()
    try:
        asset = db.query(Asset).first()
        dept = db.query(Department).first()
        past_task = MaintenanceTask(
            task_code=f"MT-OVD-{uuid.uuid4().hex[:6]}",
            asset_id=asset.id,
            department_id=dept.id,
            description="Past overdue task",
            due_at=datetime.utcnow() - timedelta(days=365),
            status="PENDING"
        )
        db.add(past_task)
        db.commit()
        task_id = past_task.id
    finally:
        db.close()

    res = client.get("/api/v1/maintenance/overdue?page=1&page_size=100", headers=headers)
    assert res.status_code == 200
    items = res.json()["data"]["items"]
    assert any(t["id"] == task_id for t in items)

# 10. Defect CRUD and severity filtering
def test_10_defect_crud_and_critical():
    token = get_auth_token("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    asset_res = client.get("/api/v1/assets?page=1&page_size=1")
    asset = asset_res.json()["data"]["items"][0]

    create_res = client.post("/api/v1/defects", json={
        "defect_code": f"DEF-{uuid.uuid4().hex[:6].upper()}",
        "asset_id": asset["id"],
        "department_id": asset["department_id"],
        "description": "Critical crack detected in rails",
        "severity": "CRITICAL",
        "risk_score": 92.0
    }, headers=headers)
    assert create_res.status_code == 201
    defect_id = create_res.json()["data"]["id"]

    crit_res = client.get("/api/v1/defects/critical", headers=headers)
    assert crit_res.status_code == 200
    items = crit_res.json()["data"]["items"]
    assert any(d["id"] == defect_id for d in items)

# 11. Train list and schedules
def test_11_train_list_and_schedules():
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    trains_res = client.get("/api/v1/trains?page=1&page_size=10", headers=headers)
    assert trains_res.status_code == 200
    assert len(trains_res.json()["data"]["items"]) > 0

    sched_res = client.get("/api/v1/trains/schedule?page=1&page_size=10", headers=headers)
    assert sched_res.status_code == 200
    assert "items" in sched_res.json()["data"]

# 12. Corridor list & availability
def test_12_corridor_list_and_availability():
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    corr_res = client.get("/api/v1/corridors?page=1", headers=headers)
    assert corr_res.status_code == 200
    corrs = corr_res.json()["data"]["items"]
    assert len(corrs) > 0
    corridor_id = corrs[0]["id"]

    avail_res = client.get(f"/api/v1/corridors/{corridor_id}/availability", headers=headers)
    assert avail_res.status_code == 200
    avail_data = avail_res.json()["data"]
    assert "availability_pct" in avail_data
    assert avail_data["availability_pct"] >= 50.0

def _create_test_block_request() -> str:
    token = get_auth_token("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        dept = db.query(Department).filter(Department.code == "ENGINEERING").first()
        corr = db.query(Corridor).first()
        dept_id = dept.id
        corr_id = corr.id
    finally:
        db.close()

    rand_offset = int(uuid.uuid4().hex[:4], 16) % 500 + 200
    create_res = client.post("/api/v1/blocks/requests", json={
        "department_id": dept_id,
        "corridor_id": corr_id,
        "duration_minutes": 180,
        "reason": "Routine ultrasonic flaw testing",
        "priority": "HIGH",
        "status": "DRAFT",
        "preferred_start_at": (datetime.utcnow() + timedelta(days=rand_offset)).isoformat(),
        "preferred_end_at": (datetime.utcnow() + timedelta(days=rand_offset, hours=3)).isoformat()
    }, headers=headers)
    assert create_res.status_code == 201
    return create_res.json()["data"]["id"]

# 13. Block request creation
def test_13_block_request_creation():
    req_id = _create_test_block_request()
    assert req_id is not None

# 14. Block request submission
def test_14_block_request_submission():
    req_id = _create_test_block_request()
    token = get_auth_token("engineering")
    headers = {"Authorization": f"Bearer {token}"}

    sub_res = client.post(f"/api/v1/blocks/requests/{req_id}/submit", headers=headers)
    assert sub_res.status_code == 200
    assert sub_res.json()["data"]["status"] == "SUBMITTED"

# 15. Block approval permission enforcement
def test_15_block_approval_permission():
    req_id = _create_test_block_request()
    eng_token = get_auth_token("engineering")
    client.post(f"/api/v1/blocks/requests/{req_id}/submit", headers={"Authorization": f"Bearer {eng_token}"})

    # Viewer or department officer cannot approve
    viewer_token = get_auth_token("viewer")
    fail_res = client.post(f"/api/v1/blocks/requests/{req_id}/approve", headers={"Authorization": f"Bearer {viewer_token}"})
    assert fail_res.status_code == 403

    # Control Officer can approve
    ctrl_token = get_auth_token("control")
    appr_res = client.post(f"/api/v1/blocks/requests/{req_id}/approve", headers={"Authorization": f"Bearer {ctrl_token}"})
    assert appr_res.status_code == 200
    assert appr_res.json()["data"]["status"] == "APPROVED"

# 16. Invalid status transition rejection
def test_16_invalid_status_transition():
    token = get_auth_token("admin")
    headers = {"Authorization": f"Bearer {token}"}

    asset_res = client.get("/api/v1/assets?page=1&page_size=1")
    asset = asset_res.json()["data"]["items"][0]

    # Create task
    task_res = client.post("/api/v1/maintenance/tasks", json={
        "asset_id": asset["id"],
        "department_id": asset["department_id"],
        "description": "Task for transition testing",
        "duration_minutes": 60,
        "status": "PENDING"
    }, headers=headers)
    assert task_res.status_code == 201
    task_id = task_res.json()["data"]["id"]

    # Complete it
    client.post(f"/api/v1/maintenance/tasks/{task_id}/complete", json={"completion_notes": "Done"}, headers=headers)

    # Attempt invalid transition from COMPLETED -> PENDING
    inv_res = client.put(f"/api/v1/maintenance/tasks/{task_id}", json={"status": "PENDING"}, headers=headers)
    assert inv_res.status_code == 400
    assert inv_res.json()["error"]["code"] == "INVALID_STATUS_TRANSITION"

# 17. Audit log creation on critical operations
def test_17_audit_log_creation():
    admin_token = get_auth_token("admin")
    headers = {"Authorization": f"Bearer {admin_token}"}

    audit_res = client.get("/api/v1/audit?page=1&page_size=10", headers=headers)
    assert audit_res.status_code == 200
    items = audit_res.json()["data"]["items"]
    assert len(items) > 0
    assert "action" in items[0]
    assert "entity_type" in items[0]

# 18. Integration sync endpoints
def test_18_integration_sync():
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    tms_res = client.post("/api/v1/integrations/tms/sync", headers=headers)
    assert tms_res.status_code == 200
    assert tms_res.json()["data"]["source_system"] == "TMS"

    smms_res = client.post("/api/v1/integrations/smms/sync", headers=headers)
    assert smms_res.status_code == 200
    assert smms_res.json()["data"]["source_system"] == "SMMS"

    tdms_res = client.post("/api/v1/integrations/tdms/sync", headers=headers)
    assert tdms_res.status_code == 200
    assert tdms_res.json()["data"]["source_system"] == "TDMS"

# 19. Pagination envelope and limits
def test_19_pagination_limits():
    res = client.get("/api/v1/assets?page=1&page_size=200") # Requests 200
    assert res.status_code == 200
    meta = res.json()["data"]["pagination"]
    assert meta["page_size"] <= 100 # Clamped to 100 max

# 20. Health endpoint
def test_20_health_endpoint():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["database"] in ["healthy", "connected"]
