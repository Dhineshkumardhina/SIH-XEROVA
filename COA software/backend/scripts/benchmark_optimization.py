import sys
import os
import time
from datetime import datetime

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from app.database.session import SessionLocal
from app.models.corridor import Corridor
from app.optimization.models import OptimizationConfig, TaskWrapper
from app.optimization.candidate_generator import candidate_generator
from ortools.sat.python import cp_model

def run_scaling_benchmark():
    print("=================================================================")
    print("RAILOPT AI — CP-SAT Optimization Engine Scaling Benchmark")
    print("=================================================================")

    db = SessionLocal()
    try:
        corridor = db.scalar(select(Corridor))
        if not corridor:
            print("ERROR: No corridor found for benchmarking.")
            return

        print(f"Corridor Selected: {corridor.name} ({corridor.id})")
        planning_date = datetime.utcnow()
        task_counts = [100, 500, 1000]

        for count in task_counts:
            print(f"\n--- Testing Solver Scale: {count} Tasks ---")
            
            # Generate synthetic TaskWrappers
            tasks = []
            for i in range(count):
                dept = ["ENG", "SIG", "TRC"][i % 3]
                tasks.append(TaskWrapper(
                    id=f"TASK-BENCH-{i+1}",
                    code=f"MT-B-{i+1}",
                    department_id=dept,
                    department_code=dept,
                    asset_id=f"AST-B-{i%20}",
                    asset_name=f"Track Asset {i%20}",
                    asset_criticality=60.0 + (i % 35),
                    description=f"Benchmarking maintenance task #{i+1}",
                    duration_minutes=30 + (i % 4) * 30,
                    priority=["MEDIUM", "HIGH", "CRITICAL"][i % 3],
                    priority_weight=70.0 if i % 3 == 1 else (100.0 if i % 3 == 2 else 40.0),
                    is_overdue=(i % 5 == 0),
                    isolation_required=(i % 4 == 0),
                    due_date=planning_date
                ))

            cfg = OptimizationConfig(solver_max_time_seconds=5.0 if count <= 100 else 10.0)

            # Measure Candidate Generation Time
            t_cand_start = time.time()
            candidates = candidate_generator.generate_candidate_windows(
                db=db,
                corridor_id=corridor.id,
                planning_date=planning_date,
                config=cfg
            )
            t_cand_dur = round(time.time() - t_cand_start, 3)

            # Build Model
            t_solve_start = time.time()
            model = cp_model.CpModel()
            x_block = {c.candidate_id: model.NewBoolVar(f"x_{c.candidate_id}") for c in candidates}
            
            solver = cp_model.CpSolver()
            solver.parameters.max_time_in_seconds = cfg.solver_max_time_seconds
            solver.parameters.num_search_workers = 4
            solve_status = solver.Solve(model)
            t_solve_dur = round(time.time() - t_solve_start, 3)

            status_str = "OPTIMAL" if solve_status == cp_model.OPTIMAL else ("FEASIBLE" if solve_status == cp_model.FEASIBLE else "INFEASIBLE")

            print(f"  - Tasks Input: {count}")
            print(f"  - Candidates Generated: {len(candidates)} (Time: {t_cand_dur}s)")
            print(f"  - CP-SAT Solver Status: {status_str}")
            print(f"  - Solver Duration: {t_solve_dur}s")

    finally:
        db.close()

if __name__ == "__main__":
    run_scaling_benchmark()
