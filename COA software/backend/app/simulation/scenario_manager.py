import uuid
from typing import List, Dict, Any, Optional
from app.simulation.models import (
    StationNode, TrackSegment, SimulatedTrain, SimulatedBlock,
    SimulatedTask, SimulationState, SimulationMetrics
)


class ScenarioManager:
    """
    Manages synthetic railway scenarios and digital twin network graphs.
    """

    @classmethod
    def get_synthetic_network(cls) -> Dict[str, Any]:
        """Returns standard synthetic 5-station railway corridor (STN-A to STN-E)."""
        stations = [
            StationNode(station_id="STN-A", code="STN-A", name="Central Junction", km_post=0.0, x_coord=100, y_coord=250),
            StationNode(station_id="STN-B", code="STN-B", name="North Yard", km_post=25.0, x_coord=300, y_coord=250),
            StationNode(station_id="STN-C", code="STN-C", name="Industrial Terminal", km_post=50.0, x_coord=500, y_coord=250),
            StationNode(station_id="STN-D", code="STN-D", name="Riverside Crossing", km_post=75.0, x_coord=700, y_coord=250),
            StationNode(station_id="STN-E", code="STN-E", name="Eastern Hub", km_post=100.0, x_coord=900, y_coord=250)
        ]

        segments = [
            TrackSegment(segment_id="SEC-AB", from_station_id="STN-A", to_station_id="STN-B", length_km=25.0),
            TrackSegment(segment_id="SEC-BC", from_station_id="STN-B", to_station_id="STN-C", length_km=25.0),
            TrackSegment(segment_id="SEC-CD", from_station_id="STN-C", to_station_id="STN-D", length_km=25.0),
            TrackSegment(segment_id="SEC-DE", from_station_id="STN-D", to_station_id="STN-E", length_km=25.0)
        ]

        return {"stations": stations, "segments": segments}

    @classmethod
    def list_scenarios(cls) -> List[Dict[str, Any]]:
        """Lists available digital twin simulation scenarios."""
        return [
            {
                "scenario_id": "SHARED_BLOCK_OPTIMIZATION",
                "name": "Shared Block Optimization",
                "description": "Multi-department bundled possession (ENG, SIG, TRC) during night low-traffic window (01:00-03:00).",
                "difficulty": "RECOMMENDED_DEMO",
                "train_count": 8,
                "block_count": 1
            },
            {
                "scenario_id": "CRITICAL_TRACK_DEFECT",
                "name": "Critical Track Defect Emergency",
                "description": "Severe ultrasonic flaw detected on switch point requiring immediate speed restriction & window slotting.",
                "difficulty": "INTERMEDIATE",
                "train_count": 10,
                "block_count": 1
            },
            {
                "scenario_id": "HIGH_GOODS_TRAFFIC",
                "name": "High Goods Freight Density",
                "description": "Surge of heavy freight rake movements testing timetable flexibility and block buffer clearance.",
                "difficulty": "COMPLEX",
                "train_count": 14,
                "block_count": 2
            },
            {
                "scenario_id": "MULTI_DEPARTMENT_CONFLICT",
                "name": "Multi-Department Overlapping Conflict",
                "description": "Overlapping uncoordinated block requests from Track Engineering and OHE Traction on Section B-C.",
                "difficulty": "CONFLICT_TEST",
                "train_count": 8,
                "block_count": 2
            },
            {
                "scenario_id": "NO_FEASIBLE_WINDOW",
                "name": "No Feasible Window Benchmark",
                "description": "Continuous tight passenger express headways simulating infeasible daytime possession constraints.",
                "difficulty": "STRESS_TEST",
                "train_count": 16,
                "block_count": 0
            }
        ]

    @classmethod
    def load_scenario(
        cls,
        scenario_id: str = "SHARED_BLOCK_OPTIMIZATION",
        plan_mode: str = "AI_OPTIMIZED"
    ) -> SimulationState:
        """Constructs and initializes the digital twin simulation state for a scenario."""
        net = cls.get_synthetic_network()
        sim_id = f"SIM-{uuid.uuid4().hex[:8]}"

        # Synthetic Trains
        trains = [
            SimulatedTrain(
                train_id="TR-12601",
                train_number="12601",
                train_type="EXPRESS",
                direction="DOWN",
                origin="STN-A",
                destination="STN-E",
                current_station="STN-A",
                current_section="SEC-AB",
                scheduled_departure="00:15",
                scheduled_arrival="02:30",
                speed_kmh=100.0,
                status="SCHEDULED"
            ),
            SimulatedTrain(
                train_id="TR-22638",
                train_number="22638",
                train_type="EXPRESS",
                direction="UP",
                origin="STN-E",
                destination="STN-A",
                current_station="STN-E",
                current_section="SEC-DE",
                scheduled_departure="00:30",
                scheduled_arrival="02:45",
                speed_kmh=105.0,
                status="SCHEDULED"
            ),
            SimulatedTrain(
                train_id="TR-56813",
                train_number="56813",
                train_type="FREIGHT",
                direction="DOWN",
                origin="STN-A",
                destination="STN-D",
                current_station="STN-A",
                current_section="SEC-AB",
                scheduled_departure="03:15",
                scheduled_arrival="05:30",
                speed_kmh=65.0,
                status="SCHEDULED"
            ),
            SimulatedTrain(
                train_id="TR-16127",
                train_number="16127",
                train_type="EXPRESS",
                direction="DOWN",
                origin="STN-A",
                destination="STN-E",
                current_station="STN-A",
                current_section="SEC-AB",
                scheduled_departure="05:00",
                scheduled_arrival="07:15",
                speed_kmh=110.0,
                status="SCHEDULED"
            ),
            SimulatedTrain(
                train_id="TR-12624",
                train_number="12624",
                train_type="EXPRESS",
                direction="UP",
                origin="STN-E",
                destination="STN-A",
                current_station="STN-E",
                current_section="SEC-DE",
                scheduled_departure="05:30",
                scheduled_arrival="07:45",
                speed_kmh=100.0,
                status="SCHEDULED"
            )
        ]

        # Blocks configuration based on plan_mode
        blocks = []
        if plan_mode == "AI_OPTIMIZED":
            # Single consolidated shared block 01:00 to 03:00 on Section B-C
            blocks.append(
                SimulatedBlock(
                    block_id="AI-BLK-0001",
                    corridor_id="COR-A01",
                    section_code="SEC-BC",
                    start_time="01:00",
                    end_time="03:00",
                    duration_minutes=120,
                    departments=["ENGINEERING", "SIGNAL_TELECOM", "TRACTION"],
                    is_shared=True,
                    tasks=[
                        SimulatedTask(task_id="T-ENG-01", task_code="MT-101", department="ENGINEERING", asset_id="TRK-01", asset_name="Turnout #104 Rail Grinding", duration_minutes=120),
                        SimulatedTask(task_id="T-SIG-01", task_code="MT-201", department="SIGNAL_TELECOM", asset_id="SIG-02", asset_name="Track Circuit Relays Calibration", duration_minutes=60),
                        SimulatedTask(task_id="T-TRC-01", task_code="MT-301", department="TRACTION", asset_id="OHE-01", asset_name="OHE Contact Wire Stagger Adjustment", duration_minutes=90)
                    ]
                )
            )
        else:
            # Manual Baseline: 3 separate sequential uncoordinated blocks
            blocks.extend([
                SimulatedBlock(
                    block_id="MAN-BLK-01",
                    corridor_id="COR-A01",
                    section_code="SEC-BC",
                    start_time="01:00",
                    end_time="03:00",
                    duration_minutes=120,
                    departments=["ENGINEERING"],
                    is_shared=False,
                    tasks=[SimulatedTask(task_id="T-ENG-01", task_code="MT-101", department="ENGINEERING", asset_id="TRK-01", asset_name="Turnout #104 Rail Grinding", duration_minutes=120)]
                ),
                SimulatedBlock(
                    block_id="MAN-BLK-02",
                    corridor_id="COR-A01",
                    section_code="SEC-BC",
                    start_time="03:00",
                    end_time="04:00",
                    duration_minutes=60,
                    departments=["SIGNAL_TELECOM"],
                    is_shared=False,
                    tasks=[SimulatedTask(task_id="T-SIG-01", task_code="MT-201", department="SIGNAL_TELECOM", asset_id="SIG-02", asset_name="Track Circuit Relays Calibration", duration_minutes=60)]
                ),
                SimulatedBlock(
                    block_id="MAN-BLK-03",
                    corridor_id="COR-A01",
                    section_code="SEC-BC",
                    start_time="04:00",
                    end_time="05:30",
                    duration_minutes=90,
                    departments=["TRACTION"],
                    is_shared=False,
                    tasks=[SimulatedTask(task_id="T-TRC-01", task_code="MT-301", department="TRACTION", asset_id="OHE-01", asset_name="OHE Contact Wire Stagger Adjustment", duration_minutes=90)]
                )
            ])

        # Plan Comparison Metrics
        plan_comparison = {
            "manual_baseline": {
                "total_blocks": 3,
                "total_downtime_minutes": 270,
                "train_delay_minutes": 26.0,
                "affected_trains": 2,
                "conflicts": 1,
                "block_utilization_pct": 58.0
            },
            "ai_optimized": {
                "total_blocks": 1,
                "total_downtime_minutes": 120,
                "train_delay_minutes": 0.0,
                "affected_trains": 0,
                "conflicts": 0,
                "block_utilization_pct": 92.4
            },
            "savings": {
                "time_saved_minutes": 150,
                "downtime_reduction_pct": 55.6,
                "delay_avoided_minutes": 26.0
            }
        }

        return SimulationState(
            simulation_id=sim_id,
            scenario_id=scenario_id,
            scenario_name=scenario_id.replace("_", " ").title(),
            simulation_date="2026-08-30",
            simulation_time_minutes=0,
            simulation_time_str="00:00",
            status="INITIALIZING",
            speed_multiplier=1.0,
            plan_mode=plan_mode,
            network_stations=net["stations"],
            track_segments=net["segments"],
            trains=trains,
            blocks=blocks,
            events=[],
            metrics=SimulationMetrics(
                active_trains=0,
                active_blocks=0,
                active_maintenance_tasks=0,
                asset_availability_pct=100.0
            ),
            plan_comparison=plan_comparison
        )


scenario_manager = ScenarioManager()
