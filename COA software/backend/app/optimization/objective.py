from typing import Dict, Tuple, List
from ortools.sat.python import cp_model

from app.optimization.models import OptimizationContext


class ObjectiveBuilder:
    """
    Constructs multi-objective function for CP-SAT Block Optimizer.
    Maximizes maintenance priority coverage, asset availability, and shared-block consolidation
    while minimizing train disruption, delay, and conflict risks.
    """

    @classmethod
    def set_objective(
        cls,
        model: cp_model.CpModel,
        context: OptimizationContext,
        x_block: Dict[int, cp_model.IntVar],
        y_task_block: Dict[Tuple[str, int], cp_model.IntVar],
        u_task: Dict[str, cp_model.IntVar]
    ) -> None:
        cfg = context.config
        tasks = context.tasks
        candidates = context.candidates

        terms = []

        # 1. Maintenance Task Benefits (Priority + Asset Criticality + Overdue weight)
        for t in tasks:
            # Base priority score (10 to 100)
            p_score = t.priority_weight * (cfg.weight_maintenance_priority / 10.0)
            
            # Asset availability gain factor (0 to 50)
            a_score = (t.asset_criticality / 2.0) * (cfg.weight_asset_availability / 25.0)
            
            # Overdue urgency boost (50 points)
            o_score = 50.0 * (cfg.weight_overdue_reduction / 10.0) if t.is_overdue else 0.0

            task_benefit = int(p_score + a_score + o_score)
            terms.append(u_task[t.id] * task_benefit)

        # 2. Shared Block & Multi-Department Bundling Bonus
        # Rewards assigning multiple tasks to the same block window
        for c in candidates:
            # Task density contribution
            for t in tasks:
                terms.append(y_task_block[(t.id, c.candidate_id)] * int(cfg.weight_shared_block * 2))

        # 3. Train Disruption & Conflict Penalties on Selected Blocks
        for c in candidates:
            # Train impact penalty (0 to 100 -> weighted)
            t_penalty = int((c.train_impact_score * 3.0) * (cfg.weight_train_delay / 20.0))
            
            # Expected delay minutes penalty
            d_penalty = int((c.expected_delay_minutes * 4.0) * (cfg.weight_train_delay / 20.0))
            
            # Conflict count penalty (for warnings)
            c_penalty = int(c.conflict_count * 15.0 * (cfg.weight_conflict_penalty / 10.0))

            # Block duration footprint penalty (favors compact possessions)
            dur_penalty = int(c.duration_minutes * 0.2 * (cfg.weight_downtime / 15.0))

            total_block_penalty = t_penalty + d_penalty + c_penalty + dur_penalty
            terms.append(x_block[c.candidate_id] * (-total_block_penalty))

        model.Maximize(sum(terms))


objective_builder = ObjectiveBuilder()
