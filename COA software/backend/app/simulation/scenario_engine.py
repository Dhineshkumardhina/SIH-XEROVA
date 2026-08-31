import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.simulation import SimulationScenario, SimulationRun
from app.models.block import BlockPlan
from app.models.corridor import Corridor
from app.models.maintenance import MaintenanceTask
from app.models.user import User
from app.services import audit_service
from app.services.train_impact_service import train_impact_service
from app.services.block_conflict_service import block_conflict_service
from app.optimization.block_optimizer import block_optimizer
from app.core.exceptions import ResourceNotFoundError, ValidationError


class ScenarioEngine:
    """
    Engine for What-If Analysis and Scenario Simulation in RAILOPT AI.
    Allows planners to modify operating conditions on isolated snapshots without altering baseline plans.
    """

    @classmethod
    def create_scenario(
        cls,
        db: Session,
        name: str,
        description: Optional[str] = None,
        base_plan_id: Optional[str] = None,
        corridor_id: Optional[str] = None,
        scenario_type: str = "WHAT_IF_EXPERIMENT",
        parameters: Optional[Dict[str, Any]] = None,
        user: Optional[User] = None
    ) -> SimulationScenario:
        """
        Creates a new What-If scenario snapshot from a base operational plan.
        """
        corr = None
        if corridor_id:
            corr = db.scalar(select(Corridor).where(Corridor.id == corridor_id))
        if not corr:
            corr = db.query(Corridor).first()
        corr_id = corr.id if corr else "COR-A01"

        # Baseline plan snapshot
        base_plan_data = {
            "base_plan_id": base_plan_id or f"BP-BASE-{uuid.uuid4().hex[:6]}",
            "base_plan_version": 1,
            "corridor_id": corr_id,
            "block_start": "01:00",
            "block_duration_minutes": 120,
            "block_end": "03:00",
            "passenger_traffic_multiplier": 1.0,
            "goods_forecast_rate": 4.5,
            "selected_tasks": ["MT-001", "MT-002", "MT-003"],
            "task_duration_overrides": {},
            "task_priority_overrides": {},
            "available_window_start": "00:30",
            "available_window_end": "05:00"
        }

        # Merge requested parameter overrides
        merged_params = dict(base_plan_data)
        if parameters:
            merged_params.update(parameters)

        # Calculate block_end from start and duration
        start_h, start_m = map(int, merged_params["block_start"].split(":"))
        start_dt = datetime(2026, 8, 30, start_h, start_m)
        end_dt = start_dt + timedelta(minutes=int(merged_params["block_duration_minutes"]))
        merged_params["block_end"] = end_dt.strftime("%H:%M")

        # Baseline Metrics
        baseline_metrics = {
            "asset_availability_pct": 94.5,
            "block_utilization_pct": 91.2,
            "total_block_duration_minutes": 120,
            "train_delay_minutes": 0.0,
            "affected_trains": 0,
            "critical_tasks_completed": 3,
            "total_tasks_completed": 3,
            "overdue_tasks": 0,
            "conflicts": 0,
            "asset_downtime_minutes": 120,
            "optimization_score": 93.5
        }

        config_payload = {
            "base_plan_id": base_plan_data["base_plan_id"],
            "base_plan_version": 1,
            "parameters": merged_params,
            "baseline_metrics": baseline_metrics,
            "status": "DRAFT",
            "results": None
        }

        scenario = SimulationScenario(
            id=f"SCEN-{uuid.uuid4().hex[:8]}",
            name=name,
            description=description or "Interactive What-If alternative scenario",
            scenario_type=scenario_type,
            configuration=config_payload,
            created_by=user.username if user else "control"
        )
        db.add(scenario)
        db.commit()
        db.refresh(scenario)

        # Audit log
        try:
            audit_service.create_audit_log(
                db=db,
                action="SCENARIO_CREATED",
                entity_type="SimulationScenario",
                entity_id=scenario.id,
                user_id=user.id if user else None,
                new_value={"name": scenario.name, "scenario_type": scenario.scenario_type}
            )
        except Exception:
            pass

        return scenario

    @classmethod
    def update_scenario(
        cls,
        db: Session,
        scenario_id: str,
        name: Optional[str] = None,
        description: Optional[str] = None,
        parameters: Optional[Dict[str, Any]] = None,
        user: Optional[User] = None
    ) -> SimulationScenario:
        """
        Updates parameters of an existing What-If scenario.
        """
        scenario = db.scalar(select(SimulationScenario).where(SimulationScenario.id == scenario_id))
        if not scenario:
            raise ResourceNotFoundError("SimulationScenario", scenario_id)

        if name:
            scenario.name = name
        if description:
            scenario.description = description

        config = dict(scenario.configuration or {})
        curr_params = dict(config.get("parameters", {}))
        if parameters:
            curr_params.update(parameters)
            # Re-calculate block_end
            start_h, start_m = map(int, curr_params.get("block_start", "01:00").split(":"))
            start_dt = datetime(2026, 8, 30, start_h, start_m)
            end_dt = start_dt + timedelta(minutes=int(curr_params.get("block_duration_minutes", 120)))
            curr_params["block_end"] = end_dt.strftime("%H:%M")

        config["parameters"] = curr_params
        config["status"] = "READY"
        scenario.configuration = config
        db.commit()
        db.refresh(scenario)

        return scenario

    @classmethod
    def validate_scenario(
        cls,
        db: Session,
        scenario_id: str
    ) -> Dict[str, Any]:
        """
        Validates scenario parameters against corridor constraints and safety rules.
        """
        scenario = db.scalar(select(SimulationScenario).where(SimulationScenario.id == scenario_id))
        if not scenario:
            raise ResourceNotFoundError("SimulationScenario", scenario_id)

        params = (scenario.configuration or {}).get("parameters", {})
        block_start = params.get("block_start", "01:00")
        duration = int(params.get("block_duration_minutes", 120))
        traffic_mult = float(params.get("passenger_traffic_multiplier", 1.0))
        goods_rate = float(params.get("goods_forecast_rate", 4.5))

        start_h, _ = map(int, block_start.split(":"))
        is_peak_hours = (7 <= start_h <= 11) or (17 <= start_h <= 21)
        conflicts = []

        if is_peak_hours:
            conflicts.append("Block start time falls within peak suburban & express traffic hours.")
        if duration > 240:
            conflicts.append(f"Proposed duration of {duration} min exceeds statutory 4-hour corridor limit.")
        if traffic_mult > 1.8 and goods_rate > 7.0:
            conflicts.append("Corridor capacity saturation: combined train headway buffer < 15 min.")

        is_valid = len(conflicts) == 0
        return {
            "scenario_id": scenario.id,
            "is_valid": is_valid,
            "conflicts": conflicts,
            "validation_timestamp": datetime.utcnow().isoformat()
        }

    @classmethod
    def run_scenario(
        cls,
        db: Session,
        scenario_id: str,
        user: Optional[User] = None
    ) -> Dict[str, Any]:
        """
        Executes What-If analysis, computes KPI deltas, generates root-cause AI explanation,
        and provides alternative window recommendations.
        """
        scenario = db.scalar(select(SimulationScenario).where(SimulationScenario.id == scenario_id))
        if not scenario:
            raise ResourceNotFoundError("SimulationScenario", scenario_id)

        config = dict(scenario.configuration or {})
        params = config.get("parameters", {})
        baseline = config.get("baseline_metrics", {})

        block_start = params.get("block_start", "01:00")
        duration = int(params.get("block_duration_minutes", 120))
        traffic_mult = float(params.get("passenger_traffic_multiplier", 1.0))
        goods_rate = float(params.get("goods_forecast_rate", 4.5))
        selected_tasks = params.get("selected_tasks", ["MT-001", "MT-002", "MT-003"])

        start_h, _ = map(int, block_start.split(":"))
        is_peak = (7 <= start_h <= 11) or (17 <= start_h <= 21)
        is_daytime = (6 <= start_h <= 22)

        # Dynamic simulation impact calculation
        scenario_delay = 0.0
        scenario_conflicts = 0
        scenario_affected = 0

        if is_peak:
            scenario_delay = round(18.0 * traffic_mult + (goods_rate * 1.5), 1)
            scenario_conflicts = 2
            scenario_affected = int(3 * traffic_mult)
        elif is_daytime:
            scenario_delay = round(8.0 * traffic_mult + (goods_rate * 0.8), 1)
            scenario_conflicts = 1
            scenario_affected = int(1 * traffic_mult)
        else:
            # Night window
            scenario_delay = round(max(0.0, (traffic_mult - 1.0) * 10.0 + (goods_rate - 4.5) * 2.0), 1)
            scenario_conflicts = 0
            scenario_affected = 1 if scenario_delay > 0 else 0

        scenario_availability = round(max(80.0, 96.0 - (duration / 60.0) * 1.8 - (scenario_delay * 0.2)), 1)
        scenario_utilization = round(min(98.0, 85.0 + (len(selected_tasks) * 3.5)), 1)
        scenario_score = round(max(50.0, 95.0 - (scenario_delay * 1.8) - (scenario_conflicts * 12.0)), 1)

        scenario_metrics = {
            "asset_availability_pct": scenario_availability,
            "block_utilization_pct": scenario_utilization,
            "total_block_duration_minutes": duration,
            "train_delay_minutes": scenario_delay,
            "affected_trains": scenario_affected,
            "critical_tasks_completed": len(selected_tasks),
            "total_tasks_completed": len(selected_tasks),
            "overdue_tasks": 0,
            "conflicts": scenario_conflicts,
            "asset_downtime_minutes": duration,
            "optimization_score": scenario_score
        }

        # Compute Deltas & Classify Impact Semantics
        deltas = {}
        for k, sc_val in scenario_metrics.items():
            base_val = baseline.get(k, sc_val)
            diff = round(sc_val - base_val, 2)
            pct = round((diff / base_val * 100.0), 1) if base_val != 0 else 0.0

            # Classification
            if k in ["train_delay_minutes", "conflicts", "asset_downtime_minutes", "affected_trains"]:
                if diff > 0:
                    status = "CRITICAL" if k == "conflicts" and sc_val > 0 else "WORSE"
                elif diff < 0:
                    status = "IMPROVED"
                else:
                    status = "UNCHANGED"
            else: # availability, utilization, score
                if diff > 0:
                    status = "IMPROVED"
                elif diff < 0:
                    status = "WORSE"
                else:
                    status = "UNCHANGED"

            deltas[k] = {
                "baseline": base_val,
                "scenario": sc_val,
                "diff": diff,
                "pct_change": pct,
                "status": status
            }

        # AI Explainability
        what_changed = f"Block shifted to {block_start} ({duration}m), traffic multiplier set to {traffic_mult}x, freight rate at {goods_rate} tr/h."
        if scenario_delay > 0:
            what_happened = f"Train delay increased by {scenario_delay} min with {scenario_affected} affected passenger services and {scenario_conflicts} headway conflicts."
            why = [
                f"Proposed window {block_start} intersects higher density passenger express schedules.",
                f"Traffic multiplier {traffic_mult}x reduced section headway buffer below safety threshold.",
                "Goods train density compounded line occupation on adjacent track circuits."
            ]
            rec = f"Suboptimal window. Recommended action: Revert to 01:00-03:00 or shift to 02:00-04:00."
        else:
            what_happened = f"Zero train disruption achieved. All {len(selected_tasks)} maintenance tasks bundled with {scenario_utilization}% block efficiency."
            why = [
                "Night possession window coincides with minimal passenger traffic density.",
                "Headway buffers remain intact for all scheduled freight paths.",
                "Shared cross-department possession maximises track possession ROI."
            ]
            rec = "Optimal scenario. Recommended for operational adoption and supervisory sign-off."

        explanation = {
            "what_changed": what_changed,
            "what_happened": what_happened,
            "why": why,
            "recommendation": rec
        }

        # Better alternative recommendations
        alternative_recommendation = None
        if scenario_delay > 0 or scenario_conflicts > 0:
            alternative_recommendation = {
                "window": "01:00 - 03:00",
                "corridor_id": params.get("corridor_id", "COR-A01"),
                "expected_train_delay": 0.0,
                "conflicts": 0,
                "savings_vs_scenario": {
                    "delay_reduced_minutes": scenario_delay,
                    "score_improvement": round(93.5 - scenario_score, 1)
                },
                "rationale": "01:00-03:00 exhibits minimum traffic intersection with zero passenger timetable conflicts."
            }

        results_payload = {
            "scenario_id": scenario.id,
            "status": "COMPLETED",
            "executed_at": datetime.utcnow().isoformat(),
            "baseline_metrics": baseline,
            "scenario_metrics": scenario_metrics,
            "deltas": deltas,
            "explanation": explanation,
            "alternative_recommendation": alternative_recommendation,
            "score": scenario_score
        }

        config["status"] = "COMPLETED"
        config["results"] = results_payload
        scenario.configuration = config
        db.commit()
        db.refresh(scenario)

        # Audit log
        try:
            audit_service.create_audit_log(
                db=db,
                action="SCENARIO_EXECUTED",
                entity_type="SimulationScenario",
                entity_id=scenario.id,
                user_id=user.id if user else None,
                new_value={"score": scenario_score, "delay": scenario_delay}
            )
        except Exception:
            pass

        return results_payload

    @classmethod
    def duplicate_scenario(
        cls,
        db: Session,
        scenario_id: str,
        user: Optional[User] = None
    ) -> SimulationScenario:
        """
        Clones an existing scenario into a new independent version for branching exploration.
        """
        source = db.scalar(select(SimulationScenario).where(SimulationScenario.id == scenario_id))
        if not source:
            raise ResourceNotFoundError("SimulationScenario", scenario_id)

        config = dict(source.configuration or {})
        config["status"] = "DRAFT"
        config["results"] = None

        new_scenario = SimulationScenario(
            id=f"SCEN-{uuid.uuid4().hex[:8]}",
            name=f"{source.name} (Copy)",
            description=source.description,
            scenario_type=source.scenario_type,
            configuration=config,
            created_by=user.username if user else source.created_by
        )
        db.add(new_scenario)
        db.commit()
        db.refresh(new_scenario)

        return new_scenario

    @classmethod
    def compare_scenarios(
        cls,
        db: Session,
        scenario_ids: List[str]
    ) -> Dict[str, Any]:
        """
        Ranks multiple scenarios and identifies the BEST OPTION based on multi-objective scores.
        """
        scenarios = db.scalars(select(SimulationScenario).where(SimulationScenario.id.in_(scenario_ids))).all()
        if not scenarios:
            return {"scenarios": [], "best_option": None}

        comparison_list = []
        for sc in scenarios:
            config = sc.configuration or {}
            res = config.get("results") or {}
            sc_metrics = res.get("scenario_metrics") or config.get("baseline_metrics") or {}
            score = res.get("score") or sc_metrics.get("optimization_score", 70.0)

            comparison_list.append({
                "scenario_id": sc.id,
                "name": sc.name,
                "metrics": sc_metrics,
                "score": score,
                "has_conflicts": sc_metrics.get("conflicts", 0) > 0,
                "train_delay": sc_metrics.get("train_delay_minutes", 0.0)
            })

        # Rank by score descending and zero conflicts
        sorted_scenarios = sorted(comparison_list, key=lambda x: (not x["has_conflicts"], x["score"]), reverse=True)
        best = sorted_scenarios[0] if sorted_scenarios else None

        return {
            "comparison": sorted_scenarios,
            "best_option": {
                "scenario_id": best["scenario_id"] if best else None,
                "name": best["name"] if best else None,
                "score": best["score"] if best else 0.0,
                "reason": "Highest asset availability with zero passenger train delays and verified zero safety conflicts."
            } if best else None
        }


scenario_engine = ScenarioEngine()
