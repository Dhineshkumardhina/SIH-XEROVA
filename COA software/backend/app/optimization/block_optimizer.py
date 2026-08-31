import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select
from ortools.sat.python import cp_model

from app.models.corridor import Corridor
from app.models.maintenance import MaintenanceTask
from app.models.optimization import OptimizationRun, OptimizationResult
from app.optimization.models import (
    OptimizationConfig,
    OptimizationContext,
    TaskWrapper,
    CandidateBlock,
    OptimizedBlock,
    UnscheduledTask,
    OptimizationOutcome
)
from app.optimization.candidate_generator import candidate_generator
from app.optimization.constraints import constraint_builder
from app.optimization.objective import objective_builder
from app.optimization.explainability import explainability_generator
from app.core.exceptions import ResourceNotFoundError


class BlockOptimizer:
    """
    Automatic Railway Maintenance Block Optimizer powered by Google OR-Tools CP-SAT.
    Integrates Train Impact, Block Conflict, and Multi-Department Bundling.
    """

    @classmethod
    def _map_priority_weight(cls, priority: str) -> float:
        p = (priority or "MEDIUM").upper()
        if p == "CRITICAL":
            return 100.0
        elif p == "HIGH":
            return 70.0
        elif p == "MEDIUM":
            return 40.0
        else:
            return 20.0

    @classmethod
    def _load_tasks(
        cls,
        db: Session,
        corridor_id: str,
        task_ids: Optional[List[str]] = None
    ) -> List[TaskWrapper]:
        query = select(MaintenanceTask).join(MaintenanceTask.asset).where(
            MaintenanceTask.asset.has(corridor_id=corridor_id)
        )
        if task_ids and len(task_ids) > 0:
            query = select(MaintenanceTask).where(MaintenanceTask.id.in_(task_ids))
        else:
            query = query.where(MaintenanceTask.status.in_(["PLANNED", "PENDING_BLOCK", "SCHEDULED"]))

        tasks_db = list(db.scalars(query))
        
        # If no tasks found and no task_ids explicitly passed, fetch any available tasks on corridor assets
        if not tasks_db and not task_ids:
            tasks_db = list(db.scalars(
                select(MaintenanceTask).join(MaintenanceTask.asset).where(
                    MaintenanceTask.asset.has(corridor_id=corridor_id)
                ).limit(10)
            ))

        now = datetime.utcnow()
        task_wrappers = []
        for t in tasks_db:
            dept_code = t.department.code if t.department else "ENG"
            asset_crit = t.criticality if getattr(t, 'criticality', None) is not None else (t.asset.criticality_score if (t.asset and getattr(t.asset, 'criticality_score', None) is not None) else 50.0)
            is_overdue = bool(t.due_at and t.due_at < now)
            prio_weight = cls._map_priority_weight(t.priority)

            task_wrappers.append(TaskWrapper(
                id=t.id,
                code=t.task_code,
                department_id=t.department_id,
                department_code=dept_code,
                asset_id=t.asset_id,
                asset_name=t.asset.name if t.asset else t.asset_id,
                asset_criticality=asset_crit,
                description=t.description or "",
                duration_minutes=t.duration_minutes or 60,
                priority=t.priority or "MEDIUM",
                priority_weight=prio_weight,
                is_overdue=is_overdue,
                isolation_required=t.isolation_required or False,
                due_date=t.due_at,
                preferred_start=t.preferred_start_at,
                preferred_end=t.preferred_end_at
            ))

        return task_wrappers

    @classmethod
    def calculate_baseline_plan(cls, tasks: List[TaskWrapper]) -> Dict[str, Any]:
        """
        Calculates baseline metrics assuming unbundled sequential departmental possessions.
        """
        total_minutes = sum(t.duration_minutes for t in tasks)
        by_dept: Dict[str, List[TaskWrapper]] = {}
        for t in tasks:
            by_dept.setdefault(t.department_code, []).append(t)

        dept_blocks = []
        for d_code, d_tasks in by_dept.items():
            dur = sum(t.duration_minutes for t in d_tasks)
            dept_blocks.append({
                "department": d_code,
                "task_count": len(d_tasks),
                "duration_minutes": dur
            })

        return {
            "total_baseline_minutes": total_minutes,
            "department_block_count": len(by_dept),
            "department_breakdown": dept_blocks
        }

    @classmethod
    def run_optimization(
        cls,
        db: Session,
        corridor_id: str,
        planning_date: datetime,
        task_ids: Optional[List[str]] = None,
        config: Optional[OptimizationConfig] = None,
        user_id: Optional[str] = None
    ) -> OptimizationOutcome:
        start_exec_time = time.time()
        cfg = config or OptimizationConfig()

        # Load corridor
        corridor = db.scalar(select(Corridor).where(Corridor.id == corridor_id))
        if not corridor:
            raise ResourceNotFoundError("Corridor", corridor_id)

        # Load task wrappers
        tasks = cls._load_tasks(db=db, corridor_id=corridor_id, task_ids=task_ids)
        
        # Calculate baseline metrics
        baseline = cls.calculate_baseline_plan(tasks)

        # Generate candidate windows
        candidates = candidate_generator.generate_candidate_windows(
            db=db,
            corridor_id=corridor_id,
            planning_date=planning_date,
            config=cfg
        )

        context = OptimizationContext(
            planning_date=planning_date,
            corridor_id=corridor.id,
            corridor_name=corridor.name,
            corridor_track_count=corridor.track_count or 2,
            config=cfg,
            tasks=tasks,
            candidates=candidates
        )

        # Build CP-SAT Model
        model = cp_model.CpModel()

        # Decision Variables
        x_block = {c.candidate_id: model.NewBoolVar(f"x_{c.candidate_id}") for c in candidates}
        y_task_block = {}
        for t in tasks:
            for c in candidates:
                y_task_block[(t.id, c.candidate_id)] = model.NewBoolVar(f"y_{t.id}_{c.candidate_id}")
        u_task = {t.id: model.NewBoolVar(f"u_{t.id}") for t in tasks}

        # Apply Constraints
        constraint_builder.add_all_constraints(
            model=model,
            context=context,
            x_block=x_block,
            y_task_block=y_task_block,
            u_task=u_task
        )

        # Apply Objective
        objective_builder.set_objective(
            model=model,
            context=context,
            x_block=x_block,
            y_task_block=y_task_block,
            u_task=u_task
        )

        # Configure Solver
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = cfg.solver_max_time_seconds
        solver.parameters.num_search_workers = cfg.num_search_workers
        solver.parameters.log_search_progress = False

        solve_status = solver.Solve(model)
        solver_duration = round(time.time() - start_exec_time, 3)

        status_map = {
            cp_model.OPTIMAL: "OPTIMAL",
            cp_model.FEASIBLE: "FEASIBLE",
            cp_model.INFEASIBLE: "INFEASIBLE",
            cp_model.MODEL_INVALID: "MODEL_INVALID",
            cp_model.UNKNOWN: "UNKNOWN"
        }
        outcome_status = status_map.get(solve_status, "UNKNOWN")

        # Parse Solution
        optimized_blocks: List[OptimizedBlock] = []
        unscheduled: List[UnscheduledTask] = []
        scheduled_task_ids = set()

        if solve_status in [cp_model.OPTIMAL, cp_model.FEASIBLE]:
            for c in candidates:
                if solver.Value(x_block[c.candidate_id]) == 1:
                    # Collect tasks assigned to this block
                    block_tasks: List[TaskWrapper] = []
                    for t in tasks:
                        if solver.Value(y_task_block[(t.id, c.candidate_id)]) == 1:
                            block_tasks.append(t)
                            scheduled_task_ids.add(t.id)

                    dept_set = list(set(t.department_code for t in block_tasks))
                    maint_mins = sum(t.duration_minutes for t in block_tasks)
                    utilization = min(100.0, round((maint_mins / max(1, c.duration_minutes)) * 100.0, 1))
                    
                    # Compute availability gain
                    avail_gain = round(sum((t.asset_criticality / 100.0) * 4.5 for t in block_tasks), 1)

                    # Compute normalized block score (0-100)
                    cov_pct = (len(block_tasks) / max(1, len(tasks))) * 100.0
                    impact_deduction = c.train_impact_score * 0.3
                    delay_deduction = min(30.0, c.expected_delay_minutes * 0.5)
                    opt_score = max(10.0, min(99.0, round((cov_pct * 0.5) + (utilization * 0.3) + 20.0 - impact_deduction - delay_deduction, 1)))

                    # Generate block explanation
                    block_dict = {
                        "start_time": c.start_time,
                        "end_time": c.end_time,
                        "duration_minutes": c.duration_minutes,
                        "block_utilization": utilization,
                        "expected_delay_minutes": c.expected_delay_minutes,
                        "affected_trains_count": c.affected_trains
                    }
                    expl = explainability_generator.generate_block_explanation(
                        block=block_dict,
                        scheduled_tasks=block_tasks,
                        candidates=candidates,
                        baseline_duration_minutes=baseline["total_baseline_minutes"]
                    )

                    opt_block = OptimizedBlock(
                        block_id=f"BLK-OPT-{c.start_time.strftime('%H%M')}-{c.end_time.strftime('%H%M')}",
                        corridor_id=corridor.id,
                        corridor_name=corridor.name,
                        start_time=c.start_time,
                        end_time=c.end_time,
                        duration_minutes=c.duration_minutes,
                        departments=dept_set,
                        is_shared_block=len(dept_set) > 1,
                        tasks=[{
                            "task_id": t.id,
                            "task_code": t.code,
                            "department": t.department_code,
                            "asset_id": t.asset_id,
                            "asset_name": t.asset_name,
                            "priority": t.priority,
                            "duration_minutes": t.duration_minutes,
                            "is_overdue": t.is_overdue,
                            "description": t.description
                        } for t in block_tasks],
                        task_count=len(block_tasks),
                        maintenance_minutes=maint_mins,
                        block_utilization=utilization,
                        train_impact_score=c.train_impact_score,
                        expected_delay_minutes=c.expected_delay_minutes,
                        affected_trains_count=c.affected_trains,
                        asset_availability_gain=avail_gain,
                        optimization_score=opt_score,
                        conflicts=c.conflicts,
                        explanation=expl
                    )
                    optimized_blocks.append(opt_block)

        # Identify Unscheduled Tasks
        for t in tasks:
            if t.id not in scheduled_task_ids:
                reason = "Exceeds candidate block duration limits" if t.duration_minutes > cfg.max_block_duration_minutes else "Conflict with train timetable or capacity"
                unscheduled.append(UnscheduledTask(
                    task_id=t.id,
                    task_code=t.code,
                    department_code=t.department_code,
                    priority=t.priority,
                    reason=reason
                ))

        # Metrics & Summary
        tot_opt_mins = sum(b.duration_minutes for b in optimized_blocks)
        time_saved = max(0, baseline["total_baseline_minutes"] - tot_opt_mins)
        downtime_red_pct = round((time_saved / max(1, baseline["total_baseline_minutes"])) * 100.0, 1) if baseline["total_baseline_minutes"] > 0 else 0.0
        avg_score = round(sum(b.optimization_score for b in optimized_blocks) / max(1, len(optimized_blocks)), 1) if optimized_blocks else 0.0

        metrics = {
            "tasks_considered": len(tasks),
            "tasks_scheduled": len(scheduled_task_ids),
            "tasks_unscheduled": len(unscheduled),
            "critical_tasks_scheduled": sum(1 for t in tasks if t.id in scheduled_task_ids and t.priority in ["CRITICAL", "HIGH"]),
            "overdue_tasks_scheduled": sum(1 for t in tasks if t.id in scheduled_task_ids and t.is_overdue),
            "blocks_generated": len(optimized_blocks),
            "shared_blocks": sum(1 for b in optimized_blocks if b.is_shared_block),
            "total_block_minutes": tot_opt_mins,
            "maintenance_minutes": sum(b.maintenance_minutes for b in optimized_blocks),
            "block_utilization": round(sum(b.block_utilization for b in optimized_blocks) / max(1, len(optimized_blocks)), 1) if optimized_blocks else 0.0,
            "expected_train_delay": round(sum(b.expected_delay_minutes for b in optimized_blocks), 1),
            "affected_trains": sum(b.affected_trains_count for b in optimized_blocks),
            "asset_availability_gain": round(sum(b.asset_availability_gain for b in optimized_blocks), 1),
            "optimization_score": avg_score,
            "baseline_block_minutes": baseline["total_baseline_minutes"],
            "optimized_block_minutes": tot_opt_mins,
            "time_saved_minutes": time_saved,
            "downtime_reduction_pct": downtime_red_pct
        }

        plan_comparison = {
            "baseline": {
                "total_duration_minutes": baseline["total_baseline_minutes"],
                "number_of_blocks": baseline["department_block_count"],
                "is_shared": False
            },
            "optimized": {
                "total_duration_minutes": tot_opt_mins,
                "number_of_blocks": len(optimized_blocks),
                "is_shared": any(b.is_shared_block for b in optimized_blocks)
            },
            "savings": {
                "time_saved_minutes": time_saved,
                "downtime_reduction_pct": downtime_red_pct,
                "blocks_consolidated": max(0, baseline["department_block_count"] - len(optimized_blocks))
            }
        }

        # Build Alternatives
        alternatives = []
        for c in candidates:
            if c.feasible and not any(b.start_time == c.start_time and b.end_time == c.end_time for b in optimized_blocks):
                alt_score = max(20.0, round(90.0 - c.train_impact_score * 0.5 - c.expected_delay_minutes * 0.5, 1))
                alternatives.append({
                    "start_time": c.start_time.strftime("%H:%M"),
                    "end_time": c.end_time.strftime("%H:%M"),
                    "duration_minutes": c.duration_minutes,
                    "score": alt_score,
                    "train_impact_score": c.train_impact_score,
                    "expected_delay_minutes": c.expected_delay_minutes,
                    "affected_trains": c.affected_trains,
                    "reason": "Alternative low-traffic window" if c.conflict_count == 0 else f"{c.conflict_count} minor warnings"
                })
        alternatives.sort(key=lambda x: x["score"], reverse=True)
        alternatives = alternatives[:4] # Top 4 alternatives

        # Overall Narrative
        narratives = explainability_generator.generate_overall_narrative(
            status=outcome_status,
            blocks_count=len(optimized_blocks),
            tasks_scheduled=len(scheduled_task_ids),
            tasks_total=len(tasks),
            time_saved_minutes=time_saved,
            shared_blocks_count=metrics["shared_blocks"]
        )

        run_id = f"OPT-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"

        # Persist OptimizationRun in DB
        try:
            opt_run = OptimizationRun(
                run_code=run_id,
                planning_horizon=cfg.horizon,
                corridor_id=corridor.id,
                started_at=planning_date,
                completed_at=datetime.utcnow(),
                status=outcome_status,
                objective_config={
                    "weights": {
                        "maintenance_priority": cfg.weight_maintenance_priority,
                        "asset_availability": cfg.weight_asset_availability,
                        "shared_block": cfg.weight_shared_block,
                        "train_delay": cfg.weight_train_delay
                    }
                },
                solver_name="OR_TOOLS_CP_SAT",
                solver_version="9.15",
                created_by=user_id or "AI_PLANNER"
            )
            db.add(opt_run)
            db.commit()
        except Exception:
            db.rollback()

        return OptimizationOutcome(
            optimization_run_id=run_id,
            status=outcome_status,
            planning_horizon=cfg.horizon,
            planning_date=planning_date.strftime("%Y-%m-%d"),
            corridor_id=corridor.id,
            corridor_name=corridor.name,
            solver_duration_seconds=solver_duration,
            objective_value=float(solver.ObjectiveValue()) if solve_status in [cp_model.OPTIMAL, cp_model.FEASIBLE] else 0.0,
            blocks=optimized_blocks,
            unscheduled_tasks=unscheduled,
            metrics=metrics,
            baseline_plan=baseline,
            plan_comparison=plan_comparison,
            alternatives=alternatives,
            explanations=narratives
        )


block_optimizer = BlockOptimizer()
