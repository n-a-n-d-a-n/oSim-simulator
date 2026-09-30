"""Pydantic schemas for Deadlock Detection and Banker's Algorithm API."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class RequestOutcomeEnum(str, Enum):
    GRANTED = "GRANTED"
    WAITING = "WAITING"
    DENIED = "DENIED"
    ERROR = "ERROR"


class GraphNodeResponse(BaseModel):
    id: str
    label: str
    node_type: str
    capacity: Optional[int] = None
    available: Optional[int] = None


class GraphEdgeResponse(BaseModel):
    source: str
    target: str
    edge_type: str
    weight: int = 1


class GraphSnapshotResponse(BaseModel):
    nodes: List[GraphNodeResponse]
    edges: List[GraphEdgeResponse]
    has_cycle: bool
    cycles: List[List[str]] = Field(default_factory=list)
    is_wfg: bool = False


class SafetyStepResponse(BaseModel):
    step_index: int
    evaluated_process: Optional[str]
    work_before: List[int]
    work_after: List[int]
    finish_vector: List[bool]
    is_satisfied: bool
    safe_sequence_so_far: List[str]
    description: str


class DetectionStepResponse(BaseModel):
    step_index: int
    evaluated_process: Optional[str]
    work_before: List[int]
    work_after: List[int]
    finish_vector: List[bool]
    is_reduced: bool
    unreduced_processes: List[str]
    description: str


class RequestEvaluationResponse(BaseModel):
    process_id: str
    request_vector: List[int]
    decision: RequestOutcomeEnum
    reason: str
    tentative_available: Optional[List[int]] = None
    tentative_allocation: Optional[List[List[int]]] = None
    tentative_need: Optional[List[List[int]]] = None
    safe_sequence: Optional[List[str]] = None


class DeadlockSystemStateResponse(BaseModel):
    step_index: int
    processes: List[str]
    resource_types: List[str]
    total: List[int]
    available: List[int]
    allocation: List[List[int]]
    maximum: List[List[int]]
    need: List[List[int]]
    request: List[List[int]]


class DeadlockTimelineSnapshotResponse(BaseModel):
    tick: int
    description: str
    system_state: DeadlockSystemStateResponse
    safety_step: Optional[SafetyStepResponse] = None
    detection_step: Optional[DetectionStepResponse] = None
    request_step: Optional[RequestEvaluationResponse] = None
    metrics: Optional[Dict[str, Any]] = None


class DeadlockEventResponse(BaseModel):
    event_id: str
    tick: int
    event_type: str
    component: str
    description: str
    details: Dict[str, Any] = Field(default_factory=dict)


class DeadlockMetricsResponse(BaseModel):
    total_processes: int
    total_resource_types: int
    total_resource_instances: int
    allocated_instances: int
    available_instances: int
    resource_utilization_ratio: float
    is_safe: Optional[bool] = None
    safe_sequence: List[str] = Field(default_factory=list)
    is_deadlocked: Optional[bool] = None
    deadlocked_process_count: int = 0
    deadlocked_processes: List[str] = Field(default_factory=list)
    request_count: int = 0
    granted_requests: int = 0
    waiting_requests: int = 0
    denied_requests: int = 0
    safety_checks: int = 0
    detection_checks: int = 0


class DeadlockSafetyRequest(BaseModel):
    """Request payload for Banker's safety evaluation."""
    processes: List[str] = Field(min_length=1, max_length=16, description="List of process identifiers.")
    resource_types: List[str] = Field(min_length=1, max_length=10, description="List of resource type identifiers.")
    total: List[int] = Field(description="Total instances per resource type.")
    available: List[int] = Field(description="Currently available instances per resource type.")
    allocation: List[List[int]] = Field(description="Matrix Alloc[n][m] of current allocations.")
    maximum: List[List[int]] = Field(description="Matrix Max[n][m] of declared maximum claims.")
    need: Optional[List[List[int]]] = Field(default=None, description="Optional Need matrix (validated if provided).")


class DeadlockResourceRequestInput(BaseModel):
    """Request payload for a specific process resource request under Banker's algorithm."""
    processes: List[str] = Field(min_length=1, max_length=16)
    resource_types: List[str] = Field(min_length=1, max_length=10)
    total: List[int]
    available: List[int]
    allocation: List[List[int]]
    maximum: List[List[int]]
    requesting_process_id: str
    request_vector: List[int]


class DeadlockDetectRequest(BaseModel):
    """Request payload for multi-instance deadlock detection using the Request matrix."""
    processes: List[str] = Field(min_length=1, max_length=16)
    resource_types: List[str] = Field(min_length=1, max_length=10)
    total: List[int]
    available: List[int]
    allocation: List[List[int]]
    request: List[List[int]] = Field(description="Matrix Request[n][m] of outstanding requests.")


class DeadlockSimulationResponse(BaseModel):
    """Complete response payload for a safety, request, or detection simulation run."""
    mode: str
    timeline: List[DeadlockTimelineSnapshotResponse]
    events: List[DeadlockEventResponse]
    metrics: DeadlockMetricsResponse
    rag_snapshot: GraphSnapshotResponse
    wfg_snapshot: Optional[GraphSnapshotResponse] = None
    is_safe: Optional[bool] = None
    safe_sequence: Optional[List[str]] = None
    is_deadlocked: Optional[bool] = None
    deadlocked_processes: Optional[List[str]] = None
    request_result: Optional[RequestEvaluationResponse] = None


class DeadlockPresetItemResponse(BaseModel):
    """Educational preset scenario descriptor."""
    id: str
    name: str
    category: str
    description: str
    processes: List[str]
    resource_types: List[str]
    total: List[int]
    available: List[int]
    allocation: List[List[int]]
    maximum: List[List[int]]
    need: List[List[int]]
    request: List[List[int]]
    default_request_process_id: Optional[str] = None
    default_request_vector: Optional[List[int]] = None
    expected_is_safe: Optional[bool] = None
    expected_safe_sequence: Optional[List[str]] = None
    expected_is_deadlocked: Optional[bool] = None
    expected_deadlocked_processes: Optional[List[str]] = None
    pedagogical_notes: str
