"""FastAPI router for Deadlock Detection and Banker's Algorithm subsystem."""

from typing import List
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.deadlock import (
    DeadlockSafetyRequest,
    DeadlockResourceRequestInput,
    DeadlockDetectRequest,
    DeadlockSimulationResponse,
    DeadlockPresetItemResponse,
)
from backend.sim_engine.deadlock import (
    ResourceSystem,
    DomainValidationError,
    DeadlockSimulationEngine,
    DEADLOCK_PRESETS,
    get_deadlock_preset_by_id,
)

router = APIRouter(prefix="/deadlock", tags=["Deadlock / Banker's Algorithm"])


@router.post(
    "/safety",
    response_model=DeadlockSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate Banker's Safety Algorithm",
    description="Tests if the given allocation, maximum, and available vectors form a safe state and computes the deterministic safe sequence.",
)
def evaluate_banker_safety(request: DeadlockSafetyRequest) -> DeadlockSimulationResponse:
    try:
        system = ResourceSystem.from_vectors(
            processes=request.processes,
            resource_types=request.resource_types,
            total=request.total,
            available=request.available,
            allocation=request.allocation,
            maximum=request.maximum,
            explicit_need=request.need,
        )
        sim_result = DeadlockSimulationEngine.simulate_safety(system)
    except (DomainValidationError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    except AssertionError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation invariant violation: {err}",
        )

    return DeadlockSimulationResponse.model_validate(sim_result.to_dict())


@router.post(
    "/request",
    response_model=DeadlockSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate a resource request under Banker's Avoidance",
    description="Evaluates a specific process resource request through claim validation, availability check, and tentative safety analysis.",
)
def evaluate_resource_request(request: DeadlockResourceRequestInput) -> DeadlockSimulationResponse:
    try:
        system = ResourceSystem.from_vectors(
            processes=request.processes,
            resource_types=request.resource_types,
            total=request.total,
            available=request.available,
            allocation=request.allocation,
            maximum=request.maximum,
        )
        sim_result = DeadlockSimulationEngine.simulate_request(
            system=system,
            process_id=request.requesting_process_id,
            request_vector=request.request_vector,
        )
    except (DomainValidationError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    except AssertionError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation invariant violation: {err}",
        )

    return DeadlockSimulationResponse.model_validate(sim_result.to_dict())


@router.post(
    "/detect",
    response_model=DeadlockSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect deadlocks using multi-instance matrix reduction and graph analysis",
    description="Performs Coffman/Silberschatz multi-instance matrix reduction using the Request matrix and constructs bipartite RAG and WFG.",
)
def detect_deadlock(request: DeadlockDetectRequest) -> DeadlockSimulationResponse:
    try:
        system = ResourceSystem.from_vectors(
            processes=request.processes,
            resource_types=request.resource_types,
            total=request.total,
            available=request.available,
            allocation=request.allocation,
            request=request.request,
        )
        sim_result = DeadlockSimulationEngine.simulate_detection(system)
    except (DomainValidationError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    except AssertionError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation invariant violation: {err}",
        )

    return DeadlockSimulationResponse.model_validate(sim_result.to_dict())


@router.get(
    "/workloads",
    response_model=List[DeadlockPresetItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List educational deadlock and Banker's algorithm presets",
)
def list_deadlock_workloads() -> List[DeadlockPresetItemResponse]:
    return [DeadlockPresetItemResponse.model_validate(p.to_dict()) for p in DEADLOCK_PRESETS]


@router.get(
    "/workloads/{preset_id}",
    response_model=DeadlockPresetItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get a specific educational deadlock preset",
)
def get_deadlock_workload(preset_id: str) -> DeadlockPresetItemResponse:
    try:
        preset = get_deadlock_preset_by_id(preset_id)
        return DeadlockPresetItemResponse.model_validate(preset.to_dict())
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Deadlock preset '{preset_id}' not found.",
        )
