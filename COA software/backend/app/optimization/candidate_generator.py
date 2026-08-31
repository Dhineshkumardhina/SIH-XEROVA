from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from app.optimization.models import CandidateBlock, OptimizationConfig
from app.services.block_conflict_service import block_conflict_service


class CandidateGenerator:
    """
    Generates discrete candidate possession windows across the planning day
    and pre-evaluates conflicts, train impact, and corridor feasibility.
    """

    @classmethod
    def generate_candidate_windows(
        cls,
        db: Session,
        corridor_id: str,
        planning_date: datetime,
        config: OptimizationConfig
    ) -> List[CandidateBlock]:
        base_date = planning_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Candidate start hours across 24-hour cycle (emphasizing low-traffic night/maintenance hours)
        start_hours = [0, 1, 2, 3, 4, 5, 11, 14, 18, 22]
        
        # Candidate durations between min and max duration
        durations = []
        curr_dur = config.min_block_duration_minutes
        while curr_dur <= config.max_block_duration_minutes:
            durations.append(curr_dur)
            curr_dur += 30 # 30-minute granularity for candidate lengths

        candidates: List[CandidateBlock] = []
        candidate_idx = 0

        for sh in start_hours:
            for dur in durations:
                st = base_date + timedelta(hours=sh)
                et = st + timedelta(minutes=dur)

                # Evaluate candidate window via Phase 16 Conflict Engine
                eval_res = block_conflict_service.evaluate_block(
                    db=db,
                    corridor_id=corridor_id,
                    start_time=st,
                    end_time=et
                )

                cand = CandidateBlock(
                    candidate_id=candidate_idx,
                    start_time=st,
                    end_time=et,
                    duration_minutes=dur,
                    feasible=eval_res["feasible"],
                    conflict_count=eval_res["conflict_count"],
                    severity=eval_res["severity"],
                    train_impact_score=eval_res["train_impact"]["impact_score"],
                    expected_delay_minutes=eval_res["train_impact"]["expected_delay_minutes"],
                    affected_trains=eval_res["train_impact"]["affected_trains"],
                    conflicts=eval_res["conflicts"],
                    affected_train_list=eval_res.get("affected_trains", [])
                )
                candidates.append(cand)
                candidate_idx += 1

        return candidates


candidate_generator = CandidateGenerator()
