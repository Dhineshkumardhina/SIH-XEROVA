import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import time
import numpy as np
from fastapi.testclient import TestClient
from app.main import app

def measure_baseline():
    client = TestClient(app)

    from app.database.session import SessionLocal
    from app.models.user import User
    from app.core.security import create_access_token

    db = SessionLocal()
    user = db.query(User).first()
    if not user:
        raise RuntimeError("No user found in DB. Run seed_database.py first.")

    roles = [r.code for r in user.roles] if hasattr(user, "roles") and user.roles else ["SUPER_ADMIN", "CONTROL_OFFICER"]
    token = create_access_token(subject=user.id, email=user.email, roles=roles)
    headers = {"Authorization": f"Bearer {token}"}

    def get_items(res_json):
        if isinstance(res_json, list): return res_json
        if not isinstance(res_json, dict): return []
        data = res_json.get("data", [])
        if isinstance(data, list): return data
        if isinstance(data, dict): return data.get("items", [])
        return []

    # Fetch reference IDs for POST endpoints
    tasks_res = client.get("/api/v1/maintenance/tasks", headers=headers).json()
    task_items = get_items(tasks_res)
    sample_task = task_items[0] if task_items else {"id": "MT-001", "asset_id": "AST-001", "corridor_id": "CORR-001"}

    corrs_res = client.get("/api/v1/corridors", headers=headers).json()
    corr_items = get_items(corrs_res)
    corridor_id = corr_items[0]["id"] if corr_items else "CORR-001"

    endpoints = [
        ("Dashboard", "GET", "/api/v1/analytics/dashboard", None),
        ("Asset API", "GET", "/api/v1/assets", None),
        ("Maintenance API", "GET", "/api/v1/maintenance/tasks", None),
        ("Defect API", "GET", "/api/v1/defects", None),
        ("Train API", "GET", "/api/v1/trains", None),
        ("Corridor API", "GET", "/api/v1/corridors", None),
        ("Block API", "GET", "/api/v1/blocks/requests", None),
        ("AI Priority", "POST", "/api/v1/ai/priority/calculate", {"task_id": sample_task["id"]}),
        ("Risk Prediction", "POST", "/api/v1/ai/risk/predict", {"asset_id": sample_task["asset_id"]}),
        ("Train Impact", "POST", "/api/v1/ai/train-impact", {
            "corridor_id": corridor_id,
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T12:00:00"
        }),
        ("Conflict Detection", "POST", "/api/v1/blocks/evaluate", {
            "corridor_id": corridor_id,
            "start_time": "2026-09-01T10:00:00",
            "end_time": "2026-09-01T12:00:00"
        }),
        ("Optimization Engine", "POST", "/api/v1/optimization/run", {
            "corridor_id": corridor_id,
            "planning_date": "2026-09-01T00:00:00",
            "time_horizon_hours": 24,
            "max_block_duration_minutes": 240,
            "allow_department_bundling": True
        }),
        ("Analytics Overview", "GET", "/api/v1/analytics/dashboard", None),
        ("Reports Generate", "POST", "/api/v1/reports/generate", {
            "report_type": "DAILY_BLOCK_PLAN",
            "corridor_id": corridor_id
        })
    ]

    results = {}
    print("=" * 80)
    print(f"{'Endpoint':<22} | {'Method':<6} | {'p50 (ms)':<10} | {'p95 (ms)':<10} | {'p99 (ms)':<10} | Status")
    print("=" * 80)

    for name, method, url, payload in endpoints:
        durations = []
        for _ in range(15):
            t0 = time.perf_counter()
            if method == "GET":
                res = client.get(url, headers=headers)
            else:
                res = client.post(url, headers=headers, json=payload)
            t1 = time.perf_counter()
            if res.status_code in [200, 201]:
                durations.append((t1 - t0) * 1000.0)
            else:
                if len(durations) == 0:
                    print(f"DEBUG {name}: status={res.status_code}, text={res.text[:150]}")

        if durations:
            p50 = float(np.percentile(durations, 50))
            p95 = float(np.percentile(durations, 95))
            p99 = float(np.percentile(durations, 99))
            results[name] = {"p50": p50, "p95": p95, "p99": p99}
            status_str = "PASS" if p50 < 2000 else "SLOW"
            print(f"{name:<22} | {method:<6} | {p50:<10.2f} | {p95:<10.2f} | {p99:<10.2f} | {status_str}")
        else:
            print(f"{name:<22} | {method:<6} | FAILED TO GET VALID RESPONSES")

    print("=" * 80)
    return results

if __name__ == "__main__":
    measure_baseline()
