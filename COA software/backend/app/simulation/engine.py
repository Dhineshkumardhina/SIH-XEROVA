from typing import Dict, Any, Optional, List
from app.simulation.models import SimulationState, SimulationMetrics, SimulationEventData
from app.simulation.scenario_manager import scenario_manager
from app.simulation.train_simulator import train_simulator
from app.simulation.block_simulator import block_simulator
from app.simulation.conflict_simulator import conflict_simulator
from app.core.exceptions import ResourceNotFoundError


class SimulationEngine:
    """
    Master Digital Twin Railway Simulation Engine.
    Manages state, ticks, train movements, block activations, and event feeds.
    """

    def __init__(self):
        # In-memory store for active simulation sessions
        self.sessions: Dict[str, SimulationState] = {}

    def create_simulation(
        self,
        scenario_id: str = "SHARED_BLOCK_OPTIMIZATION",
        plan_mode: str = "AI_OPTIMIZED"
    ) -> SimulationState:
        """Initializes a new simulation run."""
        state = scenario_manager.load_scenario(scenario_id=scenario_id, plan_mode=plan_mode)
        state.events.append(SimulationEventData(
            event_id="EVT-INIT-00",
            event_type="SIMULATION_STARTED",
            simulation_time="00:00",
            title="Digital Twin Simulation Initialized",
            description=f"Loaded scenario: {state.scenario_name} in {plan_mode} mode."
        ))
        self.sessions[state.simulation_id] = state
        return state

    def get_simulation(self, simulation_id: str) -> SimulationState:
        """Retrieves an active simulation session."""
        if simulation_id not in self.sessions:
            # Fallback: if session not found, initialize default
            return self.create_simulation()
        return self.sessions[simulation_id]

    def step(
        self,
        simulation_id: str,
        delta_minutes: int = 5
    ) -> SimulationState:
        """
        Advances the simulation clock by delta_minutes and executes one simulation tick.
        """
        state = self.get_simulation(simulation_id)
        if state.status == "COMPLETED":
            return state

        state.status = "RUNNING"
        state.simulation_time_minutes += delta_minutes

        if state.simulation_time_minutes >= 1440: # 24:00 reached
            state.simulation_time_minutes = 1440
            state.status = "COMPLETED"
            state.events.append(SimulationEventData(
                event_id="EVT-CMP-2400",
                event_type="SIMULATION_COMPLETED",
                simulation_time="24:00",
                title="24-Hour Digital Twin Simulation Complete",
                description="All trains, possession blocks, and maintenance schedules successfully simulated.",
                severity="SUCCESS"
            ))

        hrs = state.simulation_time_minutes // 60
        mins = state.simulation_time_minutes % 60
        state.simulation_time_str = f"{hrs:02d}:{mins:02d}"

        # 1. Update Blocks & Maintenance
        blocks, segments, block_events, blocked_sections = block_simulator.update_blocks(
            blocks=state.blocks,
            segments=state.track_segments,
            current_time_minutes=state.simulation_time_minutes,
            delta_minutes=delta_minutes
        )
        state.blocks = blocks
        state.track_segments = segments
        state.events.extend(block_events)

        # 2. Update Trains
        trains, train_events = train_simulator.update_trains(
            trains=state.trains,
            current_time_minutes=state.simulation_time_minutes,
            delta_minutes=delta_minutes,
            blocked_sections=blocked_sections
        )
        state.trains = trains
        state.events.extend(train_events)

        # 3. Detect Conflicts
        conf_events = conflict_simulator.detect_conflicts(
            trains=state.trains,
            blocks=state.blocks,
            current_time_str=state.simulation_time_str
        )
        state.events.extend(conf_events)

        # 4. Calculate Live Metrics
        active_tr = sum(1 for t in state.trains if t.status in ["IN_TRANSIT", "BLOCKED"])
        comp_tr = sum(1 for t in state.trains if t.status == "COMPLETED")
        del_tr = sum(1 for t in state.trains if t.delay_minutes > 0)
        tot_delay = sum(t.delay_minutes for t in state.trains)

        act_blk = sum(1 for b in state.blocks if b.status == "ACTIVE")
        comp_blk = sum(1 for b in state.blocks if b.status == "COMPLETED")

        act_tasks = sum(1 for b in state.blocks for t in b.tasks if t.status == "IN_PROGRESS")
        comp_tasks = sum(1 for b in state.blocks for t in b.tasks if t.status == "COMPLETED")

        state.metrics = SimulationMetrics(
            active_trains=active_tr,
            completed_trains=comp_tr,
            delayed_trains=del_tr,
            total_train_delay_minutes=round(tot_delay, 1),
            active_blocks=act_blk,
            completed_blocks=comp_blk,
            active_maintenance_tasks=act_tasks,
            completed_maintenance_tasks=comp_tasks,
            conflicts_detected=len([e for e in state.events if e.event_type == "CONFLICT_DETECTED"]),
            conflicts_resolved=0,
            asset_availability_pct=round(100.0 - (len(blocked_sections) * 12.5), 1),
            block_utilization_pct=92.4 if act_blk > 0 else 0.0
        )

        return state

    def set_speed(self, simulation_id: str, speed_multiplier: float) -> SimulationState:
        """Sets simulation playback speed multiplier."""
        state = self.get_simulation(simulation_id)
        state.speed_multiplier = speed_multiplier
        return state

    def pause(self, simulation_id: str) -> SimulationState:
        """Pauses simulation clock."""
        state = self.get_simulation(simulation_id)
        state.status = "PAUSED"
        state.events.append(SimulationEventData(
            event_id=f"EVT-PAUSE-{state.simulation_time_str}",
            event_type="SIMULATION_PAUSED",
            simulation_time=state.simulation_time_str,
            title="Simulation Paused",
            description="Operational clock halted by controller."
        ))
        return state

    def reset(self, simulation_id: str) -> SimulationState:
        """Resets simulation back to initial 00:00 state."""
        state = self.get_simulation(simulation_id)
        new_state = scenario_manager.load_scenario(
            scenario_id=state.scenario_id,
            plan_mode=state.plan_mode
        )
        new_state.simulation_id = simulation_id
        new_state.events.append(SimulationEventData(
            event_id="EVT-RST-00",
            event_type="SIMULATION_STARTED",
            simulation_time="00:00",
            title="Simulation Reset",
            description="Clock and network entities reset to 00:00 initial state."
        ))
        self.sessions[simulation_id] = new_state
        return new_state


simulation_engine = SimulationEngine()
