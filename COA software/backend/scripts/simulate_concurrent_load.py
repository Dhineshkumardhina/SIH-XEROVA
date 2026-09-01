import sys
import os
import time
import concurrent.futures
import numpy as np
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app
from app.database.session import SessionLocal
from app.models.user import User
from app.core.security import create_access_token

def simulate_user_session(user_id, token, headers):
    client = TestClient(app)
    endpoints = [
        ("GET", "/api/v1/analytics/dashboard", None),
        ("GET", "/api/v1/assets", None),
        ("GET", "/api/v1/maintenance/tasks", None),
        ("GET", "/api/v1/blocks/requests", None),
        ("POST", "/api/v1/optimization/run", {
            "corridor_id": "CORR-001",
            "planning_date": "2026-09-01T00:00:00",
            "time_horizon_hours": 24,
            "max_block_duration_minutes": 240,
            "allow_department_bundling": True
        })
    ]

    session_latencies = []
    for method, url, payload in endpoints:
        t0 = time.perf_counter()
        if method == "GET":
            res = client.get(url, headers=headers)
        else:
            res = client.post(url, headers=headers, json=payload)
        t1 = time.perf_counter()
        if res.status_code in [200, 201]:
            session_latencies.append((t1 - t0) * 1000.0)
    return session_latencies

def run_concurrent_load_test():
    print("=" * 90)
    print("RAILOPT AI — Concurrent User Load Simulation Benchmark")
    print("=" * 90)

    db = SessionLocal()
    try:
        user = db.query(User).first()
        roles = [r.code for r in user.roles] if hasattr(user, "roles") and user.roles else ["SUPER_ADMIN"]
        token = create_access_token(subject=user.id, email=user.email, roles=roles)
        headers = {"Authorization": f"Bearer {token}"}

        concurrency_levels = [10, 25, 50]
        print(f"{'Concurrent Users':<18} | {'Total Requests':<16} | {'Total Time (s)':<16} | {'Req / sec':<12} | {'p50 (ms)':<10} | {'p95 (ms)':<10} | Status")
        print("-" * 90)

        for users_cnt in concurrency_levels:
            t0 = time.perf_counter()
            all_latencies = []

            with concurrent.futures.ThreadPoolExecutor(max_workers=users_cnt) as executor:
                futures = [executor.submit(simulate_user_session, i, token, headers) for i in range(users_cnt)]
                for future in concurrent.futures.as_completed(futures):
                    all_latencies.extend(future.result())

            t1 = time.perf_counter()
            tot_dur = round(t1 - t0, 3)
            tot_reqs = len(all_latencies)
            rps = round(tot_reqs / tot_dur, 1) if tot_dur > 0 else 0
            p50 = round(float(np.percentile(all_latencies, 50)), 2) if all_latencies else 0
            p95 = round(float(np.percentile(all_latencies, 95)), 2) if all_latencies else 0
            status_str = "PASS" if p95 < 3000 else "DEGRADED"

            print(f"{users_cnt:<18} | {tot_reqs:<16} | {tot_dur:<16.3f} | {rps:<12.1f} | {p50:<10.2f} | {p95:<10.2f} | {status_str}")

    finally:
        db.close()
    print("=" * 90)

if __name__ == "__main__":
    run_concurrent_load_test()
