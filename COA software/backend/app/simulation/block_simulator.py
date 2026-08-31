from typing import List, Tuple
from app.simulation.models import SimulatedBlock, SimulationEventData, TrackSegment


class BlockSimulator:
    """
    Simulates railway possession block activation, maintenance task progress, and release.
    """

    @classmethod
    def update_blocks(
        cls,
        blocks: List[SimulatedBlock],
        segments: List[TrackSegment],
        current_time_minutes: int,
        delta_minutes: int
    ) -> Tuple[List[SimulatedBlock], List[TrackSegment], List[SimulationEventData], List[str]]:
        """
        Advances block states, updates task execution progress, and flags blocked sections.
        """
        events = []
        blocked_section_codes = []
        curr_hrs = current_time_minutes // 60
        curr_mins = current_time_minutes % 60
        time_str = f"{curr_hrs:02d}:{curr_mins:02d}"

        for b in blocks:
            start_h, start_m = map(int, b.start_time.split(":"))
            end_h, end_m = map(int, b.end_time.split(":"))
            start_total = start_h * 60 + start_m
            end_total = end_h * 60 + end_m

            # Block Activation
            if b.status == "PLANNED":
                if current_time_minutes >= start_total and current_time_minutes < end_total:
                    b.status = "ACTIVE"
                    blocked_section_codes.append(b.section_code)
                    
                    # Mark segment as blocked
                    for seg in segments:
                        if seg.segment_id == b.section_code:
                            seg.is_blocked = True
                            seg.active_block_id = b.block_id

                    events.append(SimulationEventData(
                        event_id=f"EVT-BLK-ACT-{b.block_id}-{time_str}",
                        event_type="BLOCK_STARTED",
                        simulation_time=time_str,
                        title=f"Possession Block Activated: {b.block_id}",
                        description=f"Corridor section {b.section_code} granted for {', '.join(b.departments)} maintenance until {b.end_time}.",
                        severity="INFO"
                    ))

                    # Start tasks
                    for t in b.tasks:
                        t.status = "IN_PROGRESS"
                        events.append(SimulationEventData(
                            event_id=f"EVT-TSK-STR-{t.task_code}-{time_str}",
                            event_type="MAINTENANCE_STARTED",
                            simulation_time=time_str,
                            title=f"Maintenance Started: {t.task_code}",
                            description=f"[{t.department}] {t.asset_name} on {t.asset_id} initiated."
                        ))

            elif b.status == "ACTIVE":
                # Advance maintenance task progress
                if current_time_minutes < end_total:
                    blocked_section_codes.append(b.section_code)
                    for t in b.tasks:
                        if t.status == "IN_PROGRESS":
                            increment = (delta_minutes / t.duration_minutes) * 100.0
                            t.progress_pct = min(100.0, t.progress_pct + increment)
                            if t.progress_pct >= 100.0:
                                t.status = "COMPLETED"
                                events.append(SimulationEventData(
                                    event_id=f"EVT-TSK-CMP-{t.task_code}-{time_str}",
                                    event_type="MAINTENANCE_COMPLETED",
                                    simulation_time=time_str,
                                    title=f"Maintenance Completed: {t.task_code}",
                                    description=f"Work on {t.asset_id} successfully executed and inspected.",
                                    severity="SUCCESS"
                                ))
                else:
                    # Block Completion
                    b.status = "COMPLETED"
                    for seg in segments:
                        if seg.segment_id == b.section_code:
                            seg.is_blocked = False
                            seg.active_block_id = None

                    events.append(SimulationEventData(
                        event_id=f"EVT-BLK-CMP-{b.block_id}-{time_str}",
                        event_type="BLOCK_COMPLETED",
                        simulation_time=time_str,
                        title=f"Possession Block Released: {b.block_id}",
                        description=f"Track section {b.section_code} cleared and restored to line speed operations.",
                        severity="SUCCESS"
                    ))

        return blocks, segments, events, blocked_section_codes


block_simulator = BlockSimulator()
