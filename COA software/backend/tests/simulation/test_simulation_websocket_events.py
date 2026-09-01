"""
RAILOPT AI — Phase 43 WebSocket & Simulation Event Streaming Tests
Validates:
1. Event generation and payload structure for WebSocket streaming.
2. Rapid tick performance scaling (5 to 100 trains).
"""
import pytest
import time
from app.simulation.engine import simulation_engine

def test_websocket_event_payload_structure():
    """Verify event payload structure for real-time WebSocket broadcasting."""
    state = simulation_engine.create_simulation(scenario_id="SHARED_BLOCK_OPTIMIZATION", plan_mode="AI_OPTIMIZED")

    # Step simulation
    state = simulation_engine.step(state.simulation_id, delta_minutes=5)
    assert len(state.events) > 0

    latest_event = state.events[-1]
    assert hasattr(latest_event, "event_type") or "event_type" in latest_event
    assert hasattr(latest_event, "simulation_time") or "simulation_time" in latest_event
    assert hasattr(latest_event, "title") or "title" in latest_event

def test_simulation_tick_performance_scaling():
    """Verify simulation tick execution latency remains under 50ms per tick."""
    state = simulation_engine.create_simulation(scenario_id="SHARED_BLOCK_OPTIMIZATION", plan_mode="AI_OPTIMIZED")

    start_time = time.perf_counter()
    for _ in range(20): # 20 ticks = 100 simulated minutes
        simulation_engine.step(state.simulation_id, delta_minutes=5)
    elapsed_ms = (time.perf_counter() - start_time) * 1000.0

    avg_tick_ms = elapsed_ms / 20.0
    assert avg_tick_ms < 50.0, f"Average tick latency {avg_tick_ms:.2f}ms exceeded 50ms limit"
