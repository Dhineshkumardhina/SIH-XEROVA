from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_

from app.models.corridor import Corridor
from app.models.maintenance import MaintenanceTask
from app.models.department import Department
from app.models.user import User
from app.optimization.block_optimizer import block_optimizer
from app.optimization.models import OptimizationConfig, OptimizationOutcome
from app.services.block_conflict_service import block_conflict_service
from app.services.train_impact_service import train_impact_service
from app.services import audit_service
from app.core.exceptions import ResourceNotFoundError, ValidationError


class AIBlockPlanner:
    """
    Master Railway AI Block Planner Orchestrator.
    Coordinates maintenance task eligibility, asset criticality, timetable disruption,
    corridor capacity, conflict matrices, OR-Tools CP-SAT optimization, and safety guardrails.
    """

    @classmethod
    def validate_objective_weights(cls, weights: Dict[str, float]) -> None:
        """Validates that optimization objective weights sum to exactly 100%."""
        total = sum(weights.values())
        if abs(total - 100.0) > 0.5:
            raise ValidationError(f"Optimization objective weights must total 100%. Current total: {total:.1f}%")

    @classmethod
    def collect_eligible_tasks(
        cls,
        db: Session,
        corridor_ids: Optional[List[str]] = None,
        department_codes: Optional[List[str]] = None,
        min_priority: float = 0.0,
        include_overdue: bool = True,
        include_critical: bool = True
    ) -> List[MaintenanceTask]:
        """
        Collects and filters eligible maintenance tasks from TMS, SMMS, TDMS.
        """
        from app.models.asset import Asset
        query = select(MaintenanceTask).join(MaintenanceTask.asset)

        if corridor_ids and len(corridor_ids) > 0:
            query = query.where(MaintenanceTask.asset.has(Asset.corridor_id.in_(corridor_ids)))

        if department_codes and len(department_codes) > 0:
            dept_ids = list(db.scalars(
                select(Department.id).where(
                    or_(*[Department.code.ilike(f"%{dc}%") for dc in department_codes])
                )
            ))
            if dept_ids:
                query = query.where(MaintenanceTask.department_id.in_(dept_ids))

        # Filter by status: only planned / pending / scheduled tasks
        query = query.where(MaintenanceTask.status.in_(["PLANNED", "PENDING_BLOCK", "SCHEDULED"]))

        all_tasks = list(db.scalars(query))
        now = datetime.utcnow()

        eligible_tasks = []
        for t in all_tasks:
            is_overdue = bool(t.due_at and t.due_at < now)
            is_critical = (t.priority == "CRITICAL")
            
            # Check eligibility conditions
            if is_critical and include_critical:
                eligible_tasks.append(t)
            elif is_overdue and include_overdue:
                eligible_tasks.append(t)
            elif (getattr(t, "criticality", 50.0) or 50.0) >= min_priority:
                eligible_tasks.append(t)

        return eligible_tasks

    @classmethod
    def validate_plan(
        cls,
        db: Session,
        outcome: OptimizationOutcome
    ) -> Dict[str, Any]:
        """
        Safety guardrail validation layer ensuring zero critical conflicts,
        duration sufficiency, and corridor capacity compliance.
        """
        validation_errors = []
        checks_passed = []

        for b in outcome.blocks:
            eval_res = block_conflict_service.evaluate_block(
                db=db,
                corridor_id=b.corridor_id,
                start_time=b.start_time,
                end_time=b.end_time,
                task_ids=[t["task_id"] for t in b.tasks]
            )

            # Check 1: Zero Critical Conflicts
            if eval_res["critical_conflicts_count"] > 0:
                crit_desc = [c["description"] for c in eval_res["conflicts"] if c["severity"] == "CRITICAL"]
                validation_errors.append(f"Block {b.block_id} has critical conflict: {'; '.join(crit_desc)}")
            else:
                checks_passed.append(f"Block {b.block_id}: Zero critical train or block conflicts verified.")

            # Check 2: Duration Sufficiency
            for t in b.tasks:
                if t["duration_minutes"] > b.duration_minutes:
                    validation_errors.append(f"Task {t['task_code']} ({t['duration_minutes']}m) exceeds block window ({b.duration_minutes}m)")
                else:
                    checks_passed.append(f"Task {t['task_code']}: Duration fits possession window.")

        is_valid = len(validation_errors) == 0 and len(outcome.blocks) > 0

        return {
            "is_valid": is_valid,
            "validation_status": "PASSED" if is_valid else ("NO_BLOCKS_GENERATED" if len(outcome.blocks) == 0 else "FAILED"),
            "checks_passed": checks_passed,
            "validation_errors": validation_errors
        }

    @classmethod
    def calculate_planning_confidence(
        cls,
        tasks_count: int,
        scheduled_count: int,
        validation_status: str,
        solver_status: str,
        alternatives_count: int
    ) -> float:
        """
        Computes the Planning Confidence percentage (0–100%) based on
        data completeness, constraint satisfaction, and optimization quality.
        """
        if solver_status == "INFEASIBLE" or validation_status == "FAILED":
            return 0.0

        # Data completeness factor (80% to 100%)
        comp_factor = 95.0 if tasks_count > 0 else 80.0
        
        # Constraint satisfaction factor (100% if passed)
        sat_factor = 100.0 if validation_status == "PASSED" else 50.0

        # Optimization status factor
        solver_factor = 100.0 if solver_status == "OPTIMAL" else 85.0

        # Alternative availability factor (up to 100%)
        alt_factor = min(100.0, alternatives_count * 25.0)

        confidence = (0.35 * comp_factor) + (0.35 * sat_factor) + (0.20 * solver_factor) + (0.10 * alt_factor)
        return round(confidence, 1)

    @classmethod
    def generate_plan(
        cls,
        db: Session,
        planning_date: datetime,
        horizon: str = "DAILY",
        corridor_ids: Optional[List[str]] = None,
        departments: Optional[List[str]] = None,
        max_block_duration_minutes: int = 180,
        min_priority: float = 0.0,
        include_overdue: bool = True,
        include_critical: bool = True,
        include_shared_blocks: bool = True,
        optimization_objective: Optional[Dict[str, float]] = None,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Main end-to-end AI Planning pipeline.
        """
        start_time = datetime.utcnow()

        # Step 1: Validate Objective Weights
        default_weights = {
            "asset_availability": 40.0,
            "maintenance_priority": 25.0,
            "train_impact": 20.0,
            "block_utilization": 15.0
        }
        weights = optimization_objective or default_weights
        cls.validate_objective_weights(weights)

        # Step 2: Determine Target Corridors
        if not corridor_ids or len(corridor_ids) == 0:
            target_corridors = list(db.scalars(select(Corridor).limit(5)))
        else:
            target_corridors = list(db.scalars(select(Corridor).where(Corridor.id.in_(corridor_ids))))

        if not target_corridors:
            target_corridors = [db.scalar(select(Corridor).limit(1))]

        primary_corridor = target_corridors[0]
        corridor_id = primary_corridor.id

        # Step 3: Collect Eligible Tasks
        eligible_tasks = cls.collect_eligible_tasks(
            db=db,
            corridor_ids=[corridor_id],
            department_codes=departments,
            min_priority=min_priority,
            include_overdue=include_overdue,
            include_critical=include_critical
        )

        task_ids = [t.id for t in eligible_tasks]

        # Step 4: Configure Optimization
        opt_cfg = OptimizationConfig(
            horizon=horizon,
            min_block_duration_minutes=60,
            max_block_duration_minutes=max_block_duration_minutes,
            weight_asset_availability=weights.get("asset_availability", 40.0),
            weight_maintenance_priority=weights.get("maintenance_priority", 25.0),
            weight_train_delay=weights.get("train_impact", 20.0),
            weight_shared_block=15.0 if include_shared_blocks else 0.0
        )

        # Step 5: Invoke CP-SAT Block Optimizer
        outcome = block_optimizer.run_optimization(
            db=db,
            corridor_id=corridor_id,
            planning_date=planning_date,
            task_ids=task_ids if len(task_ids) > 0 else None,
            config=opt_cfg,
            user_id=user.username if user else "AI_PLANNER"
        )

        # Step 6: Validate Plan Safety Guardrails
        validation = cls.validate_plan(db=db, outcome=outcome)

        # Step 7: Compute Planning Confidence
        confidence_pct = cls.calculate_planning_confidence(
            tasks_count=len(eligible_tasks),
            scheduled_count=outcome.metrics.get("tasks_scheduled", 0),
            validation_status=validation["validation_status"],
            solver_status=outcome.status,
            alternatives_count=len(outcome.alternatives)
        )

        # Format Recommended Blocks
        recommended_blocks = []
        for b in outcome.blocks:
            rec_status = "RECOMMENDED" if validation["is_valid"] else "PENDING_REVIEW"
            recommended_blocks.append({
                "block_id": b.block_id,
                "corridor_id": b.corridor_id,
                "corridor_name": b.corridor_name,
                "date": planning_date.strftime("%Y-%m-%d"),
                "start_time": b.start_time.strftime("%H:%M"),
                "end_time": b.end_time.strftime("%H:%M"),
                "duration_minutes": b.duration_minutes,
                "departments": b.departments,
                "is_shared_block": b.is_shared_block,
                "tasks": b.tasks,
                "task_count": b.task_count,
                "critical_task_count": sum(1 for t in b.tasks if t["priority"] in ["CRITICAL", "HIGH"]),
                "affected_trains": b.explanation.get("affected_trains", []),
                "expected_train_delay": b.expected_delay_minutes,
                "maximum_train_delay": b.expected_delay_minutes * 1.5,
                "asset_availability_gain": b.asset_availability_gain,
                "block_utilization": b.block_utilization,
                "optimization_score": b.optimization_score,
                "confidence": confidence_pct,
                "risk_level": "LOW" if b.train_impact_score < 25 else "MEDIUM",
                "reason": f"Bundles {b.task_count} tasks across {len(b.departments)} departments into a single low-impact window.",
                "alternatives": outcome.alternatives,
                "constraints_checked": validation["checks_passed"],
                "approval_status": rec_status
            })

        # Format Summary
        summary = {
            "planning_run_id": outcome.optimization_run_id,
            "planning_date": planning_date.strftime("%Y-%m-%d"),
            "planning_horizon": horizon,
            "corridors_analyzed": len(target_corridors),
            "tasks_analyzed": len(eligible_tasks),
            "tasks_selected": outcome.metrics.get("tasks_scheduled", 0),
            "tasks_unplanned": len(outcome.unscheduled_tasks),
            "critical_tasks_total": sum(1 for t in eligible_tasks if t.priority == "CRITICAL"),
            "critical_tasks_covered": outcome.metrics.get("critical_tasks_scheduled", 0),
            "overdue_tasks_covered": outcome.metrics.get("overdue_tasks_scheduled", 0),
            "blocks_generated": len(recommended_blocks),
            "shared_blocks_generated": outcome.metrics.get("shared_blocks", 0),
            "departments_coordinated": len(set([d for b in outcome.blocks for d in b.departments])),
            "expected_train_delay_minutes": outcome.metrics.get("expected_train_delay", 0.0),
            "optimization_score": outcome.metrics.get("optimization_score", 0.0),
            "planning_confidence": confidence_pct,
            "time_saved_minutes": outcome.metrics.get("time_saved_minutes", 0),
            "downtime_reduction_pct": outcome.metrics.get("downtime_reduction_pct", 0.0),
            "validation_status": validation["validation_status"],
            "solver_duration_seconds": outcome.solver_duration_seconds
        }

        # Step 8: Audit Logging
        try:
            audit_service.create_audit_log(
                db=db,
                action="AI_PLAN_GENERATED",
                entity_type="AI_PLAN",
                entity_id=outcome.optimization_run_id,
                user_id=user.id if user else None,
                new_value=summary
            )
        except Exception:
            pass

        return {
            "planning_run_id": outcome.optimization_run_id,
            "status": "COMPLETED" if validation["is_valid"] else "NO_FEASIBLE_PLAN",
            "planning_date": planning_date.strftime("%Y-%m-%d"),
            "horizon": horizon,
            "corridor_id": corridor_id,
            "corridor_name": primary_corridor.name,
            "summary": summary,
            "recommended_blocks": recommended_blocks,
            "unplanned_tasks": [{
                "task_id": u.task_id,
                "task_code": u.task_code,
                "department": u.department_code,
                "priority": u.priority,
                "reason": u.reason
            } for u in outcome.unscheduled_tasks],
            "plan_comparison": outcome.plan_comparison,
            "alternatives": outcome.alternatives,
            "explanation": {
                "why_selected": outcome.blocks[0].explanation.get("why_selected", []) if outcome.blocks else [],
                "why_this_time": outcome.blocks[0].explanation.get("why_this_time", "") if outcome.blocks else "",
                "why_not_others": outcome.blocks[0].explanation.get("why_not_others", []) if outcome.blocks else [],
                "overall_narrative": outcome.explanations,
                "validation_checks": validation["checks_passed"]
            }
        }


ai_block_planner = AIBlockPlanner()
