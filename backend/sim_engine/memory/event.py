"""Standardized memory simulation events for OSim Phase 3."""

from enum import Enum
from typing import Dict, Any, Optional

from backend.sim_engine.core.event import SimulationEvent


class MemoryEventType(str, Enum):
    MEMORY_ALLOCATION_REQUESTED = "MEMORY_ALLOCATION_REQUESTED"
    MEMORY_ALLOCATED = "MEMORY_ALLOCATED"
    MEMORY_ALLOCATION_FAILED = "MEMORY_ALLOCATION_FAILED"
    MEMORY_DEALLOCATED = "MEMORY_DEALLOCATED"
    MEMORY_BLOCK_SPLIT = "MEMORY_BLOCK_SPLIT"
    MEMORY_BLOCK_MERGED = "MEMORY_BLOCK_MERGED"
    MEMORY_STATE_CHANGED = "MEMORY_STATE_CHANGED"


def create_memory_event(
    tick: int,
    event_type: MemoryEventType,
    description: str,
    details: Optional[Dict[str, Any]] = None,
    event_id: Optional[str] = None,
) -> SimulationEvent:
    """Helper to construct a standardized SimulationEvent for the memory subsystem."""
    return SimulationEvent(
        event_id=event_id or "",
        tick=tick,
        event_type=event_type,
        component="MEMORY_ALLOCATOR",
        description=description,
        details=details or {},
    )
