from typing import Dict, Tuple, List
from ortools.sat.python import cp_model

from app.optimization.models import OptimizationContext, CandidateBlock, TaskWrapper


class ConstraintBuilder:
    """
    Constructs mathematical CP-SAT constraints for railway maintenance block scheduling.
    """

    @classmethod
    def add_all_constraints(
        cls,
        model: cp_model.CpModel,
        context: OptimizationContext,
        x_block: Dict[int, cp_model.IntVar],
        y_task_block: Dict[Tuple[str, int], cp_model.IntVar],
        u_task: Dict[str, cp_model.IntVar]
    ) -> None:
        tasks = context.tasks
        candidates = context.candidates

        # 1. Task Assignment & Presence Constraint: sum_c y[t, c] == u[t]
        for t in tasks:
            assigned_cands = [y_task_block[(t.id, c.candidate_id)] for c in candidates]
            model.Add(sum(assigned_cands) == u_task[t.id])

        # 2. Block Activation Coupling: y[t, c] <= x[c]
        for t in tasks:
            for c in candidates:
                model.Add(y_task_block[(t.id, c.candidate_id)] <= x_block[c.candidate_id])

        # 3. Task Duration vs Block Duration Sufficiency
        for t in tasks:
            for c in candidates:
                if t.duration_minutes > c.duration_minutes:
                    # Task cannot fit into this block window
                    model.Add(y_task_block[(t.id, c.candidate_id)] == 0)

        # 4. Critical Conflict & Infeasibility Hard Constraint
        for c in candidates:
            if not c.feasible:
                # Disallow selecting candidate windows with CRITICAL train/block conflicts
                model.Add(x_block[c.candidate_id] == 0)

        # 5. Non-Overlapping Active Blocks in Same Corridor
        for i in range(len(candidates)):
            c1 = candidates[i]
            for j in range(i + 1, len(candidates)):
                c2 = candidates[j]
                # Check time intersection
                if (c1.start_time < c2.end_time) and (c2.start_time < c1.end_time):
                    # Overlapping candidate windows cannot both be active
                    model.Add(x_block[c1.candidate_id] + x_block[c2.candidate_id] <= 1)

        # 6. Maximum Simultaneous Blocks Constraint (Default: at most 2 consolidated blocks per day)
        model.Add(sum(x_block[c.candidate_id] for c in candidates) <= 2)


constraint_builder = ConstraintBuilder()
