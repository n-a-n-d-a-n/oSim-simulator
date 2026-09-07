"""FastAPI router for CPU scheduling simulation."""

from fastapi import APIRouter, HTTPException, status
from backend.app.schemas.cpu import (
    AlgorithmType,
    CPUSimulateRequest,
    CPUSimulateResponse,
)
from backend.sim_engine.core.process import ProcessDefinition
from backend.sim_engine.cpu import (
    FCFSScheduler,
    SJFScheduler,
    SRTFScheduler,
    RoundRobinScheduler,
    PriorityScheduler,
    CPUSimulationEngine,
)

router = APIRouter(prefix="/cpu", tags=["CPU Scheduling"])


@router.post(
    "/simulate",
    response_model=CPUSimulateResponse,
    status_code=status.HTTP_200_OK,
    summary="Simulate CPU scheduling algorithm",
    description="Simulates execution of given processes using the specified scheduling algorithm and returns full timeline.",
)
def simulate_cpu(request: CPUSimulateRequest) -> CPUSimulateResponse:
    # 1. Instantiate the requested scheduler strategy
    if request.algorithm == AlgorithmType.FCFS:
        scheduler = FCFSScheduler()
    elif request.algorithm == AlgorithmType.SJF:
        scheduler = SJFScheduler()
    elif request.algorithm == AlgorithmType.SRTF:
        scheduler = SRTFScheduler()
    elif request.algorithm == AlgorithmType.ROUND_ROBIN:
        if not request.time_quantum or request.time_quantum <= 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Round Robin requires a positive integer 'time_quantum' >= 1.",
            )
        scheduler = RoundRobinScheduler(time_quantum=request.time_quantum)
    elif request.algorithm == AlgorithmType.PRIORITY_NON_PREEMPTIVE:
        scheduler = PriorityScheduler(
            preemptive=False,
            lower_number_higher_priority=request.lower_number_higher_priority,
        )
    elif request.algorithm == AlgorithmType.PRIORITY_PREEMPTIVE:
        scheduler = PriorityScheduler(
            preemptive=True,
            lower_number_higher_priority=request.lower_number_higher_priority,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported algorithm '{request.algorithm}'.",
        )

    # 2. Convert input process definitions to domain models
    process_defs = [
        ProcessDefinition(
            pid=p.pid.strip(),
            arrival_time=p.arrival_time,
            burst_time=p.burst_time,
            priority=p.priority,
            memory_required=p.memory_required,
        )
        for p in request.processes
    ]

    # 3. Execute the simulation engine deterministically
    try:
        engine = CPUSimulationEngine(
            scheduler=scheduler,
            processes=process_defs,
            context_switch_overhead=request.context_switch_cost,
            max_ticks=request.max_ticks,
        )
        result = engine.run()
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Simulation error: {str(e)}",
        )

    # 4. Serialize into response schema
    result_dict = result.to_dict()
    return CPUSimulateResponse(
        scheduler_name=result.scheduler_name,
        algorithm=request.algorithm,
        terminated_normally=result.terminated_normally,
        total_simulation_time=result.metrics.total_simulation_time,
        gantt_segments=result_dict["gantt_segments"],
        metrics=result_dict["metrics"],
        timeline=result_dict["timeline"],
        events=result_dict["events"],
    )
