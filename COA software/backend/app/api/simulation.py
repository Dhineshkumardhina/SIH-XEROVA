from typing import List, Optional, Dict, Any
from dataclasses import asdict
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.api.dependencies import get_db, require_authenticated_user
from app.models.user import User
from app.models.simulation import SimulationScenario
from app.schemas.common import ApiResponse
from app.schemas.simulation import (
    ScenarioItemResponse,
    SimulationRunRequest,
    SimulationControlRequest,
    SimulationStateResponse,
    SimulationEventSchema,
    SimulationMetricsSchema
)
from app.schemas.what_if import (
    ScenarioCreateRequest,
    ScenarioUpdateRequest,
    ScenarioDetailResponse,
    ScenarioValidationResponse,
    ScenarioRunResultResponse,
    ScenarioCompareRequest,
    ScenarioCompareResponse
)
from app.simulation.engine import simulation_engine
from app.simulation.scenario_manager import scenario_manager
from app.simulation.scenario_engine import scenario_engine
from app.core.exceptions import ResourceNotFoundError

router = APIRouter(prefix="/simulation", tags=["Digital Twin & What-If Simulation"])


# ── SCENARIO CRUD & WHAT-IF ENDPOINTS ───────────────────────────────────────

@router.get("/predefined", response_model=ApiResponse[List[ScenarioItemResponse]], summary="List 5 synthetic network scenarios")
def list_predefined_scenarios(
    current_user: User = Depends(require_authenticated_user)
):
    scenarios = scenario_manager.list_scenarios()
    return ApiResponse(
        data=[ScenarioItemResponse(**s) for s in scenarios],
        message="Predefined synthetic scenarios retrieved successfully"
    )


