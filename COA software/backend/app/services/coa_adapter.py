import random
from typing import Dict, Any, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.train import Train, TrainSchedule, TrainMovement, TrainType, TrainDirection, TrainStatus
from app.models.corridor import Corridor
from app.models.station import Station

class MockCOAAdapter:
    """
    Mock integration to Control Office Application (COA) for generating synthetic demonstration data.
    """
    
    def __init__(self, db: Session):
        self.db = db

    def sync_trains(self) -> Dict[str, Any]:
        """
        Creates synthetic trains, schedules, and movements.
        """
        records_received = 0
        records_created = 0
        
        corridors = self.db.query(Corridor).all()
        stations = self.db.query(Station).all()
        
        if not corridors or not stations:
            return {
                "sync_status": "FAILED",
                "message": "Need corridors and stations seeded first",
                "records_received": 0,
                "records_created": 0,
                "records_updated": 0,
                "records_rejected": 0,
                "synced_at": datetime.utcnow()
            }

        # Seed 20+ Trains
        train_types = [TrainType.PASSENGER, TrainType.EXPRESS, TrainType.SUPERFAST, TrainType.GOODS, TrainType.MAINTENANCE]
        
        trains_created = []
        for i in range(1, 25):
            t_type = random.choice(train_types)
            direction = random.choice([TrainDirection.UP, TrainDirection.DOWN])
            corridor = random.choice(corridors)
            
            t_num = f"{random.randint(10000, 99999)}"
            t = self.db.query(Train).filter(Train.train_number == t_num).first()
            if not t:
                t = Train(
                    train_number=t_num,
                    train_name=f"Synthetic {t_type.title()} {t_num}",
                    train_type=t_type,
                    default_direction=direction,
                    origin=random.choice(stations).station_code,
                    destination=random.choice(stations).station_code,
                    priority=random.randint(1, 10),
                    status=random.choice([TrainStatus.SCHEDULED, TrainStatus.APPROACHING, TrainStatus.AT_STATION, TrainStatus.DEPARTED, TrainStatus.DELAYED, TrainStatus.COMPLETED]),
                    corridor_id=corridor.id
                )
                self.db.add(t)
                records_created += 1
                trains_created.append(t)
                records_received += 1
        
        self.db.commit()
        
        # Reload to get IDs
        if not trains_created:
            trains_created = self.db.query(Train).limit(25).all()
            
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Seed 100 schedules and 50 movements
        for t in trains_created:
            c_stations = random.sample(stations, min(5, len(stations))) # Train goes through 5 stations
            start_hour = random.randint(0, 20)
            
            for seq, st in enumerate(c_stations):
                arr_time = today + timedelta(hours=start_hour + seq, minutes=random.randint(0, 59))
                dep_time = arr_time + timedelta(minutes=random.randint(2, 10))
                
                sched = TrainSchedule(
                    train_id=t.id,
                    station_id=st.id,
                    corridor_id=t.corridor_id,
                    scheduled_date=today,
                    arrival_time=arr_time,
                    departure_time=dep_time,
                    sequence_number=seq + 1
                )
                self.db.add(sched)
                records_created += 1
                records_received += 1
                
                # Create movement if it's in the past
                if dep_time < datetime.utcnow() and random.random() > 0.3:
                    delay_min = random.randint(0, 30) if random.random() > 0.8 else 0
                    actual_time = arr_time + timedelta(minutes=delay_min)
                    mov_status = TrainStatus.DELAYED if delay_min > 15 else TrainStatus.AT_STATION
                    
                    mov = TrainMovement(
                        train_id=t.id,
                        corridor_id=t.corridor_id,
                        station_id=st.id,
                        event_type="ARRIVAL" if random.random() > 0.5 else "DEPARTURE",
                        event_time=actual_time,
                        status=mov_status,
                        direction=t.default_direction
                    )
                    self.db.add(mov)
                    records_created += 1
                    records_received += 1

        self.db.commit()
        
        return {
            "sync_status": "SUCCESS",
            "records_received": records_received,
            "records_created": records_created,
            "records_updated": 0,
            "records_rejected": 0,
            "synced_at": datetime.utcnow()
        }
