"""FastAPI router for Virtual Memory and Page Replacement simulation."""

from typing import List
from fastapi import APIRouter, HTTPException, status

from backend.app.schemas.virtual_memory import (
    VirtualMemoryAlgorithmType,
    VirtualMemorySimulateRequest,
    VirtualMemorySimulateResponse,
    VirtualMemoryPresetItemResponse,
    InputMode as SchemaInputMode,
)
from backend.sim_engine.virtual_memory import (
    get_replacement_algorithm,
    VirtualMemorySimulationEngine,
    InputMode as DomainInputMode,
    ALL_VM_PRESETS,
    get_vm_preset_by_id,
)

router = APIRouter(prefix="/virtual-memory", tags=["Virtual Memory"])


@router.post(
    "/simulate",
    response_model=VirtualMemorySimulateResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate virtual memory paging and page replacement",
    description="Simulates memory references using FIFO, LRU, Optimal, or Clock page replacement.",
)
def simulate_virtual_memory(request: VirtualMemorySimulateRequest) -> VirtualMemorySimulateResponse:
    # 1. Instantiate replacement strategy
    try:
        algorithm = get_replacement_algorithm(request.algorithm.value)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # 2. Map input mode
    domain_mode = (
        DomainInputMode.PAGE_REFERENCE
        if request.input_mode == SchemaInputMode.PAGE_REFERENCE
        else DomainInputMode.VIRTUAL_ADDRESS
    )

    # 3. Instantiate and run discrete-time simulation engine
    try:
        engine = VirtualMemorySimulationEngine(
            algorithm=algorithm,
            frame_count=request.frame_count,
            page_size=request.page_size,
            virtual_page_count=request.virtual_page_count,
            input_mode=domain_mode,
            raw_references=request.references,
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
    return VirtualMemorySimulateResponse.model_validate(result_dict)


@router.get(
    "/workloads",
    response_model=List[VirtualMemoryPresetItemResponse],
    status_code=status.HTTP_200_OK,
    summary="List educational virtual memory workload presets",
)
def list_virtual_memory_workloads() -> List[VirtualMemoryPresetItemResponse]:
    return [VirtualMemoryPresetItemResponse.model_validate(p.to_dict()) for p in ALL_VM_PRESETS]


@router.get(
    "/workloads/{preset_id}",
    response_model=VirtualMemoryPresetItemResponse,
    status_code=status.HTTP_200_OK,
    summary="Get specific virtual memory workload preset",
)
def get_virtual_memory_workload(preset_id: str) -> VirtualMemoryPresetItemResponse:
    try:
        preset = get_vm_preset_by_id(preset_id)
        return VirtualMemoryPresetItemResponse.model_validate(preset.to_dict())
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Virtual memory preset '{preset_id}' not found.",
        )
