"""FastAPI router for Contiguous Memory Allocation simulation."""

from typing import List
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.memory import (
    MemoryAlgorithmType,
    MemorySimulateRequest,
    MemorySimulateResponse,
    MemoryPresetItemResponse,
)
from backend.sim_engine.memory import (
    FirstFitAllocator,
    BestFitAllocator,
    WorstFitAllocator,
    NextFitAllocator,
    MemoryOperation,
    MemoryOperationType,
    MemorySimulationEngine,
    ALL_MEMORY_PRESETS,
    get_memory_preset_by_id,
)

router = APIRouter(prefix="/memory", tags=["Memory Allocation"])


@router.post(
    "/simulate",
    response_model=MemorySimulateResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate contiguous memory allocation",
    description="Simulates memory operations using First Fit, Best Fit, Worst Fit, or Next Fit.",
)
def simulate_memory(request: MemorySimulateRequest) -> MemorySimulateResponse:
    # 1. Instantiate the requested allocator strategy
    if request.algorithm == MemoryAlgorithmType.FIRST_FIT:
        allocator = FirstFitAllocator()
    elif request.algorithm == MemoryAlgorithmType.BEST_FIT:
        allocator = BestFitAllocator()
    elif request.algorithm == MemoryAlgorithmType.WORST_FIT:
        allocator = WorstFitAllocator()
    elif request.algorithm == MemoryAlgorithmType.NEXT_FIT:
        allocator = NextFitAllocator()
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported algorithm '{request.algorithm}'.",
        )

    # 2. Convert input operations to domain models
    domain_operations: List[MemoryOperation] = []
    for op_in in request.operations:
        domain_operations.append(
            MemoryOperation(
                tick=op_in.tick,
                operation_type=MemoryOperationType(op_in.operation_type.value),
                request_id=op_in.request_id,
                size=op_in.size,
            )
        )

    # 3. Instantiate and run discrete-time memory simulation engine
    try:
        engine = MemorySimulationEngine(
            allocator=allocator,
            memory_size=request.memory_size,
            operations=domain_operations,
            max_ticks=request.max_ticks,
        )
        sim_result = engine.run()
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(err),
        )
    except AssertionError as err:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal simulation invariant violation: {err}",
        )

    # 4. Serialize to API response
    result_dict = sim_result.to_dict()
    return MemorySimulateResponse.model_validate(result_dict)


@router.get(
    "/workloads",
    response_model=List[MemoryPresetItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List educational memory workload presets",
)
def list_memory_workloads() -> List[MemoryPresetItemResponse]:
    return [MemoryPresetItemResponse.model_validate(p.to_dict()) for p in ALL_MEMORY_PRESETS]


@router.get(
    "/workloads/{preset_id}",
    response_model=MemoryPresetItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get specific memory workload preset",
)
def get_memory_workload(preset_id: str) -> MemoryPresetItemResponse:
    try:
        preset = get_memory_preset_by_id(preset_id)
        return MemoryPresetItemResponse.model_validate(preset.to_dict())
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Memory preset '{preset_id}' not found.",
        )
