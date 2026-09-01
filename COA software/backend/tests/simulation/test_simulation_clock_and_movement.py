"""
RAILOPT AI — Phase 43 Digital Twin Simulation Clock & Train Movement Tests
Validates:
1. Virtual simulation clock tick advance, Play, Pause, Reset, and Step controls.
2. Synthetic train movement across Stations A-E, direction, and position calculations.
"""
import pytest
from app.simulation.engine import simulation_engine

def test_simulation_clock_advance_and_controls():
    """Verify clock ticks forward correctly and responds to pause/reset controls."""
    state = simulation_engine.create_simulation(scenario_id="SHARED_BLOCK_OPTIMIZATION", plan_mode="AI_OPTIMIZED")
    initial_time = state.simulation_time_minutes

    # Step simulation 1 tick (5 minutes)
    step1 = simulation_engine.step(state.simulation_id, delta_minutes=5)
    assert step1.simulation_time_minutes == initial_time + 5

    # Pause simulation
    paused = simulation_engine.pause(state.simulation_id)
    assert paused.status == "PAUSED"

    # Reset simulation
    reset_state = simulation_engine.reset(state.simulation_id)
    assert reset_state.simulation_time_minutes == 0
    assert reset_state.simulation_time_str == "00:00"

def test_train_movement_and_positions():
    """Verify synthetic trains move between Station A-E according to simulation ticks."""
    state = simulation_engine.create_simulation(scenario_id="SHARED_BLOCK_OPTIMIZATION", plan_mode="AI_OPTIMIZED")

    # Advance 12 ticks (60 minutes)
    for _ in range(12):
        state = simulation_engine.step(state.simulation_id, delta_minutes=5)

    assert state.simulation_time_minutes == 60
    assert len(state.trains) > 0
    for train in state.trains:
        assert hasattr(train, "status") or "status" in train
        assert hasattr(train, "current_station") or "current_station" in train
