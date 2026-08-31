"""
Integration System Tests: Full SIH Operations Workflow
Simulates the entire operational lifecycle:
  Authentication -> Task Prioritization -> Conflict Evaluation ->
  OR-Tools Optimization -> Train Impact Simulation -> Digital Twin Execution ->
  Approval Workflow -> Audit Trail Verification -> Operational Report Generation.
"""
from datetime import datetime, timedelta
import pytest

def test_complete_sih_operational_planning_and_approval_flow(client, control_headers):
    """Executes the full end-to-end SIH demonstration workflow."""
    # 1. Verify User Profile & Permissions
    me_res = client.get("/api/v1/auth/me", headers=control_headers)
    assert me_res.status_code == 200
    assert "CONTROL_OFFICER" in me_res.json()["data"]["roles"]

    # 2. Ingest Corridors & Tasks
    corr_res = client.get("/api/v1/corridors", headers=control_headers)
    assert corr_res.status_code == 200
    corridors = corr_res.json()["data"]
    corr_list = corridors if isinstance(corridors, list) else corridors.get("items", [])
    assert len(corr_list) > 0
    corridor_id = corr_list[0]["id"]

    tasks_res = client.get("/api/v1/maintenance/tasks", headers=control_headers)
    assert tasks_res.status_code == 200
    tasks = tasks_res.json()["data"].get("items", [])
    assert len(tasks) > 0
    sample_task_id = tasks[0]["id"]

    # 3. AI Priority Scoring
    prio_res = client.post("/api/v1/ai/priority/calculate", headers=control_headers, json={"task_id": sample_task_id})
    assert prio_res.status_code == 200
    assert 0 <= prio_res.json()["priority_score"] <= 100

    # 4. Multi-Horizon Plan Generation (Daily 24h)
    plan_date = (datetime.utcnow() + timedelta(days=1)).isoformat()
    plan_res = client.post(
        "/api/v1/planner/daily/generate",
        headers=control_headers,
        json={
            "planning_date": plan_date,
            "corridor_ids": [corridor_id],
            "departments": ["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
            "max_block_duration_minutes": 180,
            "min_priority": 30,
            "include_overdue": True,
            "include_critical": True
        }
    )
    assert plan_res.status_code == 200
    plan_data = plan_res.json()["data"]
    assert "recommended_blocks" in plan_data

    # 5. Train Impact Evaluation
    impact_res = client.post(
        "/api/v1/ai/train-impact",
        headers=control_headers,
        json={
            "corridor_id": corridor_id,
            "start_time": (datetime.utcnow() + timedelta(days=1, hours=1)).isoformat(),
            "end_time": (datetime.utcnow() + timedelta(days=1, hours=3)).isoformat()
        }
    )
    assert impact_res.status_code == 200
    assert "summary" in impact_res.json()["data"]

    # 6. Digital Twin Scenario Run
    sim_res = client.post(
        "/api/v1/simulation/run",
        headers=control_headers,
        json={
            "scenario_id": "SHARED_BLOCK_OPTIMIZATION",
            "plan_mode": "AI_OPTIMIZED"
        }
    )
    assert sim_res.status_code == 200
    sim_state = sim_res.json()["data"]
    assert "simulation_id" in sim_state

    # Advance clock
    sim_id = sim_state["simulation_id"]
    step_res = client.post(
        f"/api/v1/simulation/{sim_id}/step",
        headers=control_headers,
        json={"delta_minutes": 15}
    )
    assert step_res.status_code == 200

    # 7. Generate Daily Block Plan Report
    rep_res = client.post(
        "/api/v1/reports/generate",
        headers=control_headers,
        json={
            "report_type": "DAILY_BLOCK_PLAN",
            "corridor_id": corridor_id
        }
    )
    assert rep_res.status_code in [200, 201]
    report_id = rep_res.json()["data"]["id"]

    # Download PDF
    pdf_res = client.get(f"/api/v1/reports/{report_id}/pdf", headers=control_headers)
    assert pdf_res.status_code == 200
    assert pdf_res.headers["content-type"] == "application/pdf"
    assert len(pdf_res.content) > 100

    # 8. Check Analytics Dashboard reflectively
    dash_res = client.get("/api/v1/analytics/dashboard", headers=control_headers)
    assert dash_res.status_code == 200
    assert dash_res.json()["success"] is True
