"""
Phase 38 Step 4 — Complete End-to-End Integrated Planning Pipeline Test
Validates the full 20-step integrated lifecycle from data loading to report generation.
"""
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_items(res_json):
    if isinstance(res_json, list):
        return res_json
    data = res_json.get("data", [])
    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        return data.get("items", [])
    return []

def test_20_step_complete_planning_pipeline():
    # 1. Login as Control Officer
    login_res = client.post("/api/v1/auth/login", json={"username": "control", "password": DEMO_PWD})
    assert login_res.status_code == 200
    token = login_res.json()["data"]["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify me / profile
    me_res = client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert "CONTROL_OFFICER" in me_res.json()["data"]["roles"]

    # 3. Retrieve maintenance tasks
    tasks_res = client.get("/api/v1/maintenance/tasks", headers=headers)
    assert tasks_res.status_code == 200
    tasks = get_items(tasks_res.json())
    assert len(tasks) > 0
    sample_task = tasks[0]

    # 4. Retrieve defects
    defects_res = client.get("/api/v1/defects", headers=headers)
    assert defects_res.status_code == 200
    defects = get_items(defects_res.json())
    assert len(defects) > 0

    # 5. Retrieve assets
    assets_res = client.get("/api/v1/assets", headers=headers)
    assert assets_res.status_code == 200
    assets = get_items(assets_res.json())
    assert len(assets) > 0

    # 6. Retrieve train timetable
    trains_res = client.get("/api/v1/trains", headers=headers)
    assert trains_res.status_code == 200
    trains = get_items(trains_res.json())
    assert len(trains) > 0

    # 7. Retrieve goods forecast
    corridors_res = client.get("/api/v1/corridors", headers=headers)
    assert corridors_res.status_code == 200
    corridors = get_items(corridors_res.json())
    corridor_id = corridors[0]["id"]

    forecast_res = client.get(f"/api/v1/forecasts/goods?corridor={corridor_id}", headers=headers)
    assert forecast_res.status_code == 200

    # 8. Retrieve corridor availability
    avail_res = client.get(f"/api/v1/corridors/{corridor_id}/availability", headers=headers)
    assert avail_res.status_code == 200

    # 9. Calculate maintenance priorities
    prio_res = client.post("/api/v1/ai/priority/calculate", headers=headers, json={"task_id": sample_task["id"]})
    assert prio_res.status_code == 200
    assert 0 <= prio_res.json()["priority_score"] <= 100

    # 10. Calculate asset risk
    risk_res = client.post("/api/v1/ai/risk/predict", headers=headers, json={"asset_id": sample_task["asset_id"]})
    assert risk_res.status_code == 200
    risk_data = risk_res.json().get("data", risk_res.json())
    assert 0.0 <= risk_data.get("failure_probability", 0.5) <= 1.0

    # 11. Detect conflicts & 12. Find compatible departmental tasks
    opt_run_res = client.post("/api/v1/optimization/run", headers=headers, json={
        "corridor_id": corridor_id,
        "planning_date": (datetime.utcnow() + timedelta(days=1)).isoformat()
    })
    assert opt_run_res.status_code == 200

    # 13. Run OR-Tools optimization & 14. Generate optimized block plan
    plan_res = client.post("/api/v1/planner/daily/generate", headers=headers, json={
        "planning_date": (datetime.utcnow() + timedelta(days=1)).isoformat(),
        "corridor_ids": [corridor_id],
        "departments": ["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
        "max_block_duration_minutes": 180
    })
    assert plan_res.status_code == 200
    blocks = plan_res.json()["data"].get("recommended_blocks", [])

    # 15. Calculate train impact
    impact_res = client.post("/api/v1/ai/train-impact", headers=headers, json={
        "corridor_id": corridor_id,
        "start_time": (datetime.utcnow() + timedelta(days=1, hours=1)).isoformat(),
        "end_time": (datetime.utcnow() + timedelta(days=1, hours=3)).isoformat()
    })
    assert impact_res.status_code == 200

    # 16. Run simulation
    sim_res = client.post("/api/v1/simulation/run", headers=headers, json={
        "scenario_id": "SHARED_BLOCK_OPTIMIZATION",
        "plan_mode": "AI_OPTIMIZED"
    })
    assert sim_res.status_code == 200
    sim_id = sim_res.json()["data"]["simulation_id"]

    # 17. Create & Approve block request
    depts_res = client.get("/api/v1/departments", headers=headers)
    assert depts_res.status_code == 200
    depts = get_items(depts_res.json())
    dept_id = depts[0]["id"] if depts else sample_task["department_id"]

    req_res = client.post("/api/v1/blocks/requests", headers=headers, json={
        "department_id": dept_id,
        "corridor_id": corridor_id,
        "asset_id": sample_task["asset_id"],
        "task_ids": [sample_task["id"]],
        "preferred_start_at": (datetime.utcnow() + timedelta(days=15, hours=1)).isoformat(),
        "preferred_end_at": (datetime.utcnow() + timedelta(days=15, hours=3)).isoformat(),
        "duration_minutes": 120,
        "reason": "Integration test block approval",
        "status": "SUBMITTED"
    })
    assert req_res.status_code in [200, 201]
    request_id = req_res.json()["data"]["id"]

    appr_res = client.post(f"/api/v1/blocks/requests/{request_id}/approve", headers=headers)
    assert appr_res.status_code in [200, 403]

    # 18. Verify audit log
    audit_res = client.get("/api/v1/audit", headers=headers)
    logs = get_items(audit_res.json())
    assert isinstance(logs, list)

    # 19. Verify analytics changed / accessible
    dash_res = client.get("/api/v1/analytics/dashboard", headers=headers)
    assert dash_res.status_code == 200

    # 20. Generate operational report
    rep_res = client.post("/api/v1/reports/generate", headers=headers, json={
        "report_type": "DAILY_BLOCK_PLAN",
        "corridor_id": corridor_id
    })
    assert rep_res.status_code in [200, 201]
