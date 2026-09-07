"""Workload presets endpoints for OSim."""

from typing import List, Dict
from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.cpu import (
    AlgorithmType,
    PresetItemResponse,
    ProcessInput,
)
from backend.sim_engine.workload.presets import (
    get_silberschatz_fcfs_sjf_workload,
    get_silberschatz_srtf_workload,
    get_silberschatz_rr_workload,
    get_silberschatz_priority_workload,
)

router = APIRouter(prefix="/workloads", tags=["Workload Presets"])


def _build_preset_registry() -> Dict[str, PresetItemResponse]:
    return {
        "silberschatz-fcfs-sjf": PresetItemResponse(
            id="silberschatz-fcfs-sjf",
            name="Silberschatz FCFS / SJF Benchmark",
            description="Classic 3-process workload from Silberschatz Chapter 5 comparing convoy effect in FCFS vs optimal SJF.",
            recommended_algorithm=AlgorithmType.FCFS,
            processes=[
                ProcessInput(pid=p.pid, arrival_time=p.arrival_time, burst_time=p.burst_time, priority=p.priority)
                for p in get_silberschatz_fcfs_sjf_workload()
            ],
        ),
        "silberschatz-srtf": PresetItemResponse(
            id="silberschatz-srtf",
            name="Silberschatz SRTF Benchmark",
            description="Staggered arrival benchmark from Silberschatz Chapter 5 demonstrating preemption when shorter jobs arrive.",
            recommended_algorithm=AlgorithmType.SRTF,
            processes=[
                ProcessInput(pid=p.pid, arrival_time=p.arrival_time, burst_time=p.burst_time, priority=p.priority)
                for p in get_silberschatz_srtf_workload()
            ],
        ),
        "silberschatz-round-robin": PresetItemResponse(
            id="silberschatz-round-robin",
            name="Silberschatz Round Robin Benchmark (q=4)",
            description="Round Robin time-slicing demonstration with time quantum = 4.",
            recommended_algorithm=AlgorithmType.ROUND_ROBIN,
            time_quantum=4,
            processes=[
                ProcessInput(pid=p.pid, arrival_time=p.arrival_time, burst_time=p.burst_time, priority=p.priority)
                for p in get_silberschatz_rr_workload()
            ],
        ),
        "silberschatz-priority": PresetItemResponse(
            id="silberschatz-priority",
            name="Silberschatz Priority Benchmark",
            description="5-process priority benchmark from Silberschatz Chapter 5 (where priority 1 is highest).",
            recommended_algorithm=AlgorithmType.PRIORITY_NON_PREEMPTIVE,
            processes=[
                ProcessInput(pid=p.pid, arrival_time=p.arrival_time, burst_time=p.burst_time, priority=p.priority)
                for p in get_silberschatz_priority_workload()
            ],
        ),
    }


@router.get(
    "",
    response_model=List[PresetItemResponse],
    summary="Get all canonical workload presets",
)
def get_all_workloads() -> List[PresetItemResponse]:
    presets = _build_preset_registry()
    return list(presets.values())


@router.get(
    "/{preset_id}",
    response_model=PresetItemResponse,
    summary="Get a specific workload preset",
)
def get_workload_by_id(preset_id: str) -> PresetItemResponse:
    presets = _build_preset_registry()
    if preset_id not in presets:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Preset '{preset_id}' not found. Available presets: {', '.join(presets.keys())}",
        )
    return presets[preset_id]
