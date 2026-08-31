from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.models.train import Train, TrainSchedule, TrainMovement, TrainType

def get_corridor_occupancy(db: Session, corridor_id: str, target_date: datetime) -> List[Dict[str, Any]]:
    """
    Returns train occupancy timeline for a corridor on a given day.
    Consumed by the Corridor Intelligence dashboard.
    """
    start_of_day = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_of_day = start_of_day + timedelta(days=1)

    schedules = db.query(TrainSchedule).join(Train).filter(
        TrainSchedule.corridor_id == corridor_id,
        TrainSchedule.arrival_time >= start_of_day,
        TrainSchedule.departure_time <= end_of_day
    ).all()

    # Group by train
    train_occupancies = {}
    for sched in schedules:
        if sched.train_id not in train_occupancies:
            train_occupancies[sched.train_id] = {
                "train_id": sched.train.id,
                "train_number": sched.train.train_number,
                "train_name": sched.train.train_name,
                "is_goods_train": sched.train.is_goods_train,
                "is_passenger_train": sched.train.is_passenger_train,
                "direction": sched.train.direction,
                "entry_time": sched.arrival_time,
                "exit_time": sched.departure_time,
                "stations": []
            }
        
        occ = train_occupancies[sched.train_id]
        if sched.arrival_time and (not occ["entry_time"] or sched.arrival_time < occ["entry_time"]):
            occ["entry_time"] = sched.arrival_time
        if sched.departure_time and (not occ["exit_time"] or sched.departure_time > occ["exit_time"]):
            occ["exit_time"] = sched.departure_time
            
        occ["stations"].append({
            "station_id": sched.station_id,
            "arrival": sched.arrival_time,
            "departure": sched.departure_time
        })

    return list(train_occupancies.values())


def get_train_occupancy_for_window(
    db: Session, corridor_id: str, start_time: datetime, end_time: datetime
) -> Dict[str, Any]:
    """
    Returns the exact set of trains operating in a given corridor and time window.
    Crucial for Block Planner conflict detection.
    """
    schedules = db.query(TrainSchedule).join(Train).filter(
        TrainSchedule.corridor_id == corridor_id,
        or_(
            and_(TrainSchedule.arrival_time <= end_time, TrainSchedule.departure_time >= start_time),
            # In case departure is null, consider arrival time only
            and_(TrainSchedule.departure_time == None, TrainSchedule.arrival_time >= start_time, TrainSchedule.arrival_time <= end_time)
        )
    ).all()

    affected_trains = {}
    passenger_count = 0
    goods_count = 0
    high_priority_count = 0

    for sched in schedules:
        if sched.train_id not in affected_trains:
            t = sched.train
            affected_trains[t.id] = {
                "train_id": t.id,
                "train_number": t.train_number,
                "type": t.train_type,
                "priority": t.priority,
            }
            if t.is_passenger_train:
                passenger_count += 1
            if t.is_goods_train:
                goods_count += 1
            if t.priority > 5:
                high_priority_count += 1

    train_list = list(affected_trains.values())

    return {
        "affected_trains": train_list,
        "train_count": len(train_list),
        "passenger_trains": passenger_count,
        "goods_trains": goods_count,
        "high_priority_trains": high_priority_count,
        "conflicts": len(train_list) > 0
    }


def calculate_train_impact(
    db: Session, corridor_id: str, block_start: datetime, block_end: datetime
) -> Dict[str, Any]:
    """
    Simulates the estimated delay impact if a block is granted.
    """
    occupancy_data = get_train_occupancy_for_window(db, corridor_id, block_start, block_end)
    
    affected_trains = occupancy_data["affected_trains"]
    train_count = len(affected_trains)
    
    # Simple deterministic delay model (Synthetic Simulation Estimate)
    total_estimated_delay = 0
    max_delay = 0

    for t in affected_trains:
        # Priority 1 (highest) -> less delay absorbed by this train (others are delayed)
        # We'll just assign a generic delay factor for now
        base_delay = 15 # minutes
        
        if t["type"] == TrainType.GOODS:
            delay = base_delay * 2 # Goods trains absorb more delay
        elif t["type"] == TrainType.PASSENGER:
            delay = base_delay
        else:
            delay = base_delay * 0.5 # Express/Superfast
            
        # Priority modifier
        if t["priority"] > 5:
            delay = delay * 0.5
            
        total_estimated_delay += int(delay)
        if int(delay) > max_delay:
            max_delay = int(delay)

    impact_level = "LOW"
    if train_count > 5 or max_delay > 60:
        impact_level = "HIGH"
    elif train_count > 2 or max_delay > 30:
        impact_level = "MEDIUM"

    return {
        "affected_trains": affected_trains,
        "affected_train_count": train_count,
        "passenger_trains": occupancy_data["passenger_trains"],
        "goods_trains": occupancy_data["goods_trains"],
        "estimated_delay_minutes": total_estimated_delay,
        "maximum_delay_minutes": max_delay,
        "impact_level": impact_level,
        "method": "Synthetic Simulation Estimate"
    }


def calculate_train_density(
    db: Session, corridor_id: str, start_time: datetime, end_time: datetime
) -> Dict[str, Any]:
    """
    Calculates traffic density and sets a low/medium/high threshold.
    """
    occupancy_data = get_train_occupancy_for_window(db, corridor_id, start_time, end_time)
    count = occupancy_data["train_count"]
    
    density = "LOW"
    if count >= 6:
        density = "VERY_HIGH"
    elif count >= 4:
        density = "HIGH"
    elif count >= 2:
        density = "MEDIUM"
        
    return {
        "train_count": count,
        "passenger_count": occupancy_data["passenger_trains"],
        "goods_count": occupancy_data["goods_trains"],
        "total_movements": count * 2, # Approximation for entering/leaving
        "traffic_density": density
    }