@router.get("/scenarios", response_model=ApiResponse[List[ScenarioDetailResponse]], summary="List all scenarios (predefined & user-created)")
def list_scenarios(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    scenarios = db.scalars(select(SimulationScenario).order_by(SimulationScenario.created_at.desc())).all()
    # If no custom scenarios yet, seed default scenario
    if not scenarios:
        default_sc = scenario_engine.create_scenario(
            db=db,
            name="Shared Block Optimization Demo",
            description="Multi-department shared possession benchmark vs uncoordinated baseline.",
            scenario_type="WHAT_IF_EXPERIMENT",
            user=current_user
        )
        scenarios = [default_sc]

    return ApiResponse(
        data=[
            ScenarioDetailResponse(
                id=s.id,
                name=s.name,
                description=s.description,
                scenario_type=s.scenario_type,
                configuration=s.configuration,
                created_by=s.created_by,
                created_at=s.created_at,
                updated_at=s.updated_at
            ) for s in scenarios
        ],
        message="Scenarios retrieved successfully"
    )


@router.post("/scenarios", response_model=ApiResponse[ScenarioDetailResponse], status_code=status.HTTP_201_CREATED, summary="Create a What-If scenario snapshot")
def create_scenario(
    payload: ScenarioCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    scenario = scenario_engine.create_scenario(
        db=db,
        name=payload.name,
        description=payload.description,
        base_plan_id=payload.base_plan_id,
        corridor_id=payload.corridor_id,
        scenario_type=payload.scenario_type or "WHAT_IF_EXPERIMENT",
        parameters=payload.parameters,
        user=current_user
    )
    return ApiResponse(
        data=ScenarioDetailResponse(
            id=scenario.id,
            name=scenario.name,
            description=scenario.description,
            scenario_type=scenario.scenario_type,
            configuration=scenario.configuration,
            created_by=scenario.created_by,
            created_at=scenario.created_at,
            updated_at=scenario.updated_at
        ),
        message="What-If scenario snapshot created successfully"
    )


@router.get("/scenarios/{id}", response_model=ApiResponse[ScenarioDetailResponse], summary="Get scenario details")
def get_scenario(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    scenario = db.scalar(select(SimulationScenario).where(SimulationScenario.id == id))
    if not scenario:
        raise ResourceNotFoundError("SimulationScenario", id)

    return ApiResponse(
        data=ScenarioDetailResponse(
            id=scenario.id,
            name=scenario.name,
            description=scenario.description,
            scenario_type=scenario.scenario_type,
            configuration=scenario.configuration,
            created_by=scenario.created_by,
            created_at=scenario.created_at,
            updated_at=scenario.updated_at
        ),
        message="Scenario retrieved"
    )


@router.put("/scenarios/{id}", response_model=ApiResponse[ScenarioDetailResponse], summary="Update scenario parameters")
def update_scenario(
    id: str,
    payload: ScenarioUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    scenario = scenario_engine.update_scenario(
        db=db,
        scenario_id=id,
        name=payload.name,
        description=payload.description,
        parameters=payload.parameters,
        user=current_user
    )
    return ApiResponse(
        data=ScenarioDetailResponse(
            id=scenario.id,
            name=scenario.name,
            description=scenario.description,
            scenario_type=scenario.scenario_type,
            configuration=scenario.configuration,
            created_by=scenario.created_by,
            created_at=scenario.created_at,
            updated_at=scenario.updated_at
        ),
        message="Scenario parameters updated successfully"
    )


@router.delete("/scenarios/{id}", response_model=ApiResponse[Dict[str, Any]], summary="Delete a scenario")
def delete_scenario(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    scenario = db.scalar(select(SimulationScenario).where(SimulationScenario.id == id))
    if not scenario:
        raise ResourceNotFoundError("SimulationScenario", id)

    db.delete(scenario)
    db.commit()
    return ApiResponse(
        data={"scenario_id": id, "deleted": True},
        message="Scenario deleted successfully"
    )


@router.post("/scenarios/{id}/validate", response_model=ApiResponse[ScenarioValidationResponse], summary="Validate scenario parameters")
def validate_scenario(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    res = scenario_engine.validate_scenario(db=db, scenario_id=id)
    return ApiResponse(
        data=ScenarioValidationResponse(**res),
        message="Scenario validated successfully"
    )


@router.post("/scenarios/{id}/run", response_model=ApiResponse[ScenarioRunResultResponse], summary="Execute What-If scenario analysis")
def run_scenario_analysis(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    results = scenario_engine.run_scenario(db=db, scenario_id=id, user=current_user)
    return ApiResponse(
        data=ScenarioRunResultResponse(**results),
        message="What-If analysis executed successfully"
    )


@router.get("/scenarios/{id}/results", response_model=ApiResponse[ScenarioRunResultResponse], summary="Get scenario analysis result")
def get_scenario_results(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    scenario = db.scalar(select(SimulationScenario).where(SimulationScenario.id == id))
    if not scenario:
        raise ResourceNotFoundError("SimulationScenario", id)

    results = (scenario.configuration or {}).get("results")
    if not results:
        # Run if not already executed
        results = scenario_engine.run_scenario(db=db, scenario_id=id, user=current_user)

    return ApiResponse(
        data=ScenarioRunResultResponse(**results),
        message="Scenario results retrieved"
    )


@router.post("/scenarios/{id}/duplicate", response_model=ApiResponse[ScenarioDetailResponse], summary="Duplicate a scenario")
def duplicate_scenario(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    cloned = scenario_engine.duplicate_scenario(db=db, scenario_id=id, user=current_user)
    return ApiResponse(
        data=ScenarioDetailResponse(
            id=cloned.id,
            name=cloned.name,
            description=cloned.description,
            scenario_type=cloned.scenario_type,
            configuration=cloned.configuration,
            created_by=cloned.created_by,
            created_at=cloned.created_at,
            updated_at=cloned.updated_at
        ),
        message="Scenario duplicated successfully"
    )


@router.post("/scenarios/compare", response_model=ApiResponse[ScenarioCompareResponse], summary="Compare and rank multiple scenarios")
def compare_scenarios(
    payload: ScenarioCompareRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_authenticated_user)
):
    comp_res = scenario_engine.compare_scenarios(db=db, scenario_ids=payload.scenario_ids)
    return ApiResponse(
        data=ScenarioCompareResponse(**comp_res),
        message="Scenario comparison generated successfully"
    )


# ── DIGITAL TWIN LIVE RUN ENDPOINTS ─────────────────────────────────────────

@router.post("/run", response_model=ApiResponse[SimulationStateResponse], summary="Initialize new digital twin simulation")
def initialize_simulation(
    payload: SimulationRunRequest,
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.create_simulation(
        scenario_id=payload.scenario_id or "SHARED_BLOCK_OPTIMIZATION",
        plan_mode=payload.plan_mode or "AI_OPTIMIZED"
    )
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message="Digital twin simulation initialized successfully"
    )


@router.get("/{id}", response_model=ApiResponse[SimulationStateResponse], summary="Get simulation state snapshot")
def get_simulation_state(
    id: str,
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.get_simulation(id)
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message="Simulation state retrieved"
    )


@router.post("/{id}/start", response_model=ApiResponse[SimulationStateResponse], summary="Start/resume simulation")
def start_simulation(
    id: str,
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.step(id, delta_minutes=5)
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message="Simulation started"
    )


@router.post("/{id}/pause", response_model=ApiResponse[SimulationStateResponse], summary="Pause simulation")
def pause_simulation(
    id: str,
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.pause(id)
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message="Simulation paused"
    )


@router.post("/{id}/reset", response_model=ApiResponse[SimulationStateResponse], summary="Reset simulation to 00:00")
def reset_simulation(
    id: str,
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.reset(id)
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message="Simulation reset to initial state"
    )


@router.post("/{id}/step", response_model=ApiResponse[SimulationStateResponse], summary="Step forward simulation clock")
def step_simulation(
    id: str,
    payload: SimulationControlRequest,
    current_user: User = Depends(require_authenticated_user)
):
    delta = payload.delta_minutes or 5
    state = simulation_engine.step(id, delta_minutes=delta)
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message="Simulation stepped forward"
    )


@router.post("/{id}/speed", response_model=ApiResponse[SimulationStateResponse], summary="Set simulation speed multiplier")
def set_simulation_speed(
    id: str,
    payload: SimulationControlRequest,
    current_user: User = Depends(require_authenticated_user)
):
    speed = payload.speed_multiplier or 1.0
    state = simulation_engine.set_speed(id, speed_multiplier=speed)
    return ApiResponse(
        data=SimulationStateResponse(**asdict(state)),
        message=f"Simulation speed set to {speed}x"
    )


@router.get("/{id}/events", response_model=ApiResponse[List[SimulationEventSchema]], summary="Get simulation event stream")
def get_simulation_events(
    id: str,
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.get_simulation(id)
    recent_events = state.events[-limit:] if state.events else []
    return ApiResponse(
        data=[SimulationEventSchema(**asdict(e)) for e in recent_events],
        message="Simulation events retrieved"
    )


@router.get("/{id}/metrics", response_model=ApiResponse[SimulationMetricsSchema], summary="Get simulation live metrics")
def get_simulation_metrics(
    id: str,
    current_user: User = Depends(require_authenticated_user)
):
    state = simulation_engine.get_simulation(id)
    return ApiResponse(
        data=SimulationMetricsSchema(**asdict(state.metrics)),
        message="Simulation metrics retrieved"
    )
