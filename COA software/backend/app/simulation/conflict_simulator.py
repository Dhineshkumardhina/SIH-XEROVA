from typing import List, Tuple
from app.simulation.models import SimulatedTrain, SimulatedBlock, SimulationEventData


class ConflictSimulator:
    """
    Detects operational conflicts between train movements and active possession blocks.
    """

    @classmethod
    def detect_conflicts(
        cls,
        trains: List[SimulatedTrain],
        blocks: List[SimulatedBlock],
        current_time_str: str
    ) -> List[SimulationEventData]:
        """
        Scans for train movements intersecting with active maintenance blocks.
        """
        events = []
        active_blocks = {b.section_code: b for b in blocks if b.status == "ACTIVE"}

        for tr in trains:
            if tr.status in ["IN_TRANSIT", "BLOCKED"] and tr.current_section in active_blocks:
                blk = active_blocks[tr.current_section]
                events.append(SimulationEventData(
                    event_id=f"EVT-CONF-{tr.train_number}-{blk.block_id}-{current_time_str}",
                    event_type="CONFLICT_DETECTED",
                    simulation_time=current_time_str,
                    title=f"Operational Conflict: Train {tr.train_number} ⇄ {blk.block_id}",
                    description=f"Train movement on {tr.current_section} intersects active possession block. Auto-holding train at preceding signal.",
                    severity="CRITICAL"
                ))

        return events


conflict_simulator = ConflictSimulator()
