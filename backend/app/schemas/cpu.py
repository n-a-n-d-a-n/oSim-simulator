"""Pydantic schemas for CPU scheduling API requests and responses."""

from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field, model_validator


class AlgorithmType(str, Enum):
    FCFS = "FCFS"
    SJF = "SJF"
    SRTF = "SRTF"
    ROUND_ROBIN = "ROUND_ROBIN"
    PRIORITY_NON_PREEMPTIVE = "PRIORITY_NON_PREEMPTIVE"
    PRIORITY_PREEMPTIVE = "PRIORITY_PREEMPTIVE"


class ProcessInput(BaseModel):
    pid: str = Field(..., min_length=1, max_length=20, description="Unique Process Identifier")
    arrival_time: int = Field(..., ge=0, description="Arrival time in simulation ticks (>= 0)")
    burst_time: int = Field(..., ge=0, description="Total CPU burst time in ticks (>= 0)")
    priority: int = Field(default=0, description="Process priority (integer)")
    memory_required: int = Field(default=0, ge=0, description="Memory requirement for future phases")


class CPUSimulateRequest(BaseModel):
    algorithm: AlgorithmType
    processes: List[ProcessInput]
    time_quantum: Optional[int] = Field(
        default=None,
        description="Time quantum for Round Robin (required when algorithm is ROUND_ROBIN)",
    )
    lower_number_higher_priority: bool = Field(
        default=True,
        description="Priority interpretation (True: 1 is higher priority than 5; False: 5 is higher)",
    )
    context_switch_cost: int = Field(
        default=0,
        ge=0,
        description="Context switch overhead in ticks (>= 0)",
    )
    max_ticks: int = Field(
        default=2000,
        ge=1,
        le=10000,
        description="Maximum allowed simulation ticks as safeguard",
    )

    @model_validator(mode="after")
    def validate_request(self):
        # 1. Process list cannot be empty
        if not self.processes:
            raise ValueError("Process list cannot be empty. Please provide at least one process.")

        # 2. Check for duplicate PIDs
        pids = [p.pid.strip() for p in self.processes]
        if len(pids) != len(set(pids)):
            duplicates = [pid for pid in set(pids) if pids.count(pid) > 1]
            raise ValueError(f"Duplicate process IDs detected: {', '.join(duplicates)}. Each PID must be unique.")

        # 3. Round Robin must have a valid positive time_quantum
        if self.algorithm == AlgorithmType.ROUND_ROBIN:
            if self.time_quantum is None or self.time_quantum <= 0:
                raise ValueError("Round Robin scheduling requires 'time_quantum' >= 1.")

        return self


class GanttSegmentResponse(BaseModel):
    pid: Optional[str]
    start_time: int
    end_time: int
    duration: int
    is_context_switch: bool
    is_idle: bool


class ProcessMetricsResponse(BaseModel):
    pid: str
    arrival_time: int
    burst_time: int
    completion_time: int
    turnaround_time: int
    waiting_time: int
    response_time: int


class AggregateMetricsResponse(BaseModel):
    total_simulation_time: int
    total_busy_ticks: int
    total_idle_ticks: int
    total_context_switch_ticks: int
    context_switch_count: int
    cpu_utilization_percent: float
    throughput_per_tick: float
    average_turnaround_time: float
    average_waiting_time: float
    average_response_time: float
    process_metrics: Dict[str, ProcessMetricsResponse]


class SimulationEventResponse(BaseModel):
    event_id: str
    tick: int
    event_type: str
    component: str
    description: str
    details: Dict[str, Any]


class ProcessSnapshotResponse(BaseModel):
    pid: str
    arrival_time: int
    burst_time: int
    remaining_time: int
    priority: int
    state: str
    executed_time: int
    start_time: Optional[int]
    completion_time: Optional[int]
    waiting_time: int
    turnaround_time: int
    response_time: Optional[int]
    queue_level: int
    memory_required: int


class CPUStateResponse(BaseModel):
    running_pid: Optional[str]
    is_context_switching: bool
    context_switch_remaining: int
    current_quantum_remaining: int
    total_busy_ticks: int
    total_idle_ticks: int
    total_context_switch_ticks: int


class SystemStateResponse(BaseModel):
    clock: int
    cpu: CPUStateResponse
    processes: Dict[str, ProcessSnapshotResponse]
    ready_queue: List[str]
    waiting_queue: List[str]
    terminated_pids: List[str]


class CPUSimulateResponse(BaseModel):
    scheduler_name: str
    algorithm: AlgorithmType
    terminated_normally: bool
    total_simulation_time: int
    gantt_segments: List[GanttSegmentResponse]
    metrics: AggregateMetricsResponse
    timeline: List[SystemStateResponse]
    events: List[SimulationEventResponse]


class PresetItemResponse(BaseModel):
    id: str
    name: str
    description: str
    recommended_algorithm: AlgorithmType
    time_quantum: Optional[int] = None
    processes: List[ProcessInput]
