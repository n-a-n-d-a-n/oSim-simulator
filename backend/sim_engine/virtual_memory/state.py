"""State models and immutable timeline snapshots for virtual memory simulation."""

from dataclasses import dataclass
from enum import Enum
from typing import Optional, Dict, Any, Tuple


class InputMode(str, Enum):
    PAGE_REFERENCE = "PAGE_REFERENCE"
    VIRTUAL_ADDRESS = "VIRTUAL_ADDRESS"


@dataclass(frozen=True)
class MemoryReference:
    """A discrete memory reference in the simulation sequence."""
    reference_index: int
    page_number: int
    virtual_address: Optional[int] = None
    offset: int = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "reference_index": self.reference_index,
            "page_number": self.page_number,
            "virtual_address": self.virtual_address,
            "offset": self.offset,
        }


@dataclass(frozen=True)
class PageTableEntrySnapshot:
    """Immutable snapshot of a single page table entry at a discrete simulation step."""
    page_number: int
    is_present: bool  # True = resident in physical memory with allocated frame; False = not resident
    frame_number: Optional[int] = None
    reference_bit: int = 0
    loaded_at_tick: Optional[int] = None
    last_accessed_tick: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "page_number": self.page_number,
            "is_present": self.is_present,
            "frame_number": self.frame_number,
            "reference_bit": self.reference_bit,
            "loaded_at_tick": self.loaded_at_tick,
            "last_accessed_tick": self.last_accessed_tick,
        }


@dataclass(frozen=True)
class FrameSnapshot:
    """Immutable snapshot of a physical RAM frame at a discrete simulation step."""
    frame_number: int
    is_occupied: bool
    page_number: Optional[int] = None
    reference_bit: int = 0
    loaded_at_tick: Optional[int] = None
    last_accessed_tick: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "frame_number": self.frame_number,
            "is_occupied": self.is_occupied,
            "page_number": self.page_number,
            "reference_bit": self.reference_bit,
            "loaded_at_tick": self.loaded_at_tick,
            "last_accessed_tick": self.last_accessed_tick,
        }


@dataclass(frozen=True)
class ReplacementDecision:
    """Record of a victim frame selection during page replacement."""
    step_index: int
    requested_page: int
    victim_page: Optional[int]
    allocated_frame: int
    algorithm_name: str
    reason: str
    clock_hand_before: Optional[int] = None
    clock_hand_after: Optional[int] = None
    frames_scanned: Optional[Tuple[int, ...]] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_index": self.step_index,
            "requested_page": self.requested_page,
            "victim_page": self.victim_page,
            "allocated_frame": self.allocated_frame,
            "algorithm_name": self.algorithm_name,
            "reason": self.reason,
            "clock_hand_before": self.clock_hand_before,
            "clock_hand_after": self.clock_hand_after,
            "frames_scanned": list(self.frames_scanned) if self.frames_scanned else None,
        }


@dataclass(frozen=True)
class VirtualMemoryMetricsSnapshot:
    """Cumulative educational metrics for virtual memory performance."""
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

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_references": self.total_references,
            "page_hits": self.page_hits,
            "page_faults": self.page_faults,
            "hit_ratio": self.hit_ratio,
            "fault_ratio": self.fault_ratio,
            "total_translations": self.total_translations,
            "replacements": self.replacements,
            "evictions": self.evictions,
            "free_frames": self.free_frames,
            "resident_pages": self.resident_pages,
        }


@dataclass(frozen=True)
class VirtualMemorySnapshot:
    """Central immutable snapshot of the entire virtual memory subsystem at step t."""
    step_index: int
    reference: MemoryReference
    is_hit: bool
    is_fault: bool
    frame_number: int
    physical_address: Optional[int]
    page_table: Tuple[PageTableEntrySnapshot, ...]
    frames: Tuple[FrameSnapshot, ...]
    free_frames_count: int
    replacement_decision: Optional[ReplacementDecision] = None
    clock_hand: Optional[int] = None
    metrics: Optional[VirtualMemoryMetricsSnapshot] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_index": self.step_index,
            "reference": self.reference.to_dict(),
            "is_hit": self.is_hit,
            "is_fault": self.is_fault,
            "frame_number": self.frame_number,
            "physical_address": self.physical_address,
            "page_table": [entry.to_dict() for entry in self.page_table],
            "frames": [frame.to_dict() for frame in self.frames],
            "free_frames_count": self.free_frames_count,
            "replacement_decision": (
                self.replacement_decision.to_dict() if self.replacement_decision else None
            ),
            "clock_hand": self.clock_hand,
            "metrics": self.metrics.to_dict() if self.metrics else None,
        }
