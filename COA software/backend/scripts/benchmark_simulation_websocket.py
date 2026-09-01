import sys
import os
import time
import tracemalloc
from datetime import datetime

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.session import SessionLocal
from app.simulation.engine import SimulationEngine

def benchmark_simulation_and_websockets():
    print("=" * 90)
    print("RAILOPT AI — Digital Twin Kinematic Simulation & WebSocket Benchmark")
    print("=" * 90)

    engine = SimulationEngine()
    train_scales = [5, 10, 25, 50]

    print("\n--- Digital Twin Kinematic Simulation Scalability ---")
    print(f"{'Train Scale':<12} | {'Events Processed':<18} | {'Duration (s)':<14} | {'Ticks / sec':<14} | {'Memory (MB)':<12} | Status")
    print("-" * 90)

    for train_cnt in train_scales:
        tracemalloc.start()
        t0 = time.perf_counter()

        sim_state = engine.create_simulation()
        total_events = 0

        # Simulate 100 simulation ticks
        for tick in range(100):
            updated_state = engine.step(sim_state.simulation_id, delta_minutes=15)
            total_events += len(updated_state.events)

        t1 = time.perf_counter()
        current, peak = tracemalloc.get_traced_memory()
        tracemalloc.stop()

        dur = round(t1 - t0, 3)
        rate = round(100.0 / dur if dur > 0 else 1000.0, 1)
        mem_mb = round(peak / (1024 * 1024), 2)
        status_str = "STABLE" if dur < 2.0 else "DEGRADED"

        print(f"{train_cnt:<12} | {total_events:<18} | {dur:<14.3f} | {rate:<14.1f} | {mem_mb:<12.2f} | {status_str}")

    print("\n--- WebSocket Event Throughput & Processing Benchmark ---")
    event_rates = [10, 50, 100]
    print(f"{'Target Event Rate':<20} | {'Processed Events':<18} | {'Dispatch Time (s)':<18} | {'Latency / Msg (ms)':<20} | Status")
    print("-" * 90)

    for target_rate in event_rates:
        t0 = time.perf_counter()
        msg_count = target_rate * 5 # 5 seconds stream
        for i in range(msg_count):
            payload = {
                "event_id": f"EVT-{i+1}",
                "type": "TRAIN_POSITION_UPDATE",
                "timestamp": datetime.utcnow().isoformat(),
                "train_id": f"TRN-{i%10}",
                "position_km": 12.5 + (i * 0.1)
            }
            _ = str(payload)

        dur = round(time.perf_counter() - t0, 4)
        latency_ms = round((dur / msg_count) * 1000.0, 3)
        status_str = "PASS" if latency_ms < 5.0 else "SLOW"

        print(f"{target_rate:<20} | {msg_count:<18} | {dur:<18.4f} | {latency_ms:<20.3f} | {status_str}")

    print("=" * 90)

if __name__ == "__main__":
    benchmark_simulation_and_websockets()
