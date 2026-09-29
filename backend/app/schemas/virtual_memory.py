"""Pydantic request and response schemas for Virtual Memory Simulation API."""

from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, model_validator
from backend.sim_engine.virtual_memory.address import is_power_of_two


class VirtualMemoryAlgorithmType(str, Enum):
    FIFO = "FIFO"
    LRU = "LRU"
    OPTIMAL = "OPTIMAL"
    CLOCK = "CLOCK"


class InputMode(str, Enum):
    PAGE_REFERENCE = "PAGE_REFERENCE"
    VIRTUAL_ADDRESS = "VIRTUAL_ADDRESS"


class MemoryReferenceResponse(BaseModel):
    reference_index: int
    page_number: int
    virtual_address: Optional[int] = None
    offset: int = 0


class PageTableEntryResponse(BaseModel):
    page_number: int
    is_present: bool
    frame_number: Optional[int] = None
    reference_bit: int = 0
    loaded_at_tick: Optional[int] = None
    last_accessed_tick: Optional[int] = None


class FrameResponse(BaseModel):
    frame_number: int
    is_occupied: bool
    page_number: Optional[int] = None
    reference_bit: int = 0
    loaded_at_tick: Optional[int] = None
    last_accessed_tick: Optional[int] = None


class ReplacementDecisionResponse(BaseModel):
    step_index: int
    requested_page: int
    victim_page: Optional[int] = None
    allocated_frame: int
    algorithm_name: str
    reason: str
    clock_hand_before: Optional[int] = None
    clock_hand_after: Optional[int] = None
    frames_scanned: Optional[List[int]] = None


class VirtualMemoryMetricsResponse(BaseModel):
    total_references: int
    page_hits: int
    page_faults: int
    hit_ratio: float
    fault_ratio: float
    total_translations: int
    replacements: int
    evictions: int
    free_frames: int
    resident_pages: int


class VirtualMemorySnapshotResponse(BaseModel):
    step_index: int
    reference: MemoryReferenceResponse
    is_hit: bool
    is_fault: bool
    frame_number: int
    physical_address: Optional[int] = None
    page_table: List[PageTableEntryResponse]
    frames: List[FrameResponse]
    free_frames_count: int
    replacement_decision: Optional[ReplacementDecisionResponse] = None
    clock_hand: Optional[int] = None
    metrics: Optional[VirtualMemoryMetricsResponse] = None


class VirtualMemoryEventResponse(BaseModel):
    event_id: str
    tick: int
    event_type: str
    component: str
    description: str
    details: Dict[str, Any] = Field(default_factory=dict)


class VirtualMemorySimulateRequest(BaseModel):
    """Request payload for virtual memory simulation."""
    algorithm: VirtualMemoryAlgorithmType = Field(description="Page replacement algorithm: FIFO, LRU, OPTIMAL, CLOCK.")
    frame_count: int = Field(default=3, ge=2, le=32, description="Physical memory frame count.")
    page_size: int = Field(default=4096, ge=256, le=65536, description="Page size in bytes (must be power of 2).")
    virtual_page_count: int = Field(default=16, ge=2, le=256, description="Virtual page count (must be power of 2).")
    input_mode: InputMode = Field(default=InputMode.PAGE_REFERENCE, description="PAGE_REFERENCE or VIRTUAL_ADDRESS.")
    references: List[int] = Field(min_length=0, max_length=1000, description="Reference stream (pages or byte addresses).")

    @field_validator("page_size")
    @classmethod
    def validate_page_size(cls, v: int) -> int:
        if not is_power_of_two(v):
            raise ValueError(f"page_size must be a power of two, got {v}")
        return v

    @field_validator("virtual_page_count")
    @classmethod
    def validate_virtual_page_count(cls, v: int) -> int:
        if not is_power_of_two(v):
            raise ValueError(f"virtual_page_count must be a power of two, got {v}")
        return v


class VirtualMemorySimulateResponse(BaseModel):
    """Full simulation result response containing timeline and metrics."""
    algorithm_name: str
    num_frames: int
    page_size: int
    virtual_page_count: int
    input_mode: str
    timeline: List[VirtualMemorySnapshotResponse]
    events: List[VirtualMemoryEventResponse]
    final_metrics: VirtualMemoryMetricsResponse
    terminated_normally: bool


class VirtualMemoryPresetItemResponse(BaseModel):
    id: str
    name: str
    category: str
    description: str
    recommended_algorithm: str
    frame_count: int
    page_size: int
    virtual_page_count: int
    input_mode: str
    raw_references: List[int]
