import pytest
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import select

from app.main import app
from app.database.session import SessionLocal
from app.models.simulation import SimulationScenario
from app.simulation.scenario_engine import scenario_engine

client = TestClient(app)
DEMO_PWD = "RailoptDemo@2026"

def get_auth_token(username: str = "control") -> str:
    res = client.post("/api/v1/auth/login", json={"username": username, "password": DEMO_PWD})
    assert res.status_code == 200
    return res.json()["data"]["access_token"]


def test_scenario_creation_and_baseline_immutability():
    """TEST 1: Scenario snapshot creation preserving baseline immutability"""
    db = SessionLocal()
    try:
        sc = scenario_engine.create_scenario(
            db=db,
            name=f"What-If Test {uuid.uuid4().hex[:6]}",
            description="Testing baseline snapshot isolation",
            parameters={"block_start": "02:00", "block_duration_minutes": 120}
        )

        assert sc.id.startswith("SCEN-")
        config = sc.configuration
        assert "base_plan_id" in config
        assert config["baseline_metrics"]["train_delay_minutes"] == 0.0
        assert config["parameters"]["block_start"] == "02:00"
        assert config["parameters"]["block_end"] == "04:00"

        # Cleanup
        db.delete(sc)
        db.commit()
    finally:
        db.close()


def test_scenario_parameter_update_and_validation():
    """TEST 2: Parameter modification and constraint validation (peak hour warning)"""
    db = SessionLocal()
    try:
        sc = scenario_engine.create_scenario(
            db=db,
            name="Peak Hour Test Scenario",
            parameters={"block_start": "01:00", "block_duration_minutes": 120}
        )

        # Update to peak express hour (08:00)
        scenario_engine.update_scenario(
            db=db,
            scenario_id=sc.id,
            parameters={"block_start": "08:00"}
        )

        val_res = scenario_engine.validate_scenario(db=db, scenario_id=sc.id)
        assert val_res["is_valid"] is False
        assert len(val_res["conflicts"]) >= 1
        assert any("peak" in c.lower() for c in val_res["conflicts"])

        # Cleanup
        db.delete(sc)
        db.commit()
    finally:
        db.close()


def test_scenario_execution_kpi_deltas_and_explainability():
    """TEST 3: What-If evaluation, KPI delta classification, and AI explainability"""
    db = SessionLocal()
    try:
        sc = scenario_engine.create_scenario(
            db=db,
            name="Shift to Peak Analysis",
            parameters={
                "block_start": "18:00",
                "block_duration_minutes": 120,
                "passenger_traffic_multiplier": 1.5,
                "goods_forecast_rate": 6.0
            }
        )

        res = scenario_engine.run_scenario(db=db, scenario_id=sc.id)
        assert res["status"] == "COMPLETED"
        assert res["scenario_metrics"]["train_delay_minutes"] > 0
        assert res["scenario_metrics"]["conflicts"] > 0

        # Deltas
        assert "train_delay_minutes" in res["deltas"]
        assert res["deltas"]["train_delay_minutes"]["diff"] > 0

        # AI Explainability
        assert "what_changed" in res["explanation"]
        assert "what_happened" in res["explanation"]
        assert len(res["explanation"]["why"]) >= 1
        assert res["explanation"]["recommendation"] is not None

        # Alternative Recommendation
        assert res["alternative_recommendation"] is not None
        assert "01:00" in res["alternative_recommendation"]["window"]

        # Cleanup
        db.delete(sc)
        db.commit()
    finally:
        db.close()


def test_scenario_duplication_and_multi_ranking():
    """TEST 4: Scenario duplication and multi-scenario ranking"""
    db = SessionLocal()
    try:
        sc1 = scenario_engine.create_scenario(
            db=db,
            name="Scenario Optimal Night",
            parameters={"block_start": "01:00", "passenger_traffic_multiplier": 1.0}
        )
        scenario_engine.run_scenario(db=db, scenario_id=sc1.id)

        sc2 = scenario_engine.create_scenario(
            db=db,
            name="Scenario Peak Evening",
            parameters={"block_start": "18:00", "passenger_traffic_multiplier": 1.8}
        )
        scenario_engine.run_scenario(db=db, scenario_id=sc2.id)

        # Compare
        comp = scenario_engine.compare_scenarios(db=db, scenario_ids=[sc1.id, sc2.id])
        assert len(comp["comparison"]) == 2
        assert comp["best_option"] is not None
        assert comp["best_option"]["scenario_id"] == sc1.id

        # Cleanup
        db.delete(sc1)
        db.delete(sc2)
        db.commit()
    finally:
        db.close()


def test_what_if_rest_api_endpoints():
    """TEST 5: What-If REST API routes"""
    token = get_auth_token("control")
    headers = {"Authorization": f"Bearer {token}"}

    # POST /api/v1/simulation/scenarios
    create_res = client.post("/api/v1/simulation/scenarios", json={
        "name": f"API Scenario {uuid.uuid4().hex[:6]}",
        "description": "Created via API test",
        "parameters": {"block_start": "01:00", "block_duration_minutes": 120}
    }, headers=headers)
    assert create_res.status_code == 201
    sc_id = create_res.json()["data"]["id"]

    # POST /api/v1/simulation/scenarios/{id}/validate
    val_res = client.post(f"/api/v1/simulation/scenarios/{sc_id}/validate", headers=headers)
    assert val_res.status_code == 200
    assert val_res.json()["success"] is True

    # POST /api/v1/simulation/scenarios/{id}/run
    run_res = client.post(f"/api/v1/simulation/scenarios/{sc_id}/run", headers=headers)
    assert run_res.status_code == 200
    assert run_res.json()["data"]["status"] == "COMPLETED"

    # POST /api/v1/simulation/scenarios/{id}/duplicate
    dup_res = client.post(f"/api/v1/simulation/scenarios/{sc_id}/duplicate", headers=headers)
    assert dup_res.status_code == 200
    dup_id = dup_res.json()["data"]["id"]

    # DELETE duplicated
    del_res = client.delete(f"/api/v1/simulation/scenarios/{dup_id}", headers=headers)
    assert del_res.status_code == 200
