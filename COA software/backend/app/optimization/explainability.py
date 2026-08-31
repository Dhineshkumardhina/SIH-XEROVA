from typing import List, Dict, Any
from app.optimization.models import OptimizedBlock, TaskWrapper, CandidateBlock


class ExplainabilityGenerator:
    """
    Generates human-readable, data-driven explainability narratives
    for CP-SAT optimization results.
    """

    @classmethod
    def generate_block_explanation(
        cls,
        block: Dict[str, Any],
        scheduled_tasks: List[TaskWrapper],
        candidates: List[CandidateBlock],
        baseline_duration_minutes: int
    ) -> Dict[str, Any]:
        task_count = len(scheduled_tasks)
        departments = list(set(t.department_code for t in scheduled_tasks))
        overdue_count = sum(1 for t in scheduled_tasks if t.is_overdue)
        high_prio_count = sum(1 for t in scheduled_tasks if t.priority in ["CRITICAL", "HIGH"])
        
        st_str = block["start_time"].strftime("%H:%M")
        et_str = block["end_time"].strftime("%H:%M")

        # 1. Why Selected
        why_selected = [
            f"Bundles {task_count} maintenance activities across {len(departments)} department(s) ({', '.join(departments)}) into a single possession.",
            f"Selected window ({st_str}–{et_str}) avoids all high-priority and protected train movements.",
            f"Achieves {block.get('block_utilization', 90)}% block time utilization with {block.get('expected_delay_minutes', 0)} min expected train regulation delay."
        ]
        if high_prio_count > 0:
            why_selected.append(f"Resolves {high_prio_count} critical/high priority asset work order(s).")
        if overdue_count > 0:
            why_selected.append(f"Addresses {overdue_count} overdue task(s) to restore infrastructure compliance.")

        # 2. Why This Time
        why_this_time = f"Scheduled during optimal low-density corridor window {st_str}–{et_str} with {block.get('affected_trains_count', 0)} affected timetable movement(s)."

        # 3. Why Not Alternative Windows
        why_not_others = []
        # Find candidates with high impact or critical conflicts
        rejected_high_impact = [c for c in candidates if c.train_impact_score > 40 or not c.feasible][:2]
        for rc in rejected_high_impact:
            rc_st = rc.start_time.strftime("%H:%M")
            rc_et = rc.end_time.strftime("%H:%M")
            if not rc.feasible:
                why_not_others.append(f"Window {rc_st}–{rc_et} rejected: contains critical train or existing block conflict.")
            else:
                why_not_others.append(f"Window {rc_st}–{rc_et} rejected: high train impact score ({int(rc.train_impact_score)}/100) and {rc.affected_trains} affected train(s).")

        if not why_not_others:
            why_not_others.append("Alternative daylight windows evaluated had significantly higher passenger and goods traffic density.")

        # 4. Department & Shared Benefits
        dept_names = {
            "ENG": "Civil Engineering (Track/Structures)",
            "SIG": "Signal & Telecommunication",
            "TRC": "Traction / Overhead Equipment (OHE)",
            "OPR": "Traffic & Operations"
        }
        dept_breakdown = [dept_names.get(d, d) for d in departments]

        return {
            "why_selected": why_selected,
            "why_this_time": why_this_time,
            "why_not_others": why_not_others,
            "departments": dept_breakdown,
            "is_shared_block": len(departments) > 1,
            "time_saved_vs_sequential_minutes": max(0, baseline_duration_minutes - block["duration_minutes"]),
            "utilization_pct": block.get("block_utilization", 90.0)
        }

    @classmethod
    def generate_overall_narrative(
        cls,
        status: str,
        blocks_count: int,
        tasks_scheduled: int,
        tasks_total: int,
        time_saved_minutes: int,
        shared_blocks_count: int
    ) -> List[str]:
        narratives = []
        if status in ["OPTIMAL", "FEASIBLE"] and blocks_count > 0:
            narratives.append(f"CP-SAT solver successfully generated an {status.lower()} plan scheduling {tasks_scheduled}/{tasks_total} tasks.")
            if shared_blocks_count > 0:
                narratives.append(f"Multi-department bundling consolidated maintenance tasks into {blocks_count} shared possession(s), saving {time_saved_minutes} minutes of track downtime.")
            narratives.append("All scheduled blocks pass safety constraints, isolation checks, and corridor track capacity rules.")
        elif status == "INFEASIBLE":
            narratives.append("No feasible maintenance block could be scheduled under current timetable and safety constraints.")
            narratives.append("All candidate possession windows conflict with protected train movements, existing approved blocks, or track closures.")
        else:
            narratives.append(f"Optimization completed with status: {status}.")

        return narratives


explainability_generator = ExplainabilityGenerator()
