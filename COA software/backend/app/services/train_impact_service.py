import time
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, and_, or_, func

from app.models.train import Train, TrainSchedule, TrainMovement, GoodsForecast, TrainType
from app.models.corridor import Corridor
from app.models.block import BlockRequest, BlockPlan, BlockRequestStatus
from app.models.train_impact import TrainImpact
from app.core.exceptions import ResourceNotFoundError


class TrainImpactService:
    """
    Train Impact Simulation and Decision-Support Engine for RAILOPT AI.
    Calculates operational delays, affected passenger and goods traffic,
    clearance buffers, and alternative lower-impact windows for maintenance blocks.
    """

    # Configurable Impact Thresholds (minutes)
    DELAY_THRESHOLDS = {
        "NO_IMPACT": 0.0,
        "LOW": 5.0,        # 1 - 5 mins
        "MEDIUM": 15.0,    # 6 - 15 mins
        "HIGH": 30.0,      # 16 - 30 mins
        "CRITICAL": 30.0   # > 30 mins
    }

    # Configurable Train Type Delay Absorption Factor
    TRAIN_TYPE_FACTORS = {
        "SUPERFAST": 1.20,
        "EXPRESS": 1.10,
        "PASSENGER": 1.00,
        "SPECIAL": 1.00,
        "GOODS": 0.80,
        "MAINTENANCE": 0.50
    }

    # Synthetic Passenger Load Estimates (for demonstration only)
    PASSENGER_LOAD_ESTIMATES = {
        "SUPERFAST": 1200,
        "EXPRESS": 950,
        "PASSENGER": 600,
        "SPECIAL": 500,
        "GOODS": 0,
        "MAINTENANCE": 0
    }

    # Operational Clearance Buffer (minutes)
    CLEARANCE_BUFFER_MINUTES = 5

    # Formula Weights for 0-100 Impact Score
    SCORE_WEIGHTS = {
        "delay": 0.30,
        "train_count": 0.20,
        "passenger": 0.20,
        "goods": 0.10,
        "priority": 0.10,
        "traffic_density": 0.10
    }

    @classmethod
    def _normalize_dt(cls, dt: Optional[datetime]) -> Optional[datetime]:
        if not dt:
            return None
        return dt.replace(tzinfo=None)

    @classmethod
    def find_affected_trains(
        cls,
        db: Session,
        corridor_id: str,
        start_time: datetime,
        end_time: datetime,
        buffer_minutes: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Finds all trains whose schedule or movement window intersects with the block window
        (including the operational clearance buffer).
        """
        start_naive = cls._normalize_dt(start_time)
        end_naive = cls._normalize_dt(end_time)

        buffered_start = start_naive - timedelta(minutes=buffer_minutes)
        buffered_end = end_naive + timedelta(minutes=buffer_minutes)

        # Query schedules overlapping buffered window
        schedules = db.scalars(
            select(TrainSchedule)
            .options(joinedload(TrainSchedule.train), joinedload(TrainSchedule.station))
            .where(
                TrainSchedule.corridor_id == corridor_id,
                or_(
                    and_(
                        TrainSchedule.arrival_time <= buffered_end,
                        TrainSchedule.departure_time >= buffered_start
                    ),
                    and_(
                        TrainSchedule.departure_time == None,
                        TrainSchedule.arrival_time >= buffered_start,
                        TrainSchedule.arrival_time <= buffered_end
                    ),
                    and_(
                        TrainSchedule.arrival_time == None,
                        TrainSchedule.departure_time >= buffered_start,
                        TrainSchedule.departure_time <= buffered_end
                    )
                )
            )
        ).all()

        # Group by train and consolidate corridor entry/exit times
        train_map: Dict[str, Dict[str, Any]] = {}

        for sched in schedules:
            t = sched.train
            if not t:
                continue

            arr = cls._normalize_dt(sched.arrival_time)
            dep = cls._normalize_dt(sched.departure_time)
            t_start = arr or dep
            t_end = dep or arr

            if t.id not in train_map:
                direction = (sched.direction or t.default_direction or "UP").upper()
                train_type = (t.train_type or "EXPRESS").upper()
                passengers = cls.PASSENGER_LOAD_ESTIMATES.get(train_type, 600)

                train_map[t.id] = {
                    "train_id": t.id,
                    "train_number": t.train_number,
                    "train_name": t.train_name,
                    "train_type": train_type,
                    "direction": direction,
                    "priority": t.priority,
                    "status": t.status,
                    "origin": t.origin,
                    "destination": t.destination,
                    "corridor_entry": t_start,
                    "corridor_exit": t_end,
                    "passengers_estimated": passengers,
                    "is_passenger": train_type in ["PASSENGER", "EXPRESS", "SUPERFAST"],
                    "is_goods": train_type == "GOODS",
                    "schedules": []
                }
            else:
                entry = train_map[t.id]["corridor_entry"]
                exit_ = train_map[t.id]["corridor_exit"]
                if t_start and (not entry or t_start < entry):
                    train_map[t.id]["corridor_entry"] = t_start
                if t_end and (not exit_ or t_end > exit_):
                    train_map[t.id]["corridor_exit"] = t_end

            train_map[t.id]["schedules"].append(sched)

        return list(train_map.values())

    @classmethod
    def calculate_train_impact(
        cls,
        db: Session,
        corridor_id: str,
        start_time: datetime,
        end_time: datetime,
        block_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Simulates operational train impact, delay metrics, and explanations for a proposed block.
        """
        start_naive = cls._normalize_dt(start_time)
        end_naive = cls._normalize_dt(end_time)

        if end_naive <= start_naive:
            raise ValueError("end_time must be strictly after start_time")

        block_duration_minutes = max(1, int((end_naive - start_naive).total_seconds() / 60))

        # Check corridor
        corridor = db.scalar(select(Corridor).where(Corridor.id == corridor_id))
        if not corridor:
            raise ResourceNotFoundError("Corridor", corridor_id)

        # 1. Fetch Candidate Affected Trains
        candidate_trains = cls.find_affected_trains(
            db=db,
            corridor_id=corridor_id,
            start_time=start_naive,
            end_time=end_naive,
            buffer_minutes=cls.CLEARANCE_BUFFER_MINUTES
        )

        affected_trains_details = []
        total_expected_delay = 0.0
        max_possible_delay = 0.0
        passenger_trains_count = 0
        goods_trains_count = 0
        express_trains_count = 0
        superfast_trains_count = 0
        special_trains_count = 0
        maintenance_trains_count = 0
        up_trains_count = 0
        down_trains_count = 0
        total_passengers_affected = 0
        highest_priority = "LOW"

        for t in candidate_trains:
            t_entry = t["corridor_entry"]
            t_exit = t["corridor_exit"]

            if not t_entry or not t_exit:
                continue

            # Calculate exact overlap in minutes
            overlap_start = max(t_entry, start_naive)
            overlap_end = min(t_exit, end_naive)
            
            # Check if strictly inside block vs buffer zone
            is_direct_overlap = (t_entry < end_naive) and (t_exit > start_naive)
            is_buffer_conflict = False

            if is_direct_overlap:
                overlap_minutes = max(1.0, (overlap_end - overlap_start).total_seconds() / 60.0)
            else:
                # Arriving or departing inside 5-min clearance buffer
                overlap_minutes = float(cls.CLEARANCE_BUFFER_MINUTES)
                is_buffer_conflict = True

            # Delay Factor calculation
            t_type = t["train_type"]
            type_factor = cls.TRAIN_TYPE_FACTORS.get(t_type, 1.0)
            priority_mult = 1.25 if t["priority"] <= 2 else (1.10 if t["priority"] <= 4 else 0.90)

            est_delay = round(overlap_minutes * type_factor * priority_mult, 1)
            max_delay = round(block_duration_minutes * type_factor, 1)

            total_expected_delay += est_delay
            if max_delay > max_possible_delay:
                max_possible_delay = max_delay

            # Categorize Individual Train Impact
            if est_delay == 0:
                t_impact = "NO_IMPACT"
            elif est_delay <= cls.DELAY_THRESHOLDS["LOW"]:
                t_impact = "LOW"
            elif est_delay <= cls.DELAY_THRESHOLDS["MEDIUM"]:
                t_impact = "MEDIUM"
            elif est_delay <= cls.DELAY_THRESHOLDS["HIGH"]:
                t_impact = "HIGH"
            else:
                t_impact = "CRITICAL"

            # Reason generation
            reason_parts = []
            if is_direct_overlap:
                reason_parts.append(f"Direct corridor occupancy overlap of {int(overlap_minutes)} min")
            if is_buffer_conflict:
                reason_parts.append(f"Movement intersects {cls.CLEARANCE_BUFFER_MINUTES}-min operational clearance buffer")
            if t["is_passenger"]:
                reason_parts.append(f"Passenger carrier (~{t['passengers_estimated']} passengers)")
            elif t["is_goods"]:
                reason_parts.append("Freight goods movement")
            if t["priority"] <= 2:
                reason_parts.append(f"High operational priority (P{t['priority']})")

            train_reason = "; ".join(reason_parts)

            # Accumulate counts
            if t_type == "SUPERFAST":
                superfast_trains_count += 1
                passenger_trains_count += 1
            elif t_type == "EXPRESS":
                express_trains_count += 1
                passenger_trains_count += 1
            elif t_type == "PASSENGER":
                passenger_trains_count += 1
            elif t_type == "GOODS":
                goods_trains_count += 1
            elif t_type == "SPECIAL":
                special_trains_count += 1
            else:
                maintenance_trains_count += 1

            if t["direction"] == "UP":
                up_trains_count += 1
            else:
                down_trains_count += 1

            total_passengers_affected += t["passengers_estimated"]

            if t["priority"] <= 2 or t_type == "SUPERFAST":
                highest_priority = "CRITICAL"
            elif highest_priority != "CRITICAL" and (t["priority"] <= 4 or t_type == "EXPRESS"):
                highest_priority = "HIGH"
            elif highest_priority == "LOW":
                highest_priority = "NORMAL"

            affected_trains_details.append({
                "train_id": t["train_id"],
                "train_number": t["train_number"],
                "train_name": t["train_name"],
                "train_type": t_type,
                "direction": t["direction"],
                "scheduled_entry": t_entry.strftime("%H:%M") if t_entry else "--:--",
                "scheduled_exit": t_exit.strftime("%H:%M") if t_exit else "--:--",
                "overlap_minutes": int(overlap_minutes),
                "estimated_delay_minutes": est_delay,
                "maximum_delay_minutes": max_delay,
                "priority_label": f"P{t['priority']}",
                "impact_level": t_impact,
                "passengers_affected": t["passengers_estimated"],
                "reason": train_reason
            })

        # 2. Goods Forecast Integration
        forecast_hour = start_naive.hour
        goods_forecast = db.scalar(
            select(GoodsForecast)
            .where(
                GoodsForecast.corridor_id == corridor_id,
                GoodsForecast.hour_start <= forecast_hour,
                GoodsForecast.hour_end > forecast_hour
            )
        )
        goods_density_level = goods_forecast.traffic_density if goods_forecast else "LOW"
        expected_goods_forecast_count = goods_forecast.expected_goods_trains if goods_forecast else goods_trains_count

        # 3. Overall Impact Score (0–100)
        delay_score = min(100.0, (total_expected_delay / 90.0) * 100.0)
        train_count_score = min(100.0, (len(affected_trains_details) / 8.0) * 100.0)
        passenger_score = min(100.0, (total_passengers_affected / 4000.0) * 100.0)
        goods_score = min(100.0, (expected_goods_forecast_count / 4.0) * 100.0)
        priority_score = 90.0 if highest_priority == "CRITICAL" else (70.0 if highest_priority == "HIGH" else 30.0)
        density_score = 80.0 if goods_density_level == "HIGH" else (50.0 if goods_density_level == "MEDIUM" else 20.0)

        overall_score = round(
            cls.SCORE_WEIGHTS["delay"] * delay_score +
            cls.SCORE_WEIGHTS["train_count"] * train_count_score +
            cls.SCORE_WEIGHTS["passenger"] * passenger_score +
            cls.SCORE_WEIGHTS["goods"] * goods_score +
            cls.SCORE_WEIGHTS["priority"] * priority_score +
            cls.SCORE_WEIGHTS["traffic_density"] * density_score,
            1
        )

        # 4. Overall Impact Level
        if overall_score == 0:
            overall_impact_level = "NO_IMPACT"
        elif overall_score < 25.0:
            overall_impact_level = "LOW"
        elif overall_score < 50.0:
            overall_impact_level = "MEDIUM"
        elif overall_score < 75.0:
            overall_impact_level = "HIGH"
        else:
            overall_impact_level = "CRITICAL"

        # 5. Explainability Text
        explanation_bullets = []
        if len(affected_trains_details) == 0:
            explanation_bullets.append("No active train schedules overlap this maintenance possession window.")
        else:
            explanation_bullets.append(f"{len(affected_trains_details)} train(s) overlap or intersect the clearance buffer.")
            if passenger_trains_count > 0:
                explanation_bullets.append(f"{passenger_trains_count} passenger service(s) affected (~{total_passengers_affected:,} passengers).")
            if goods_trains_count > 0:
                explanation_bullets.append(f"{goods_trains_count} freight / goods service(s) impacted.")
            explanation_bullets.append(f"Cumulative estimated delay: {int(total_expected_delay)} minutes (Max: {int(max_possible_delay)} min).")
            if goods_density_level in ["MEDIUM", "HIGH"]:
                explanation_bullets.append(f"Goods traffic forecast is {goods_density_level} for this corridor segment.")

        # 6. Search Alternative Windows
        alternatives = cls.find_alternative_windows(
            db=db,
            corridor_id=corridor_id,
            target_date=start_naive,
            duration_minutes=block_duration_minutes,
            current_start=start_naive,
            current_end=end_naive
        )

        # Recommendation
        if alternatives and alternatives[0]["feasible"] and alternatives[0]["impact_score"] < overall_score:
            rec_window = alternatives[0]
            recommendation_text = (
                f"Consider window {rec_window['start_time']}–{rec_window['end_time']} "
                f"which reduces expected delay to {rec_window['expected_delay_minutes']}m ({rec_window['impact_level']} impact)."
            )
        elif overall_impact_level in ["NO_IMPACT", "LOW"]:
            recommendation_text = "Proposed maintenance block window is operationally acceptable with minimal train delay."
        else:
            recommendation_text = "Review operational window or consider single-line possession with speed restrictions."

        return {
            "corridor_id": corridor_id,
            "corridor_name": corridor.name,
            "start_time": start_naive.strftime("%H:%M"),
            "end_time": end_naive.strftime("%H:%M"),
            "start_datetime": start_naive.isoformat(),
            "end_datetime": end_naive.isoformat(),
            "duration_minutes": block_duration_minutes,
            "summary": {
                "affected_trains": len(affected_trains_details),
                "expected_delay_minutes": round(total_expected_delay, 1),
                "maximum_delay_minutes": round(max_possible_delay, 1),
                "passenger_trains": passenger_trains_count,
                "goods_trains": goods_trains_count,
                "express_trains": express_trains_count,
                "superfast_trains": superfast_trains_count,
                "special_trains": special_trains_count,
                "maintenance_trains": maintenance_trains_count,
                "up_trains": up_trains_count,
                "down_trains": down_trains_count,
                "total_passengers_estimated": total_passengers_affected,
                "highest_priority": highest_priority,
                "impact_score": overall_score,
                "operational_impact": overall_impact_level,
                "is_acceptable": overall_impact_level in ["NO_IMPACT", "LOW", "MEDIUM"]
            },
            "trains": affected_trains_details,
            "explanation_bullets": explanation_bullets,
            "recommendation": recommendation_text,
            "alternatives": alternatives,
            "method": "Synthetic Simulation — Baseline Operational Delay Model"
        }

    @classmethod
    def find_alternative_windows(
        cls,
        db: Session,
        corridor_id: str,
        target_date: datetime,
        duration_minutes: int,
        current_start: datetime,
        current_end: datetime
    ) -> List[Dict[str, Any]]:
        """
        Scans candidate time slots across the 24-hour daily cycle and ranks lower-impact windows.
        """
        date_base = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Candidate daily start hours for testing
        candidate_hours = [0, 1, 3, 5, 11, 14, 18, 22]
        
        # Also relative shifts from current window
        shifts = [-3, -2, -1, 1, 2, 3]
        for s in shifts:
            shifted_hr = (current_start.hour + s) % 24
            if shifted_hr not in candidate_hours:
                candidate_hours.append(shifted_hr)

        candidate_hours = sorted(list(set(candidate_hours)))

        evaluated_windows = []

        for ch in candidate_hours:
            cand_start = date_base + timedelta(hours=ch, minutes=current_start.minute)
            cand_end = cand_start + timedelta(minutes=duration_minutes)

            # Check overlap with existing approved blocks in this corridor
            overlapping_block = db.scalar(
                select(BlockRequest)
                .where(
                    BlockRequest.corridor_id == corridor_id,
                    BlockRequest.status.in_(["APPROVED", "IN_PROGRESS"]),
                    BlockRequest.preferred_start_at < cand_end,
                    BlockRequest.preferred_end_at > cand_start
                )
            )

            # Find trains in this candidate window
            cand_trains = cls.find_affected_trains(
                db=db,
                corridor_id=corridor_id,
                start_time=cand_start,
                end_time=cand_end,
                buffer_minutes=cls.CLEARANCE_BUFFER_MINUTES
            )

            cand_delay = 0.0
            for t in cand_trains:
                t_factor = cls.TRAIN_TYPE_FACTORS.get(t["train_type"], 1.0)
                cand_delay += 15.0 * t_factor

            # Calculate candidate impact score
            cand_score = min(100.0, round(len(cand_trains) * 12.0 + cand_delay * 0.4, 1))

            if cand_score == 0:
                lvl = "NO_IMPACT"
            elif cand_score < 25.0:
                lvl = "LOW"
            elif cand_score < 50.0:
                lvl = "MEDIUM"
            elif cand_score < 75.0:
                lvl = "HIGH"
            else:
                lvl = "CRITICAL"

            is_feasible = (overlapping_block is None) and (cand_score < 80.0)
            reason = "Lowest train traffic slot" if cand_score == 0 else (
                "Overlaps existing approved block" if overlapping_block else f"Moderate traffic ({len(cand_trains)} trains)"
            )

            evaluated_windows.append({
                "start_time": cand_start.strftime("%H:%M"),
                "end_time": cand_end.strftime("%H:%M"),
                "start_datetime": cand_start.isoformat(),
                "end_datetime": cand_end.isoformat(),
                "duration_minutes": duration_minutes,
                "affected_trains": len(cand_trains),
                "expected_delay_minutes": round(cand_delay, 1),
                "impact_score": cand_score,
                "impact_level": lvl,
                "feasible": is_feasible,
                "reason": reason
            })

        # Rank alternatives: feasible first, lowest impact_score, lowest delay, lowest trains
        evaluated_windows.sort(key=lambda x: (not x["feasible"], x["impact_score"], x["expected_delay_minutes"], x["affected_trains"]))

        return evaluated_windows[:6]

    @classmethod
    def calculate_block_train_impact(
        cls,
        db: Session,
        block_request_id: str
    ) -> Dict[str, Any]:
        """
        Calculates and persists TrainImpact records for an existing BlockRequest.
        """
        req = db.scalar(select(BlockRequest).where(BlockRequest.id == block_request_id))
        if not req:
            raise ResourceNotFoundError("BlockRequest", block_request_id)

        impact_data = cls.calculate_train_impact(
            db=db,
            corridor_id=req.corridor_id,
            start_time=req.preferred_start_at,
            end_time=req.preferred_end_at,
            block_id=req.id
        )

        # Clean existing impacts for this request and persist updated impacts
        existing_impacts = list(db.scalars(select(TrainImpact).where(TrainImpact.block_id == req.id)))
        for ei in existing_impacts:
            db.delete(ei)

        for td in impact_data["trains"]:
            ti = TrainImpact(
                block_id=req.id,
                corridor_id=req.corridor_id,
                train_id=td["train_id"],
                impact_type=td["impact_level"],
                estimated_delay_minutes=td["estimated_delay_minutes"],
                maximum_delay_minutes=td["maximum_delay_minutes"],
                passenger_impact=td["passengers_affected"],
                goods_impact="GOODS_DELAY" if td["train_type"] == "GOODS" else None,
                operational_impact=impact_data["summary"]["operational_impact"],
                reason=td["reason"]
            )
            db.add(ti)

        db.commit()

        impact_data["block_id"] = req.id
        impact_data["block_code"] = req.request_code
        return impact_data

    @classmethod
    def evaluate_block_window(
        cls,
        db: Session,
        corridor_id: str,
        start_time: datetime,
        end_time: datetime,
        tasks: Optional[List[Any]] = None,
        existing_blocks: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """
        Callable interface for Phase 17 Mathematical Constraint Optimizer.
        """
        impact = cls.calculate_train_impact(
            db=db,
            corridor_id=corridor_id,
            start_time=start_time,
            end_time=end_time
        )

        summary = impact["summary"]
        return {
            "feasible": summary["is_acceptable"],
            "impact_score": summary["impact_score"],
            "expected_delay": summary["expected_delay_minutes"],
            "affected_trains": summary["affected_trains"],
            "operational_impact": summary["operational_impact"],
            "safety_conflicts": 0,
            "operational_conflicts": summary["affected_trains"]
        }


train_impact_service = TrainImpactService()
