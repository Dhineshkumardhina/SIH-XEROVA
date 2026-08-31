from typing import List, Tuple
from app.simulation.models import SimulatedTrain, SimulationEventData


class TrainSimulator:
    """
    Simulates train progression across railway sections and stations.
    """

    STATION_SEQUENCE_DOWN = ["STN-A", "STN-B", "STN-C", "STN-D", "STN-E"]
    SECTION_SEQUENCE_DOWN = ["SEC-AB", "SEC-BC", "SEC-CD", "SEC-DE"]

    @classmethod
    def update_trains(
        cls,
        trains: List[SimulatedTrain],
        current_time_minutes: int,
        delta_minutes: int,
        blocked_sections: List[str]
    ) -> Tuple[List[SimulatedTrain], List[SimulationEventData]]:
        """
        Advances train progress, handles station arrivals, departures, and block holds.
        """
        events = []
        curr_hrs = current_time_minutes // 60
        curr_mins = current_time_minutes % 60
        time_str = f"{curr_hrs:02d}:{curr_mins:02d}"

        for tr in trains:
            dep_h, dep_m = map(int, tr.scheduled_departure.split(":"))
            dep_total = dep_h * 60 + dep_m

            # Check Departure
            if tr.status == "SCHEDULED":
                if current_time_minutes >= dep_total:
                    tr.status = "IN_TRANSIT"
                    tr.actual_departure = time_str
                    events.append(SimulationEventData(
                        event_id=f"EVT-DEP-{tr.train_number}-{time_str}",
                        event_type="TRAIN_DEPARTURE",
                        simulation_time=time_str,
                        title=f"Train {tr.train_number} Departed",
                        description=f"{tr.train_type} departed from {tr.origin} towards {tr.destination}."
                    ))

            # Progress In Transit
            elif tr.status in ["IN_TRANSIT", "DELAYED"]:
                # Check if current section is blocked
                if tr.current_section in blocked_sections:
                    tr.status = "BLOCKED"
                    tr.delay_minutes += delta_minutes
                    events.append(SimulationEventData(
                        event_id=f"EVT-BLK-{tr.train_number}-{time_str}",
                        event_type="TRAIN_DELAY",
                        simulation_time=time_str,
                        title=f"Train {tr.train_number} Held at Signal",
                        description=f"Held approaching active possession block on section {tr.current_section}. Delay: +{int(tr.delay_minutes)}m",
                        severity="WARNING"
                    ))
                    continue

                # Normal movement progress (25km section at ~90km/h takes ~17 min => ~6% progress per minute)
                speed_factor = (tr.speed_kmh / 25.0) * (100.0 / 60.0) # ~6% per minute
                tr.progress_pct += speed_factor * delta_minutes

                if tr.progress_pct >= 100.0:
                    tr.progress_pct = 0.0
                    # Advance to next section or destination station
                    if tr.direction == "DOWN":
                        curr_idx = cls.SECTION_SEQUENCE_DOWN.index(tr.current_section) if tr.current_section in cls.SECTION_SEQUENCE_DOWN else 0
                        if curr_idx < len(cls.SECTION_SEQUENCE_DOWN) - 1:
                            tr.current_section = cls.SECTION_SEQUENCE_DOWN[curr_idx + 1]
                            tr.current_station = cls.STATION_SEQUENCE_DOWN[curr_idx + 1]
                            events.append(SimulationEventData(
                                event_id=f"EVT-ARR-{tr.train_number}-{time_str}",
                                event_type="TRAIN_ARRIVAL",
                                simulation_time=time_str,
                                title=f"Train {tr.train_number} Passed {tr.current_station}",
                                description=f"Section clear. Proceeding to {tr.destination}."
                            ))
                        else:
                            tr.status = "COMPLETED"
                            tr.actual_arrival = time_str
                            tr.current_station = tr.destination
                            tr.current_section = None
                            events.append(SimulationEventData(
                                event_id=f"EVT-ARR-FINAL-{tr.train_number}-{time_str}",
                                event_type="TRAIN_ARRIVAL",
                                simulation_time=time_str,
                                title=f"Train {tr.train_number} Reached Destination",
                                description=f"Arrived at {tr.destination} with {int(tr.delay_minutes)}m delay.",
                                severity="SUCCESS"
                            ))
                    else: # UP direction
                        tr.status = "COMPLETED"
                        tr.actual_arrival = time_str
                        tr.current_station = tr.destination
                        tr.current_section = None

            elif tr.status == "BLOCKED":
                if tr.current_section not in blocked_sections:
                    tr.status = "IN_TRANSIT"
                    events.append(SimulationEventData(
                        event_id=f"EVT-RESUME-{tr.train_number}-{time_str}",
                        event_type="TRAIN_DEPARTURE",
                        simulation_time=time_str,
                        title=f"Train {tr.train_number} Resumed Journey",
                        description=f"Possession block cleared. Proceeding at line speed."
                    ))

        return trains, events


train_simulator = TrainSimulator()
