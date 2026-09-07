"""Pydantic request and response schemas for Memory Simulation API."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator


class MemoryAlgorithmType(str, Enum):
    FIRST_FIT = "FIRST_FIT"
    BEST_FIT = "BEST_FIT"
    WORST_FIT = "WORST_FIT"
    NEXT_FIT = "NEXT_FIT"


class MemoryOperationType(str, Enum):
    ALLOCATE = "ALLOCATE"
    DEALLOCATE = "DEALLOCATE"


class MemoryOperationInput(BaseModel):
    """Input definition for a scheduled memory operation."""
    tick: int = Field(ge=0, description="Discrete simulation tick when this operation executes.")
    operation_type: MemoryOperationType = Field(description="ALLOCATE or DEALLOCATE.")
    request_id: str = Field(min_length=1, max_length=32, description="Process or request ID.")
    size: Optional[int] = Field(
        default=None,
        description="Memory units requested (required for ALLOCATE, ignored for DEALLOCATE).",
    )

    @model_validator(mode="after")
    def validate_operation_parameters(self) -> "MemoryOperationInput":
        if self.operation_type == MemoryOperationType.ALLOCATE:
            if self.size is None or self.size <= 0:
                raise ValueError("ALLOCATE operation requires a strictly positive 'size' > 0.")
        return self


class MemoryBlockResponse(BaseModel):
    start_address: int
    size: int
    end_address: int
    is_free: bool
    owner_id: Optional[str] = None


class MemoryMetricsResponse(BaseModel):
    total_memory: int
    used_memory: int
    free_memory: int
    allocated_block_count: int
    free_block_count: int
    largest_free_block: int
    external_fragmentation: int
    external_fragmentation_ratio: float
    internal_fragmentation: int
    allocation_success_count: int
    allocation_failure_count: int


class OperationResultResponse(BaseModel):
    tick: int
    operation_type: str
    request_id: str
    size: Optional[int] = None
    success: bool
    allocated_start_address: Optional[int] = None
    allocated_size: Optional[int] = None
    reason: Optional[str] = None


class MemoryStateResponse(BaseModel):
    tick: int
    total_memory: int
    blocks: List[MemoryBlockResponse]
    next_fit_cursor: int
    metrics: MemoryMetricsResponse
    last_operation_result: Optional[OperationResultResponse] = None


class MemoryEventResponse(BaseModel):
    event_id: str
    tick: int
    event_type: str
    component: str
    description: str
    details: Dict[str, Any] = Field(default_factory=dict)


class MemorySimulateRequest(BaseModel):
    """Request payload for contiguous memory allocation simulation."""
    algorithm: MemoryAlgorithmType = Field(description="Contiguous memory allocation algorithm.")
    memory_size: int = Field(ge=10, le=100000, description="Total physical memory capacity.")
    operations: List[MemoryOperationInput] = Field(
        min_length=1,
        description="Chronological or multi-tick list of operations.",
    )
    max_ticks: int = Field(default=1000, ge=1, le=5000, description="Maximum tick safety bound.")


class MemorySimulateResponse(BaseModel):
    """Full simulation result response containing timeline and metrics."""
    algorithm_name: str
    memory_size: int
    terminated_normally: bool
    timeline: List[MemoryStateResponse]
    events: List[MemoryEventResponse]
    operation_results: List[OperationResultResponse]
    final_metrics: MemoryMetricsResponse


class MemoryPresetItemResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    recommended_algorithm: str
    memory_size: int
    operations: List[MemoryOperationInput]
